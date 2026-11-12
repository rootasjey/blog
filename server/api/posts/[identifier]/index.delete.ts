// DELETE /api/posts/:identifier
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { requireCurrentUserSession } from '~~/server/utils/api'
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

  if (apiPost.blob_path) { await blob.del(apiPost.blob_path) }

  if (apiPost.image_src) {
    const prefix = apiPost.image_src as string
    const blobList = await blob.list({ prefix })
    
    for (const blobItem of blobList.blobs) {
      await blob.del(blobItem.pathname)
    }
  }

  // Delete by numeric id (safer) — `getPostByIdentifier` already resolved the post
  const deleteResult = await database
    .delete(schema.posts)
    .where(and(eq(schema.posts.id, apiPost.id), eq(schema.posts.user_id, userId)))
    .run()

  const rowsDeleted = Number((deleteResult as any)?.rowsAffected ?? (deleteResult as any)?.meta?.changes ?? (deleteResult as any)?.meta?.rows_written ?? 0)
  if (!rowsDeleted) {
    throw createError({ statusCode: 500, message: 'Failed to delete post' })
  }

  return {
    message: "Post deleted successfully",
    post: convertApiToPost(apiPost, { userName: session.user.name }),
    success: true,
  }
})
