import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { requireCurrentUserSession } from '~~/server/utils/api'

const bodySchema = z.object({
  userId: z.number().int().positive(),
  canEdit: z.boolean(),
  canPublish: z.boolean().default(false),
}).strict().refine(value => !value.canPublish || value.canEdit)

export default defineEventHandler(async (event) => {
  const session = await requireCurrentUserSession(event)
  const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (session.user.role !== 'admin' && (session.user.id !== post.user_id || session.user.role !== 'writer')) {
    throw createError({ statusCode: 403, statusMessage: 'Only the post owner or an administrator can manage collaborators' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  if (body.userId === post.user_id) throw createError({ statusCode: 400, statusMessage: 'The post owner cannot be added as a collaborator' })
  const collaborator = await db.query.users.findFirst({ where: eq(schema.users.id, body.userId) })
  if (!collaborator) throw createError({ statusCode: 404, statusMessage: 'Collaborator not found' })
  if (collaborator.access_role !== 'editor' && collaborator.access_role !== 'writer') {
    throw createError({ statusCode: 400, statusMessage: 'Only editors and writers can collaborate on posts' })
  }

  await db.insert(schema.post_collaborators).values({
    post_id: post.id,
    user_id: collaborator.id,
    invited_by: session.user.id,
    can_edit: body.canEdit,
    can_publish: body.canPublish,
    updated_at: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: [schema.post_collaborators.post_id, schema.post_collaborators.user_id],
    set: { can_edit: body.canEdit, can_publish: body.canPublish, updated_at: new Date().toISOString() },
  }).run()

  return { success: true, userId: collaborator.id, canEdit: body.canEdit, canPublish: body.canPublish }
})
