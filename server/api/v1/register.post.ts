import { db, schema } from 'hub:db'
import { eq, or } from 'drizzle-orm'
import { getInsertedRowId } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const name = String(body?.name || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!name || name.length < 2) return apiError(event, 400, 'VALIDATION_ERROR', 'Name must be at least 2 characters')
    if (!email || !email.includes('@')) return apiError(event, 400, 'VALIDATION_ERROR', 'Valid email is required')
    if (!password || password.length < 8) return apiError(event, 400, 'VALIDATION_ERROR', 'Password must be at least 8 characters')

    const existing = await db.query.users.findFirst({
      where: or(eq(schema.users.email, email), eq(schema.users.name, name)),
    })
    if (existing) return apiError(event, 409, 'CONFLICT', 'User with this email or name already exists')

    const hashedPassword = await hashPassword(password)

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'user'
    let slug = baseSlug
    const slugExists = await db.query.users.findFirst({ where: eq(schema.users.slug, slug) })
    if (slugExists) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    const result = await db.insert(schema.users).values({
      name, slug, email, password: hashedPassword,
      biography: String(body?.biography || ''),
      job: String(body?.job || ''),
      language: String(body?.language || 'en'),
      location: String(body?.location || ''),
      socials: String(body?.socials || '[]'),
      role: 'user', access_role: 'reader', avatar: '', email_verified: false,
    }).run()

    const insertedId = getInsertedRowId(result)
    if (!insertedId) return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create user')

    const newUser = await db.query.users.findFirst({ where: eq(schema.users.id, insertedId) })
    if (!newUser) return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to retrieve created user')

    const sessionUser = {
      avatar: newUser.avatar ?? '', biography: newUser.biography ?? '',
      created_at: newUser.created_at, email: newUser.email,
      id: newUser.id, job: newUser.job ?? '',
      language: newUser.language ?? 'en', location: newUser.location ?? '',
      name: newUser.name, slug: newUser.slug ?? '',
      role: newUser.access_role, socials: newUser.socials ?? '[]',
      updated_at: newUser.updated_at,
    }
    await setUserSession(event, { user: sessionUser })

    return apiCreated(event, sessionUser)
  } catch (err: any) {
    console.error('[API v1] POST /register error:', err?.message || err)
    if (err.message?.includes('UNIQUE')) return apiError(event, 409, 'CONFLICT', 'User already exists')
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to register')
  }
})
