// DELETE /api/posts/:identifier
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { requireCurrentUserSession } from '~~/server/utils/api'
import { postBlobGcJobsExist, schedulePostBlobPurge } from '~~/server/utils/postMediaGc'
export default defineEventHandler(async (event) => {
  const session = await requireCurrentUserSession(event)
  const database = db

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) { throw createError({ statusCode: 400, message: 'Post identifier is required' }) }

  const userId = session.user.id
  const apiPost: ApiPost | null = await getPostByIdentifier(database, identifier)
  
  if (!apiPost) { throw createError({ statusCode: 404, message: 'Post not found.' })}
  await assertPostPermission({ id: session.user.id, role: session.user.role }, apiPost, 'edit')
  if (apiPost.user_id !== userId && session.user.role !== 'admin') { throw createError({ statusCode: 403, message: "You are not authorized to delete this post" }) }

  const cleanup = await schedulePostBlobPurge(apiPost.id, apiPost.slug, (postId, prefixes) =>
    database.delete(schema.posts).where(and(
      eq(schema.posts.id, postId),
      session.user.role === 'admin'
        ? eq(schema.posts.id, postId)
        : eq(schema.posts.user_id, userId),
      postBlobGcJobsExist(postId, prefixes),
    )),
  )

  return {
    message: "Post deleted successfully",
    post: convertApiToPost(apiPost, { userName: session.user.name }),
    deletionScheduled: true,
    deleteAfter: cleanup.deleteAfter,
    success: true,
  }
})
