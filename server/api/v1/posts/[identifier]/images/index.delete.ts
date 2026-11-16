import { apiErrorFromException } from '~~/server/utils/api'
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

    const record = await db.query.post_images.findFirst({ where: eq(schema.post_images.id, id) })
    if (!record || record.post_id !== apiPost.id) return apiError(event, 404, 'NOT_FOUND', 'Image not found')

    const deletion = await schedulePostMediaDeletion(apiPost.id, record.pathname, ([pathname]) =>
      db.delete(schema.post_images).where(and(
        eq(schema.post_images.id, record.id),
        postMediaGcJobExists(apiPost.id, pathname!),
      )),
    )

    return apiSuccess(event, { id: record.id, deleted: true, deletionScheduled: true, deleteAfter: deletion.deleteAfter })
  } catch (err: any) {
    console.error('[API v1] DELETE /posts/:id/images error:', err?.message || err)
    return apiErrorFromException(event, err, 'Failed to delete image')
  }
})
