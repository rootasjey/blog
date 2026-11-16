import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export type ApiMeta = {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export type AuthenticatedUser = {
  id: number
  name: string
  email: string
  role: string
  slug?: string | null
  authMethod?: 'session' | 'api_key'
  apiKeyScopes?: string[]
  apiKeyPostIds?: number[]
}

export function getInsertedRowId(result: unknown): number {
  const insertResult = result as { lastInsertRowid?: number | string; meta?: { last_row_id?: number | string } } | null
  const rawId = insertResult?.lastInsertRowid ?? insertResult?.meta?.last_row_id
  const id = Number(rawId)
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}

export function apiSuccess<T>(event: any, data: T, meta?: ApiMeta) {
  setResponseStatus(event, 200)
  setResponseHeader(event, 'content-type', 'application/json')
  return { data, meta }
}

export function apiCreated<T>(event: any, data: T) {
  setResponseStatus(event, 201)
  setResponseHeader(event, 'content-type', 'application/json')
  return { data }
}

export function apiError(event: any, statusCode: number, code: string, message: string) {
  setResponseStatus(event, statusCode)
  setResponseHeader(event, 'content-type', 'application/json')
  return { error: { code, message } }
}

export function apiErrorFromException(event: any, error: unknown, fallbackMessage: string) {
  const statusCode = Number((error as { statusCode?: unknown } | null)?.statusCode)
  if (statusCode >= 400 && statusCode < 500) {
    const errors: Record<number, { code: string; message: string }> = {
      400: { code: 'BAD_REQUEST', message: 'Request could not be processed' },
      401: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      403: { code: 'FORBIDDEN', message: 'You are not authorized to perform this action' },
      404: { code: 'NOT_FOUND', message: 'Resource not found' },
      409: { code: 'CONFLICT', message: 'Request conflicts with the current resource state' },
      422: { code: 'VALIDATION_ERROR', message: 'Request validation failed' },
    }
    const response = errors[statusCode] ?? { code: 'REQUEST_ERROR', message: 'Request could not be processed' }
    return apiError(event, statusCode, response.code, response.message)
  }

  return apiError(event, 500, 'INTERNAL_ERROR', fallbackMessage)
}

export function parsePagination(query: any, maxLimit = 50) {
  let page = Number.parseInt(query.page as string || '1', 10)
  let limit = Number.parseInt(query.limit as string || '25', 10)
  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(limit) || limit < 1) limit = 25
  if (limit > maxLimit) limit = maxLimit
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function buildMeta(page: number, limit: number, total: number): ApiMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}

const API_KEY_PREFIX = 'ene_'

export function getBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function generateApiKey(): Promise<{ raw: string; hash: string; prefix: string }> {
  const rawBytes = new Uint8Array(32)
  crypto.getRandomValues(rawBytes)
  const raw = hex(rawBytes)
  const fullKey = `${API_KEY_PREFIX}${raw}`
  const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullKey))
  const hash = hex(new Uint8Array(hashBytes))
  const prefix = fullKey.slice(0, 12)
  return { raw: fullKey, hash, prefix }
}

export async function verifyApiKey(rawKey: string): Promise<{ valid: boolean; user?: AuthenticatedUser }> {
  const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))
  const hash = hex(new Uint8Array(hashBytes))

  const rows = await db
    .select()
    .from(schema.api_keys)
    .innerJoin(schema.users, eq(schema.users.id, schema.api_keys.user_id))
    .where(eq(schema.api_keys.hash, hash))
    .limit(1)

  if (!rows.length) return { valid: false }

  const row = rows[0] as any
  if (row.api_keys.revoked_at) return { valid: false }
  if (row.api_keys.expires_at) {
    const expiresAt = Date.parse(row.api_keys.expires_at)
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return { valid: false }
  }

  await db
    .update(schema.api_keys)
    .set({ last_used_at: new Date().toISOString() })
    .where(eq(schema.api_keys.id, row.api_keys.id))
    .run()

  return {
    valid: true,
    user: {
      id: row.users.id,
      name: row.users.name,
      email: row.users.email,
      role: row.users.access_role,
      slug: row.users.slug,
      authMethod: 'api_key',
      apiKeyScopes: parseStringList(row.api_keys.scopes),
      apiKeyPostIds: parseNumberList(row.api_keys.post_ids),
    },
  }
}

export async function requireApiKey(event: any): Promise<AuthenticatedUser> {
  const header = getRequestHeader(event, 'authorization')
  const rawKey = getBearerToken(header)
  if (!rawKey) {
    throw createError({
      statusCode: 401,
      message: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }),
    })
  }

  const result = await verifyApiKey(rawKey)
  if (!result.valid || !result.user) {
    throw createError({
      statusCode: 401,
      message: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Invalid or revoked API key' }),
    })
  }

  return result.user
}

export async function requireWriteAccess(event: any): Promise<AuthenticatedUser> {
  try {
    const session = await requireCurrentUserSession(event)
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      slug: session.user.slug,
      authMethod: 'session',
    }
  } catch {
    const user = await requireApiKey(event)
    const pathname = getRequestURL(event).pathname
    const method = getMethod(event).toUpperCase()
    let requiredScope = 'api:access'

    if (pathname.includes('/posts/')) {
      requiredScope = method === 'GET' || method === 'HEAD' ? 'posts:read' : 'posts:write'
    } else if (pathname.includes('/ai/')) {
      requiredScope = 'ai:run'
    }

    if (!user.apiKeyScopes?.includes('*') && !user.apiKeyScopes?.includes(requiredScope)) {
      throw createError({ statusCode: 403, message: 'API key does not include the required scope' })
    }

    user.role = 'agent'
    return user
  }
}

export async function requireCurrentUserSession(event: any) {
  const session = await requireUserSession(event)
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.user.id),
    columns: { access_role: true },
  })

  if (!user) {
    throw createError({ statusCode: 401, message: 'Session user no longer exists' })
  }

  const currentSession = { ...session, user: { ...session.user, role: user.access_role } }
  if (session.user.role !== user.access_role) {
    await setUserSession(event, currentSession)
  }
  return currentSession
}

export async function requireAdminSession(event: any) {
  const session = await requireCurrentUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }
  return session
}

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function parseNumberList(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is number => Number.isInteger(item) && item > 0) : []
  } catch {
    return []
  }
}
