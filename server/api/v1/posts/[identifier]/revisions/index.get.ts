import { db } from 'hub:db'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { listPostRevisions } from '~~/server/utils/postRevisions'

export default defineEventHandler(async (event) => {
  try {
    const actor = await requireWriteAccess(event)
    const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
    if (!post) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    await assertPostPermission(actor, post, 'edit')
    return apiSuccess(event, await listPostRevisions(post.id))
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500
    if (statusCode === 401) return apiError(event, 401, 'UNAUTHORIZED', 'Authentication required')
    if (statusCode === 403) return apiError(event, 403, 'FORBIDDEN', error.statusMessage || 'Not authorized')
    console.error('[API v1] GET post revisions error:', error?.message || error)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch revisions')
  }
})
