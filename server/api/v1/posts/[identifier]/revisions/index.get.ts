import { apiErrorFromException } from '~~/server/utils/api'
import { db } from 'hub:db'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { listPostRevisions } from '~~/server/utils/postRevisions'
import { buildMeta, parsePagination } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const { page, limit, offset } = parsePagination(getQuery(event), 50)
    const actor = await requireWriteAccess(event)
    const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
    if (!post) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    await assertPostPermission(actor, post, 'edit')
    const result = await listPostRevisions(post.id, limit, offset)
    return apiSuccess(event, result.items, buildMeta(page, limit, result.total))
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500
    if (statusCode === 401) return apiError(event, 401, 'UNAUTHORIZED', 'Authentication required')
    if (statusCode === 403) return apiError(event, 403, 'FORBIDDEN', error.statusMessage || 'Not authorized')
    console.error('[API v1] GET post revisions error:', error?.message || error)
    return apiErrorFromException(event, error, 'Failed to fetch revisions')
  }
})
