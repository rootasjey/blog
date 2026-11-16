import { db, schema } from 'hub:db'
import { z } from 'zod'
import { requireAdminSession } from '~~/server/utils/api'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(z.enum(['posts:read', 'posts:write', 'ai:run', 'api:access'])).min(1).max(4).default(['posts:read', 'posts:write']),
  postIds: z.array(z.number().int().positive()).max(100).default([]),
  expiresInDays: z.number().int().min(1).max(365).default(90),
}).strict()

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event)

  try {
    const parsed = bodySchema.safeParse(await readBody(event))
    if (!parsed.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid API key settings')
    const { name, scopes, postIds, expiresInDays } = parsed.data
    const requiresPostScope = scopes.some(scope => scope.startsWith('posts:') || scope === 'ai:run')
    if (requiresPostScope && postIds.length === 0) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Write and AI keys must be limited to at least one post')
    }

    const { raw, hash, prefix } = await generateApiKey()
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

    await db.insert(schema.api_keys).values({
      user_id: session.user.id,
      name,
      hash,
      prefix,
      scopes: JSON.stringify(scopes),
      post_ids: JSON.stringify([...new Set(postIds)]),
      expires_at: expiresAt,
    }).run()

    return apiCreated(event, {
      name,
      prefix,
      scopes,
      postIds: [...new Set(postIds)],
      expiresAt,
      key: raw,
      message: 'Save this key — it will not be shown again',
    })
  } catch (err: any) {
    console.error('[API v1] POST /api-keys error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create API key')
  }
})
