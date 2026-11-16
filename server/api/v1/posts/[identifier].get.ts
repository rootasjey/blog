import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { getBearerToken, requireApiKey, requireCurrentUserSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) {
      return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')
    }

    let actor: { id: number; role: string; authMethod?: 'session' | 'api_key'; apiKeyScopes?: string[]; apiKeyPostIds?: number[] } | null = null
    let invalidBearer = false
    const hasBearerCredentials = getBearerToken(getRequestHeader(event, 'authorization')) !== null
    try {
      const session = await requireCurrentUserSession(event)
      actor = { id: session.user.id, role: session.user.role, authMethod: 'session' }
    } catch {
      if (hasBearerCredentials) {
        try {
          // A Bearer key can read private posts when its scope and post limit allow it.
          actor = await requireApiKey(event)
        } catch {
          invalidBearer = true
        }
      }
    }

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) {
      return apiError(event, 404, 'NOT_FOUND', `Post "${identifier}" not found`)
    }

    if (apiPost.status !== 'published') {
      if (!actor && invalidBearer) {
        return apiError(event, 401, 'UNAUTHORIZED', 'Invalid or expired API key')
      }
      if (!actor || !(await hasPostPermission(actor, apiPost, 'read'))) {
        return apiError(event, 403, 'FORBIDDEN', 'You are not authorized to view this post')
      }
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
    console.error('[API v1] GET /posts/:identifier error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch post')
  }
})
