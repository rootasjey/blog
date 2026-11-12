import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireCurrentUserSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  const session = await requireCurrentUserSession(event)
  const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (session.user.role !== 'admin' && (session.user.id !== post.user_id || session.user.role !== 'writer')) {
    throw createError({ statusCode: 403, statusMessage: 'Only the post owner or an administrator can manage collaborators' })
  }
  const userId = Number(getRouterParam(event, 'userId'))
  if (!Number.isInteger(userId) || userId < 1) throw createError({ statusCode: 400, statusMessage: 'Invalid collaborator ID' })

  await db.delete(schema.post_collaborators).where(and(
    eq(schema.post_collaborators.post_id, post.id),
    eq(schema.post_collaborators.user_id, userId),
  )).run()
  return { success: true, userId }
})
