import { and, asc, eq, exists, inArray, lte, ne, notExists, or, sql } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'

const DELETE_GRACE_MS = 24 * 60 * 60 * 1000
const FAILED_DELETE_RETRY_MS = 60 * 60 * 1000
const MAX_ITEMS_PER_RUN = 50
const MAX_POST_BLOBS_PER_RUN = 5_000

export async function schedulePostBlobPurge(
  postId: number,
  slug: string,
  removePost: (postId: number, prefixes: string[]) => any,
) {
  const now = new Date()
  const nowIso = now.toISOString()
  const slugToken = slug.replace(/^\/+|\/+$/g, '')
  const prefixes = new Set([`posts/${postId}/`])
  const slugSegments = slugToken.split('/')
  const safeSlug = slugToken && slugSegments.every(segment => segment && segment !== '.' && segment !== '..')
  if (safeSlug) {
    prefixes.add(`posts/${slugToken}/`)
  }
  const pathnamePrefixes = [...prefixes]
  const quietUntil = new Date(now.getTime() + DELETE_GRACE_MS).toISOString()
  const insertJobs = db.insert(schema.post_blob_gc).values(pathnamePrefixes.map(prefix => ({
    post_id: postId,
    slug: slugToken,
    prefix,
    status: 'pending',
    delete_after: nowIso,
    quiet_until: quietUntil,
    created_at: nowIso,
    updated_at: nowIso,
  }))).onConflictDoNothing()

  const result = await db.batch([insertJobs, removePost(postId, pathnamePrefixes)])
  const deletedPost = Number((result[1] as any)?.meta?.changes ?? (result[1] as any)?.rowsAffected ?? 0)
  if (!deletedPost) {
    throw createError({ statusCode: 409, statusMessage: 'Post changed before deletion' })
  }

  const jobs = await db.select().from(schema.post_blob_gc)
    .where(and(
      eq(schema.post_blob_gc.post_id, postId),
      inArray(schema.post_blob_gc.prefix, pathnamePrefixes),
    ))
  if (jobs.length !== pathnamePrefixes.length) {
    throw createError({ statusCode: 409, statusMessage: 'Post blob cleanup could not be scheduled' })
  }

  return { deleteAfter: jobs[0]!.delete_after }
}

export function postBlobGcJobsExist(postId: number, prefixes: string[]) {
  return and(...prefixes.map(prefix => exists(db.select({ id: schema.post_blob_gc.id })
    .from(schema.post_blob_gc)
    .where(and(
      eq(schema.post_blob_gc.post_id, postId),
      eq(schema.post_blob_gc.prefix, prefix),
    )))))
}

