import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const user = await db.query.users.findFirst({ columns: { avatar: true }, where: eq(schema.users.id, session.user.id) })
    if (!user) return apiError(event, 404, 'NOT_FOUND', 'User not found')

    if (user.avatar) {
      const avatarFolder = `users/${session.user.id}/avatar/`
      const avatarPath = user.avatar.replace(/^\/+/, '')
      if (avatarPath.startsWith(avatarFolder)) {
        const blobList = await blob.list({ prefix: avatarFolder })
        for (const b of blobList.blobs) await blob.del(b.pathname)
      }
    }

    await db.update(schema.users).set({ avatar: '', updated_at: new Date().toISOString() }).where(eq(schema.users.id, session.user.id)).run()
    await replaceUserSession(event, { user: { ...session.user, avatar: '' } })

    return apiSuccess(event, { deleted: true })
  } catch (err: any) {
    console.error('[API v1] DELETE /user/avatar error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to delete avatar')
  }
})
