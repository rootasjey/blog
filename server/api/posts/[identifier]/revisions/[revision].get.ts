import { db } from 'hub:db'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { getPostRevision } from '~~/server/utils/postRevisions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const revision = Number(getRouterParam(event, 'revision'))
  if (!Number.isInteger(revision) || revision < 0) throw createError({ statusCode: 400, statusMessage: 'Invalid revision' })

  const post = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  await assertPostPermission({ id: session.user.id, role: session.user.role, authMethod: 'session' }, post, 'edit')

  const result = await getPostRevision(post.id, revision)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  return { revision: result.row.revision, article: result.article }
})
