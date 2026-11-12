import { asc, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireCurrentUserSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  const session = await requireCurrentUserSession(event)
  const post = await getPostByIdentifier(db, decodeURIComponent(getRouterParam(event, 'identifier') ?? ''))
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (session.user.role !== 'admin' && (session.user.id !== post.user_id || session.user.role !== 'writer')) {
    throw createError({ statusCode: 403, statusMessage: 'Only the post owner or an administrator can manage collaborators' })
  }

  return db.select({
    user_id: schema.post_collaborators.user_id,
    name: schema.users.name,
    email: schema.users.email,
    role: schema.users.access_role,
    can_edit: schema.post_collaborators.can_edit,
    can_publish: schema.post_collaborators.can_publish,
  }).from(schema.post_collaborators)
    .innerJoin(schema.users, eq(schema.users.id, schema.post_collaborators.user_id))
    .where(eq(schema.post_collaborators.post_id, post.id))
    .orderBy(asc(schema.users.name))
})
