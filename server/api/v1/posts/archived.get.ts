import { db, schema } from 'hub:db'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    if (user.authMethod === 'api_key' && !user.apiKeyScopes?.includes('*') && !user.apiKeyPostIds?.length) {
      return apiSuccess(event, [])
    }
    const query = getQuery(event)
    const search = query.search as string

    const conditions = [eq(schema.posts.status, 'archived')]
    if (user.authMethod === 'api_key') {
      if (user.apiKeyScopes?.includes('*')) {
        conditions.push(eq(schema.posts.user_id, user.id))
      } else {
        conditions.push(inArray(schema.posts.id, user.apiKeyPostIds ?? []))
      }
    } else {
      conditions.push(eq(schema.posts.user_id, user.id))
    }
    if (search?.trim()) {
      const pattern = `%${search.trim()}%`
      conditions.push(sql`(posts.name LIKE ${pattern} OR COALESCE(posts.description, '') LIKE ${pattern})`)
    }

    const results = await db
      .select({ post: schema.posts })
      .from(schema.posts)
      .where(and(...conditions))
      .orderBy(desc(schema.posts.created_at))
      .limit(25)

    const apiPosts = (results as any[]).map((r: any) => r.post)

    const archivedPosts = await Promise.all(apiPosts.map(async (apiPost: any) => {
      const tagRows = await db
        .select({ tag: schema.tags })
        .from(schema.tags)
        .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
        .where(eq(schema.post_tags.post_id, apiPost.id))
        .orderBy(sql`post_tags.rowid ASC`)

      return convertApiToPost(apiPost, {
        tags: tagRows.map((r: any) => r.tag),
        userName: user.name,
      })
    }))

    return apiSuccess(event, archivedPosts)
  } catch (err: any) {
    console.error('[API v1] GET /posts/archived error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch archived posts')
  }
})
