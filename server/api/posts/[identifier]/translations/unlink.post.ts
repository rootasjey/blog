import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { getPostByIdentifier } from '~~/server/utils/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const body = await readBody(event)
  const targetId = Number(body?.postId)
  if (!targetId) throw createError({ statusCode: 400, message: 'Target post ID is required' })

  const apiPost: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!apiPost) throw createError({ statusCode: 404, message: 'Post not found' })

  await assertPostPermission({ id: session.user.id, role: session.user.role }, apiPost, 'edit')

  await db.update(schema.posts).set({ translation_group_id: null }).where(eq(schema.posts.id, targetId)).run()

  return { success: true }
})
