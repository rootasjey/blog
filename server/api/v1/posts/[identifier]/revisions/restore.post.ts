import { db } from 'hub:db'
import { z } from 'zod'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { getPostRevision, savePostRevision } from '~~/server/utils/postRevisions'

const bodySchema = z.object({
  revision: z.number().int().nonnegative(),
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export default defineEventHandler(async (event) => {
  try {
    const actor = await requireWriteAccess(event)
    const body = bodySchema.parse(await readBody(event))
    const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
    if (!post) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    await assertPostPermission(actor, post, 'edit')

    const selected = await getPostRevision(post.id, body.revision)
    if (!selected) return apiError(event, 404, 'NOT_FOUND', 'Revision not found')
    const saved = await savePostRevision({
      post,
      actorId: actor.id,
      article: selected.article as Record<string, unknown>,
      expectedRevision: body.expectedRevision,
      source: 'restore',
    })
    return apiSuccess(event, { restoredRevision: body.revision, revision: saved.revision })
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500
    if (statusCode === 409) return apiError(event, 409, 'REVISION_CONFLICT', error.statusMessage || 'Article revision conflict')
    if (statusCode === 403) return apiError(event, 403, 'FORBIDDEN', error.statusMessage || 'Not authorized')
    if (statusCode === 400) return apiError(event, 400, 'VALIDATION_ERROR', error.statusMessage || 'Invalid payload')
    console.error('[API v1] POST restore revision error:', error?.message || error)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to restore revision')
  }
})
