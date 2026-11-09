import type { User } from '#auth-utils'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{1,64}$/i, 'Slug must be lowercase letters, numbers, or hyphens')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  biography: z.string().max(1000, 'Biography too long').optional(),
  job: z.string().max(100, 'Job title too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
  socials: z.string().optional() // JSON string, we'll validate JSON format separately
})

export default eventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const userId = session.user.id
    const body = await readBody(event)

    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: validationResult.error.issues
      })
    }

    const updateData = validationResult.data

    if (updateData.socials) {
      try {
        JSON.parse(updateData.socials)
      } catch {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid socials JSON format'
        })
      }
    }

    type UserInsert = typeof schema.users.$inferInsert
    const updatePayload = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    ) as Partial<UserInsert>

    if (Object.keys(updatePayload).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    try {
      await db.update(schema.users)
        .set({
          ...updatePayload,
          updated_at: new Date().toISOString(),
        })
        .where(eq(schema.users.id, userId))
        .run()
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (error.message.includes('idx_users_email')) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Email already exists'
          })
        }
        if (error.message.includes('idx_users_name')) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Username already exists'
          })
        }
        if (error.message.includes('idx_users_slug')) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Slug already exists'
          })
        }
      }
      
      console.error('Database error updating user profile:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile'
      })
    }

    const updatedUser = await db.query.users.findFirst({
      columns: {
        id: true,
        name: true,
        slug: true,
        email: true,
        avatar: true,
        biography: true,
        job: true,
        location: true,
        language: true,
        socials: true,
        created_at: true,
        updated_at: true,
      },
      where: eq(schema.users.id, userId),
    })

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Update session with new user data
    await replaceUserSession(event, {
      user: {
        ...session.user,
        ...(updatedUser as unknown as User),
      }
    })

    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    }

  } catch (error: any) {
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    console.error('Unexpected error updating user profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
