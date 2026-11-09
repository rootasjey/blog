import type { User } from '#auth-utils'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const userId = session.user.id

    const user = await db.query.users.findFirst({
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

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return {
      success: true,
      data: user as unknown as User,
    }

  } catch (error: any) {
    if (error.statusCode) { throw error }
    console.error('Error fetching user profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
