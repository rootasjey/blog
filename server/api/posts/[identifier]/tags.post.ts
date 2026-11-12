// POST /api/posts/:id/tags
// Body: { tagIds: number[] }
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { getPostByIdentifier } from '~~/server/utils/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const identifier = getRouterParam(event, 'identifier') || ''

  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: 'Post identifier (id or slug) is required' })
  }

  const body = await readBody(event)

  if (!Array.isArray(body?.tagIds)) {
    throw createError({ statusCode: 400, statusMessage: 'tagIds is required' })
  }

  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  await assertPostPermission({ id: session.user.id, role: session.user.role }, post, 'edit')

  await db.delete(schema.post_tags).where(eq(schema.post_tags.post_id, post.id)).run()

  for (const tagId of body.tagIds) {
    await db.insert(schema.post_tags).values({ post_id: post.id, tag_id: tagId }).run()
  }

  const tags = await db
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, post.id))
    .orderBy(sql`tags.name ASC`)

  return tags.map((row: any) => row.tag)
})