export async function collectScheduledPostBlobPurges(now = new Date()) {
  const nowIso = now.toISOString()
  const jobs = await db.select().from(schema.post_blob_gc)
    .where(and(
      inArray(schema.post_blob_gc.status, ['pending', 'deleting']),
      lte(schema.post_blob_gc.delete_after, nowIso),
    ))
    .orderBy(asc(schema.post_blob_gc.delete_after))
    .limit(MAX_ITEMS_PER_RUN)

  let deletedObjects = 0
  let completed = 0
  let deferred = 0
  let failed = 0

  for (const job of jobs) {
    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, job.post_id),
      columns: { id: true },
    })
    if (post) {
      await deferPostBlobPurge(job.id, now, FAILED_DELETE_RETRY_MS)
      deferred += 1
      continue
    }

    const token = job.prefix.slice('posts/'.length, -1)
    const validPrefixes = [`posts/${job.post_id}/`]
    const slugSegments = job.slug.split('/')
    const safeSlug = job.slug && slugSegments.every(segment => segment && segment !== '.' && segment !== '..')
    if (safeSlug) {
      validPrefixes.push(`posts/${job.slug}/`)
    }
    if (!job.prefix.startsWith('posts/') || !job.prefix.endsWith('/') || !validPrefixes.includes(job.prefix)) {
      console.error('[postBlobGc] Refusing unsafe post blob prefix', {
        postId: job.post_id,
        prefix: job.prefix,
      })
      await deferPostBlobPurge(job.id, now, FAILED_DELETE_RETRY_MS)
      deferred += 1
      continue
    }

    const numericPostId = /^\d+$/.test(token) ? Number(token) : null
    const overlappingSlug = sql`(
      ${schema.posts.slug} = ${token}
      OR substr(${schema.posts.slug}, 1, length(${token}) + 1) = ${`${token}/`}
      OR substr(${token}, 1, length(${schema.posts.slug}) + 1) = ${schema.posts.slug} || '/'
    )`
    const overlappingOwner = numericPostId === null
      ? overlappingSlug
      : or(overlappingSlug, eq(schema.posts.id, numericPostId))
    const noOtherOwner = notExists(db.select({ id: schema.posts.id }).from(schema.posts)
      .where(and(
        ne(schema.posts.id, job.post_id),
        overlappingOwner,
      )))
    const otherOwner = await db.select({ id: schema.posts.id }).from(schema.posts)
      .where(and(ne(schema.posts.id, job.post_id), overlappingOwner))
      .limit(1)
    if (otherOwner.length) {
      await deferPostBlobPurge(job.id, now, FAILED_DELETE_RETRY_MS)
      deferred += 1
      continue
    }

    const transition = db.update(schema.post_blob_gc).set({
      status: 'deleting',
      updated_at: nowIso,
    }).where(and(
      eq(schema.post_blob_gc.id, job.id),
      eq(schema.post_blob_gc.status, 'pending'),
      lte(schema.post_blob_gc.delete_after, nowIso),
      noOtherOwner,
      numericPostId === null
        ? sql`1 = 1`
        : sql`COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'posts'), 0) >= ${numericPostId}`,
    ))
    if (job.status === 'pending') {
      const result = await db.batch([transition])
      const changes = Number((result[0] as any)?.meta?.changes ?? (result[0] as any)?.rowsAffected ?? 0)
      if (!changes) continue
    }

    try {
      const result = await deletePostBlobs(job.prefix)
      deletedObjects += result.deleted

      if (result.hasMore) {
        await deferPostBlobPurge(job.id, now, FAILED_DELETE_RETRY_MS)
        deferred += 1
        continue
      }

      if (result.deleted) {
        const quietUntil = new Date(now.getTime() + DELETE_GRACE_MS).toISOString()
        await db.update(schema.post_blob_gc).set({
          quiet_until: quietUntil,
          delete_after: new Date(now.getTime() + FAILED_DELETE_RETRY_MS).toISOString(),
          updated_at: nowIso,
        }).where(eq(schema.post_blob_gc.id, job.id)).run()
        deferred += 1
        continue
      }

      if (nowIso < job.quiet_until) {
        await db.update(schema.post_blob_gc).set({
          delete_after: job.quiet_until,
          updated_at: nowIso,
        }).where(eq(schema.post_blob_gc.id, job.id)).run()
        deferred += 1
        continue
      }

      await db.update(schema.post_blob_gc).set({
        status: 'deleted',
        updated_at: nowIso,
      }).where(and(
        eq(schema.post_blob_gc.id, job.id),
        eq(schema.post_blob_gc.status, 'deleting'),
      )).run()
      completed += 1
    } catch (error) {
      console.error('[postBlobGc] Post blob sweep failed; scheduling retry', {
        postId: job.post_id,
        error: error instanceof Error ? error.message : String(error),
      })
      await deferPostBlobPurge(job.id, now, FAILED_DELETE_RETRY_MS)
      failed += 1
    }
  }

  return { scanned: jobs.length, deletedObjects, completed, deferred, failed }
}

async function deletePostBlobs(prefix: string) {
  let deleted = 0

  while (deleted < MAX_POST_BLOBS_PER_RUN) {
    const remaining = MAX_POST_BLOBS_PER_RUN - deleted
    const page = await blob.list({ prefix, limit: Math.min(1_000, remaining) })
    if (!page.blobs.length) {
      if (page.hasMore) throw new Error('Blob listing returned an empty page with more results')
      return { deleted, hasMore: false }
    }

    await blob.del(page.blobs.map(item => item.pathname))
    deleted += page.blobs.length

    if (!page.hasMore) return { deleted, hasMore: false }
  }

  return { deleted, hasMore: true }
}

async function deferPostBlobPurge(jobId: number, now: Date, delayMs: number) {
  await db.update(schema.post_blob_gc).set({
    delete_after: new Date(now.getTime() + delayMs).toISOString(),
    attempts: sql`${schema.post_blob_gc.attempts} + 1`,
    updated_at: now.toISOString(),
  }).where(and(
    eq(schema.post_blob_gc.id, jobId),
    inArray(schema.post_blob_gc.status, ['pending', 'deleting']),
  )).run()
}
