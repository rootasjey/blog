import { db, schema } from 'hub:db'
import { eq, desc } from 'drizzle-orm'
import { requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  try {
    const rows = await db
      .select({
        id: schema.api_keys.id,
        name: schema.api_keys.name,
        prefix: schema.api_keys.prefix,
        scopes: schema.api_keys.scopes,
        post_ids: schema.api_keys.post_ids,
        created_at: schema.api_keys.created_at,
        last_used_at: schema.api_keys.last_used_at,
        revoked_at: schema.api_keys.revoked_at,
        user: {
          id: schema.users.id,
          name: schema.users.name,
          slug: schema.users.slug,
        },
      })
      .from(schema.api_keys)
      .innerJoin(schema.users, eq(schema.users.id, schema.api_keys.user_id))
      .orderBy(desc(schema.api_keys.created_at))

    return apiSuccess(event, rows)
  } catch (err: any) {
    console.error('[API v1] GET /api-keys error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch API keys')
  }
})
