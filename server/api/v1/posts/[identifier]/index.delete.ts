import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { postBlobGcJobsExist, schedulePostBlobPurge } from '~~/server/utils/postMediaGc'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    if (user.authMethod === 'api_key') {
      return apiError(event, 403, 'FORBIDDEN', 'API keys cannot delete posts')
    }
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    if (!(await hasPostPermission(user, apiPost, 'edit'))) return apiError(event, 403, 'FORBIDDEN', 'Not authorized')
    if (user.role !== 'admin' && apiPost.user_id !== user.id) return apiError(event, 403, 'FORBIDDEN', 'Not authorized')

    const cleanup = await schedulePostBlobPurge(apiPost.id, apiPost.slug, (postId, prefixes) =>
      db.delete(schema.posts).where(and(
        eq(schema.posts.id, postId),
        postBlobGcJobsExist(postId, prefixes),
      )),
    )

    return apiSuccess(event, {
      id: apiPost.id,
      deleted: true,
      deletionScheduled: true,
      deleteAfter: cleanup.deleteAfter,
    })
  } catch (err: any) {
    console.error('[API v1] DELETE /posts/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to delete post')
  }
})
