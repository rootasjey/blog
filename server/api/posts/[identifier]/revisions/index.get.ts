import { db } from 'hub:db'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { listPostRevisions } from '~~/server/utils/postRevisions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const post = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  await assertPostPermission({ id: session.user.id, role: session.user.role, authMethod: 'session' }, post, 'edit')
  return listPostRevisions(post.id)
})
