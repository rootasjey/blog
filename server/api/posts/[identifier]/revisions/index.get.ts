import { db } from 'hub:db'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { listPostRevisions } from '~~/server/utils/postRevisions'
import { parsePagination } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  const { page, limit, offset } = parsePagination(getQuery(event), 50)
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const post = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  await assertPostPermission({ id: session.user.id, role: session.user.role, authMethod: 'session' }, post, 'edit')
  const result = await listPostRevisions(post.id, limit, offset)
  return { items: result.items, page, limit, total: result.total }
})
