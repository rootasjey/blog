// DELETE /api/tags/:id
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const idParam = event.context.params?.id
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'Tag id is required' })
  }

  const id = Number(idParam)
  const result = await db.delete(schema.tags).where(eq(schema.tags.id, id)).run()
  const rowsWritten = Number((result as any)?.rowsAffected ?? (result as any)?.meta?.changes ?? (result as any)?.meta?.rows_written ?? 0)

  if (!rowsWritten) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  return { id }
})
