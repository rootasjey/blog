import { and, eq, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { z } from 'zod'
import { isUserRole } from '~~/server/utils/postPermissions'
import { requireAdminSession } from '~~/server/utils/api'

const bodySchema = z.object({ role: z.enum(['reader', 'writer', 'editor', 'admin']) }).strict()

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const userId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(userId) || userId < 1) throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })
  const body = await readValidatedBody(event, bodySchema.parse)
  if (!isUserRole(body.role)) throw createError({ statusCode: 400, statusMessage: 'Invalid role' })

  const target = await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const conditions = [eq(schema.users.id, userId)]
  if (target.access_role === 'admin' && body.role !== 'admin') {
    conditions.push(
      eq(schema.users.access_role, 'admin'),
      sql`(SELECT COUNT(*) FROM ${schema.users} WHERE ${schema.users.access_role} = 'admin') > 1`,
    )
  }

  const result = await db.update(schema.users)
    .set({ access_role: body.role, updated_at: new Date().toISOString() })
    .where(and(...conditions))
    .run()

  const changes = Number((result as any)?.meta?.changes ?? (result as any)?.rowsAffected ?? 0)
  if (!changes) throw createError({ statusCode: 409, statusMessage: 'Role changed concurrently or the last administrator cannot be demoted' })

  return { success: true, user: { id: target.id, name: target.name, role: body.role } }
})
