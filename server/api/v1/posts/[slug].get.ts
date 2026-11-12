import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { requireCurrentUserSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const identifier = decodeURIComponent(getRouterParam(event, 'slug') ?? '')
    if (!identifier) {
      return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')
    }

    let actor: { id: number; role: string; authMethod: 'session' } | null = null
    try {
      const session = await requireCurrentUserSession(event)
      actor = { id: session.user.id, role: session.user.role, authMethod: 'session' }
    } catch {
      // Published posts stay public; private posts require a current session.
    }

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) {
      return apiError(event, 404, 'NOT_FOUND', `Post "${identifier}" not found`)
    }

    if (apiPost.status !== 'published' && (!actor || !(await hasPostPermission(actor, apiPost, 'read')))) {
      return apiError(event, 403, 'FORBIDDEN', 'You are not authorized to view this post')
    }

    const tagRows = await db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, apiPost.id))
      .orderBy(sql`post_tags.rowid ASC`)

    const articleBlob = await blob.get(apiPost.blob_path as string)
    const article = await articleBlob?.text() ?? ''

    const post = convertApiToPost(apiPost, {
      tags: tagRows.map((r: any) => r.tag),
      article,
      userName: apiPost.user_name,
      userAvatar: apiPost.user_avatar,
    })

    try {
      await db
        .update(schema.posts)
        .set({ metrics_views: sql`${schema.posts.metrics_views} + 1` })
        .where(eq(schema.posts.id, apiPost.id))
        .run()
    } catch { }

    return apiSuccess(event, post)
  } catch (err: any) {
    console.error('[API v1] GET /posts/:slug error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch post')
  }
})
