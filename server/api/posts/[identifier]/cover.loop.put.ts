import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const body = await readBody<{ loop?: unknown }>(event)

  if (typeof body?.loop !== 'boolean') {
    throw createError({ statusCode: 400, message: 'Loop must be a boolean' })
  }

  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  if (!post.image_src || !['mp4', 'webm'].includes(post.image_ext ?? '')) {
    throw createError({ statusCode: 400, message: 'Loop can only be changed for video covers' })
  }

  await assertPostPermission({ id: session.user.id, role: session.user.role }, post, 'edit')
  await db.update(schema.posts)
    .set({ image_loop: body.loop, updated_at: new Date().toISOString() })
    .where(eq(schema.posts.id, post.id))
    .run()

  return { success: true, loop: body.loop }
})
