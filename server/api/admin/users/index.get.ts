import { db, schema } from 'hub:db'
import { asc } from 'drizzle-orm'
import { requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  return db.select({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
    role: schema.users.access_role,
    created_at: schema.users.created_at,
  }).from(schema.users).orderBy(asc(schema.users.name))
})
