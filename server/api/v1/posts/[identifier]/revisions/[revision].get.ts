import { db } from 'hub:db'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { getPostRevision } from '~~/server/utils/postRevisions'

export default defineEventHandler(async (event) => {
  try {
    const actor = await requireWriteAccess(event)
    const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
    const revision = Number(getRouterParam(event, 'revision'))
    if (!Number.isInteger(revision) || revision < 0) return apiError(event, 400, 'BAD_REQUEST', 'Invalid revision')
    if (!post) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    await assertPostPermission(actor, post, 'edit')

    const result = await getPostRevision(post.id, revision)
    if (!result) return apiError(event, 404, 'NOT_FOUND', 'Revision not found')
    return apiSuccess(event, { revision: result.row.revision, article: result.article })
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500
    if (statusCode === 403) return apiError(event, 403, 'FORBIDDEN', error.statusMessage || 'Not authorized')
    console.error('[API v1] GET post revision error:', error?.message || error)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch revision')
  }
})
