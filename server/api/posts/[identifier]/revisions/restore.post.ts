import { db } from 'hub:db'
import { z } from 'zod'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { getPostRevision, savePostRevision } from '~~/server/utils/postRevisions'

const bodySchema = z.object({
  revision: z.number().int().nonnegative(),
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const body = await readValidatedBody(event, bodySchema.parse)
  const post = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  await assertPostPermission({ id: session.user.id, role: session.user.role, authMethod: 'session' }, post, 'edit')

  const selected = await getPostRevision(post.id, body.revision)
  if (!selected) throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  const saved = await savePostRevision({
    post,
    actorId: session.user.id,
    article: selected.article as Record<string, unknown>,
    expectedRevision: body.expectedRevision,
    source: 'restore',
  })

  return { success: true, restoredRevision: body.revision, revision: saved.revision }
})
