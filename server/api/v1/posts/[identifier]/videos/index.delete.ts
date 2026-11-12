import { blob } from 'hub:blob'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { isPostMediaReferencedInArticleHistory } from '~~/server/utils/postRevisions'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    if (!(await hasPostPermission(user, apiPost, 'edit'))) return apiError(event, 403, 'FORBIDDEN', 'Not authorized')

    const query = getQuery(event)
    const id = query.id ? Number(query.id) : null
    if (!id) return apiError(event, 400, 'VALIDATION_ERROR', 'Query parameter ?id= is required')

    const record = await db.query.post_videos.findFirst({ where: eq(schema.post_videos.id, id) })
    if (!record || record.post_id !== apiPost.id) return apiError(event, 404, 'NOT_FOUND', 'Video not found')

    const videoPath = record.pathname.replace(/^\/+/, '')
    const videoReferenced = await isPostMediaReferencedInArticleHistory(apiPost.id, videoPath, apiPost.blob_path)
    if (!videoReferenced) {
      try { await blob.del(videoPath) } catch {}
    }

    if (record.poster_path) {
      const posterPath = record.poster_path.replace(/^\/+/, '')
      const posterReferenced = await isPostMediaReferencedInArticleHistory(apiPost.id, posterPath, apiPost.blob_path)
      if (!posterReferenced) {
        try { await blob.del(posterPath) } catch {}
      }
    }
    await db.delete(schema.post_videos).where(eq(schema.post_videos.id, record.id)).run()

    return apiSuccess(event, { id: record.id, deleted: true })
  } catch (err: any) {
    console.error('[API v1] DELETE /posts/:id/videos error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to delete video')
  }
})
