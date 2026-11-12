import { hasPostPermission } from '~~/server/utils/postPermissions'
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { postMediaGcJobExists, schedulePostMediaDeletion } from '~~/server/utils/postMediaGc'

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

    const mediaPaths = record.poster_path ? [record.pathname, record.poster_path] : [record.pathname]
    const deletion = await schedulePostMediaDeletion(apiPost.id, mediaPaths, (pathnames) =>
      db.delete(schema.post_videos).where(and(
        eq(schema.post_videos.id, record.id),
        ...pathnames.map(pathname => postMediaGcJobExists(apiPost.id, pathname)),
      )),
    )

    return apiSuccess(event, { id: record.id, deleted: true, deletionScheduled: true, deleteAfter: deletion.deleteAfter })
  } catch (err: any) {
    console.error('[API v1] DELETE /posts/:id/videos error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to delete video')
  }
})
