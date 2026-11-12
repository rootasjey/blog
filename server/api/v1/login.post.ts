import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !password) return apiError(event, 400, 'VALIDATION_ERROR', 'Email and password are required')

    const userData = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
    if (!userData) return apiError(event, 401, 'UNAUTHORIZED', 'Bad credentials')

    const isValid = await verifyPassword(userData.password as string, password)
    if (!isValid) return apiError(event, 401, 'UNAUTHORIZED', 'Bad credentials')

    const sessionUser = {
      avatar: userData.avatar ?? '', biography: userData.biography ?? '',
      created_at: userData.created_at, email: userData.email,
      id: userData.id, job: userData.job ?? '',
      language: userData.language ?? 'en', location: userData.location ?? '',
      name: userData.name, slug: userData.slug ?? '',
      role: userData.access_role, socials: userData.socials ?? '[]',
      updated_at: userData.updated_at,
    }

    await setUserSession(event, { user: sessionUser })
    return apiSuccess(event, sessionUser)
  } catch (err: any) {
    console.error('[API v1] POST /login error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to login')
  }
})
