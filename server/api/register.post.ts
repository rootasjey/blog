import { db, schema } from 'hub:db'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{1,64}$/i, 'Slug must be lowercase letters, numbers, or hyphens')
    .optional(),
  email: z.string().email(),
  password: z.string().min(8),
  biography: z.string().optional(),
  job: z.string().optional(),
  language: z.string().optional(),
  location: z.string().optional(),
  socials: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { name, slug, email, password, biography, job, language, location, socials } = body

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: or(eq(schema.users.email, email), eq(schema.users.name, name)),
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'User with this email or name already exists'
      })
    }

    // Hash the password using nuxt-auth-utils script.
    const hashedPassword = await hashPassword(password)

    // Insert new user
    // Generate slug if not provided
    const baseSlug = (slug ?? name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64)
    let finalSlug = baseSlug || undefined

    if (finalSlug) {
      // Ensure uniqueness by appending -id after insert if collision occurs; here we pre-check
      const slugExists = await db.query.users.findFirst({ where: eq(schema.users.slug, finalSlug) })
      if (slugExists) {
        // Fallback: append a short random suffix
        finalSlug = `${finalSlug}-${Math.random().toString(36).slice(2, 6)}`
      }
    }

    const insertUser: typeof schema.users.$inferInsert = {
      name,
      slug: finalSlug ?? '',
      email,
      password: hashedPassword,
      biography: biography || '',
      job: job || '',
      language: language || 'en',
      location: location || '',
      socials: socials || '[]',
      role: 'user',
      access_role: 'reader',
      avatar: '',
      email_verified: false,
    }

    const result = await db.insert(schema.users).values(insertUser).run()

    const insertedId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

    if (!insertedId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user account'
      })
    }

    // Fetch the created user
    const newUser = await db.query.users.findFirst({ where: eq(schema.users.id, insertedId) })

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to retrieve created user'
      })
    }

    // Set user session
    const sessionUser = {
      avatar: newUser.avatar ?? '',
      biography: newUser.biography ?? '',
      created_at: newUser.created_at,
      email: newUser.email,
      id: newUser.id,
      job: newUser.job ?? '',
      language: newUser.language ?? 'en',
      location: newUser.location ?? '',
      name: newUser.name,
      slug: newUser.slug,
      role: newUser.access_role,
      socials: newUser.socials ?? '[]',
      updated_at: newUser.updated_at,
    }

    await setUserSession(event, { user: sessionUser })

    return {
      message: 'Account created successfully',
      user: sessionUser
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error during registration'
    })
  }
})
