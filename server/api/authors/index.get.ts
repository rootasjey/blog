import { db, schema } from 'hub:db'
import { count, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const authorsQuery = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      slug: schema.users.slug,
      avatar: schema.users.avatar,
      biography: schema.users.biography,
      job: schema.users.job,
      location: schema.users.location,
      socials: schema.users.socials,
    })
    .from(schema.users)
    .orderBy(schema.users.name)
  const postCountsQuery = db
    .select({
      userId: schema.post_authors.user_id,
      postCount: count(),
    })
    .from(schema.post_authors)
    .innerJoin(schema.posts, eq(schema.posts.id, schema.post_authors.post_id))
    .where(eq(schema.posts.status, 'published'))
    .groupBy(schema.post_authors.user_id)

  const [rows, postCounts] = await Promise.all([authorsQuery, postCountsQuery])

  const postCountsByUserId = new Map(postCounts.map(row => [row.userId, row.postCount]))

  return rows.map((row) => ({
    ...row,
    postCount: postCountsByUserId.get(row.id) ?? 0,
    socials: safeParseJson(row.socials),
  }))
})

function safeParseJson(val: string | null | undefined) {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : parsed ?? []
  } catch {
    return []
  }
}
