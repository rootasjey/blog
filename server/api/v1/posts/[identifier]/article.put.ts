import { apiErrorFromException } from '~~/server/utils/api'
import { db } from 'hub:db'
import { z } from 'zod'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { savePostRevision } from '~~/server/utils/postRevisions'

const bodySchema = z.object({
  article: z.object({ type: z.literal('doc') }).passthrough(),
  expectedRevision: z.number().int().nonnegative(),
  source: z.enum(['editor', 'ai', 'api', 'restore']).default('api'),
}).strict()

export default defineEventHandler(async (event) => {
  try {
    const actor = await requireWriteAccess(event)
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const parsedBody = bodySchema.safeParse(await readBody(event))
    if (!parsedBody.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid article payload')
    const body = parsedBody.data
    const post = await getPostByIdentifier(db, identifier)
    if (!post) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    await assertPostPermission(actor, post, 'edit')

    const saved = await savePostRevision({
      post,
      actorId: actor.id,
      article: body.article,
      expectedRevision: body.expectedRevision,
      source: body.source,
    })

    return apiSuccess(event, { message: 'Article updated successfully', revision: saved.revision })
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500
    if (statusCode === 409) return apiError(event, 409, 'REVISION_CONFLICT', error.statusMessage || 'Article revision conflict')
    if (statusCode === 403) return apiError(event, 403, 'FORBIDDEN', error.statusMessage || 'Not authorized')
    if (statusCode === 400) return apiError(event, 400, 'VALIDATION_ERROR', error.statusMessage || 'Invalid article payload')
    console.error('[API v1] PUT /posts/:id/article error:', error?.message || error)
    return apiErrorFromException(event, error, 'Failed to update article')
  }
})
