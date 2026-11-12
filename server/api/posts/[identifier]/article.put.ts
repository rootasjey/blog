import { db } from 'hub:db'
import { z } from 'zod'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { savePostRevision } from '~~/server/utils/postRevisions'

const articleSchema = z.object({ type: z.literal('doc') }).passthrough()
const bodySchema = z.object({
  article: articleSchema,
  expectedRevision: z.number().int().nonnegative(),
  source: z.enum(['editor', 'ai', 'api', 'restore']).default('editor'),
}).strict()

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, statusMessage: 'Post identifier is required' })

  const body = await readValidatedBody(event, bodySchema.parse)
  const post = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  await assertPostPermission({ id: session.user.id, role: session.user.role, authMethod: 'session' }, post, 'edit')

  const saved = await savePostRevision({
    post,
    actorId: session.user.id,
    article: body.article,
    expectedRevision: body.expectedRevision,
    source: body.source,
  })

  return {
    success: true,
    message: 'Post article updated successfully',
    revision: saved.revision,
  }
})
