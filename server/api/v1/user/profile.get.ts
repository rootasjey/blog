import { apiErrorFromException } from '~~/server/utils/api'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)

    const profile = await db.query.users.findFirst({
      columns: {
        id: true, name: true, slug: true, email: true, avatar: true,
        biography: true, job: true, location: true, language: true,
        socials: true, created_at: true, updated_at: true,
      },
      where: eq(schema.users.id, user.id),
    })

    if (!profile) return apiError(event, 404, 'NOT_FOUND', 'User not found')

    return apiSuccess(event, profile)
  } catch (err: any) {
    console.error('[API v1] GET /user/profile error:', err?.message || err)
    return apiErrorFromException(event, err, 'Failed to fetch profile')
  }
})
