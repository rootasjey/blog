import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { hasPostPermission } from '~~/server/utils/postPermissions'

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

    if (apiPost.blob_path) await blob.del(apiPost.blob_path)
    if (apiPost.image_src) {
      const blobList = await blob.list({ prefix: apiPost.image_src })
      for (const item of blobList.blobs) {
        await blob.del(item.pathname)
      }
    }

    await db.delete(schema.posts).where(eq(schema.posts.id, apiPost.id)).run()

    return apiSuccess(event, { id: apiPost.id, deleted: true })
  } catch (err: any) {
    console.error('[API v1] DELETE /posts/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to delete post')
  }
})
