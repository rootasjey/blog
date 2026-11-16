import { apiErrorFromException } from '~~/server/utils/api'
import { db, schema } from 'hub:db'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    if (!(await hasPostPermission(user, apiPost, 'read'))) return apiError(event, 403, 'FORBIDDEN', 'Not authorized')

    const rows = await db
      .select()
      .from(schema.post_audios)
      .where(eq(schema.post_audios.post_id, apiPost.id))
      .orderBy(desc(schema.post_audios.created_at))

    return apiSuccess(event, rows)
  } catch (err: any) {
    console.error('[API v1] GET /posts/:id/audios error:', err?.message || err)
    return apiErrorFromException(event, err, 'Failed to fetch audios')
  }
})
