// GET /api/posts/:slug
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'
import { hasPostPermission } from '~~/server/utils/postPermissions'
export default defineEventHandler(async (event) => {
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const blobStorage = blob

  if (!identifier) {
    throw createError({
      statusCode: 400,
      message: 'Post identifier is required',
    })
  }

  let actor: { id: number; role: string; authMethod: 'session' } | null = null
  try {
    const session = await getUserSession(event) // (optional - for private projects)
    if (session && session.user) actor = { id: session.user.id, role: session.user.role, authMethod: 'session' }
  } catch (error) { /* No session, continue as anonymous user */ }

  const apiPost: ApiPost | null = await getPostByIdentifier(db, identifier)

  if (!apiPost) {
    throw createError({
      statusCode: 404,
      message: `Post "${identifier}" not found`
    })
  }

  const canRead = apiPost.status === 'published'
    ? true
    : actor ? await hasPostPermission(actor, apiPost, 'read') : false
  if (!canRead) {
    throw createError({
      statusCode: 403,
      message: 'You are not authorized to view this post',
    })
  }

  // Fetch tags from join table
  const tagRows = await db
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, apiPost.id))
    .orderBy(sql`post_tags.rowid ASC`)

  const authorRows = await db
    .select({
      id: schema.users.id,
      avatar: schema.users.avatar,
      biography: schema.users.biography,
      name: schema.users.name,
      slug: schema.users.slug,
    })
    .from(schema.post_authors)
    .innerJoin(schema.users, eq(schema.users.id, schema.post_authors.user_id))
    .where(eq(schema.post_authors.post_id, apiPost.id))
    .orderBy(schema.post_authors.position)

  const articleBlob = await blobStorage.get(apiPost.blob_path as string)
  const article = await articleBlob?.text() ?? ''
  const post = convertApiToPost(apiPost, {
    tags: tagRows.map((row: any) => row.tag),
    authors: authorRows,
    article,
    userAvatar: (apiPost as any).user_avatar,
    userName: (apiPost as any).user_name,
  })
  post.canEdit = actor ? await hasPostPermission(actor, apiPost, 'edit') : false

  try {
    await db
      .update(schema.posts)
      .set({ metrics_views: sql`${schema.posts.metrics_views} + 1` })
      .where(eq(schema.posts.id, apiPost.id))
      .run()
  } catch (error) {
    console.error(`Failed to update view count for post ${apiPost.id}:`, error)
  }

  return post
})
