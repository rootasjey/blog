import { and, asc, eq, exists, inArray, lte, sql } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { postArticleUsesMedia } from '~~/server/utils/postRevisions'

const DELETE_GRACE_MS = 24 * 60 * 60 * 1000
const REFERENCED_RETRY_MS = 30 * 24 * 60 * 60 * 1000
const FAILED_DELETE_RETRY_MS = 60 * 60 * 1000
const MAX_ITEMS_PER_RUN = 50

export async function schedulePostMediaDeletion(
  postId: number,
  values: string | string[],
  removeMetadata: (pathnames: string[]) => any,
) {
  const pathnames = [...new Set((Array.isArray(values) ? values : [values]).map(value => value.replace(/^\/+/, '')))]
  if (!pathnames.length) {
    throw createError({ statusCode: 400, statusMessage: 'At least one media path is required' })
  }
  if (pathnames.some(pathname => !pathname.startsWith(`posts/${postId}/`))) {
    throw createError({ statusCode: 400, statusMessage: 'Media path does not belong to this post' })
  }

  const now = Date.now()
  const deleteAfter = new Date(now + DELETE_GRACE_MS).toISOString()
  const createdAt = new Date(now).toISOString()
  const scheduleJobs = pathnames.map(pathname => db.insert(schema.post_media_gc).values({
    post_id: postId,
    pathname,
    status: 'pending',
    delete_after: deleteAfter,
    created_at: createdAt,
    updated_at: createdAt,
  }).onConflictDoNothing())

  await db.batch([scheduleJobs[0]!, ...scheduleJobs.slice(1), removeMetadata(pathnames)])

  const jobs = await db.select().from(schema.post_media_gc)
    .where(and(
      eq(schema.post_media_gc.post_id, postId),
      inArray(schema.post_media_gc.pathname, pathnames),
    ))
  if (jobs.length !== pathnames.length) {
    throw createError({ statusCode: 409, statusMessage: 'Media deletion could not be scheduled' })
  }

  const firstJob = jobs[0]
  if (!firstJob) {
    throw createError({ statusCode: 409, statusMessage: 'Media deletion could not be scheduled' })
  }
  return { deleteAfter: firstJob.delete_after, status: firstJob.status }
}

export function postMediaGcJobExists(postId: number, pathname: string) {
  return exists(db.select({ id: schema.post_media_gc.id })
    .from(schema.post_media_gc)
    .where(and(
      eq(schema.post_media_gc.post_id, postId),
      eq(schema.post_media_gc.pathname, pathname),
    )))
}

export async function collectScheduledPostMediaDeletions(now = new Date()) {
  const nowIso = now.toISOString()
  const jobs = await db.select().from(schema.post_media_gc)
    .where(and(
      inArray(schema.post_media_gc.status, ['pending', 'deleting']),
      lte(schema.post_media_gc.delete_after, nowIso),
    ))
    .orderBy(asc(schema.post_media_gc.delete_after))
    .limit(MAX_ITEMS_PER_RUN)

  let deleted = 0
  let deferred = 0
  let failed = 0

  for (const job of jobs) {
    if (job.status === 'deleting') {
      const result = await deleteScheduledMedia(job.id, job.pathname, now)
      if (result) deleted += 1
      else failed += 1
      continue
    }

    const post = await db.query.posts.findFirst({
      where: eq(schema.posts.id, job.post_id),
      columns: { id: true, blob_path: true, content_revision: true },
    })
    if (!post) {
      await db.delete(schema.post_media_gc).where(eq(schema.post_media_gc.id, job.id)).run()
      continue
    }

    try {
      const currentArticle = await readCurrentArticle(post.blob_path)
      if (postArticleUsesMedia(currentArticle, post.id, job.pathname)) {
        await deferMediaDeletion(job.id, now, REFERENCED_RETRY_MS)
        deferred += 1
        continue
      }
    } catch (error) {
      console.warn('[postMediaGc] Could not inspect current article; postponing media deletion', {
        postId: post.id,
        pathname: job.pathname,
        error: error instanceof Error ? error.message : String(error),
      })
      await deferMediaDeletion(job.id, now, FAILED_DELETE_RETRY_MS)
      failed += 1
      continue
    }

    const noRevisionReference = sql`NOT EXISTS (
      SELECT 1
      FROM post_revisions revision,
        json_each(CASE WHEN json_valid(revision.media_paths) THEN revision.media_paths ELSE '[]' END) media
      WHERE revision.post_id = ${post.id}
        AND media.value = ${job.pathname}
    )`
    const unchangedPost = exists(db.select({ id: schema.posts.id })
      .from(schema.posts)
      .where(and(
        eq(schema.posts.id, post.id),
        eq(schema.posts.content_revision, post.content_revision),
        post.blob_path
          ? eq(schema.posts.blob_path, post.blob_path)
          : sql`${schema.posts.blob_path} IS NULL`,
      )))

    const transition = db.update(schema.post_media_gc)
      .set({ status: 'deleting', updated_at: nowIso })
      .where(and(
        eq(schema.post_media_gc.id, job.id),
        eq(schema.post_media_gc.status, 'pending'),
        lte(schema.post_media_gc.delete_after, nowIso),
        unchangedPost,
        noRevisionReference,
      ))

    const result = await db.batch([transition])
    const changes = Number((result[0] as any)?.meta?.changes ?? (result[0] as any)?.rowsAffected ?? 0)
    if (!changes) {
      await deferMediaDeletion(job.id, now, REFERENCED_RETRY_MS)
      deferred += 1
      continue
    }

    const deletedObject = await deleteScheduledMedia(job.id, job.pathname, now)
    if (deletedObject) deleted += 1
    else failed += 1
  }

  return { scanned: jobs.length, deleted, deferred, failed }
}

async function readCurrentArticle(blobPath: string | null) {
  if (!blobPath) return null
  const object = await blob.get(blobPath)
  if (!object) throw new Error('Current article blob is missing')
  return JSON.parse(await object.text()) as unknown
}

async function deferMediaDeletion(jobId: number, now: Date, delayMs: number) {
  await db.update(schema.post_media_gc).set({
    delete_after: new Date(now.getTime() + delayMs).toISOString(),
    attempts: sql`${schema.post_media_gc.attempts} + 1`,
    updated_at: now.toISOString(),
  }).where(and(
    eq(schema.post_media_gc.id, jobId),
    eq(schema.post_media_gc.status, 'pending'),
  )).run()
}

async function deleteScheduledMedia(jobId: number, pathname: string, now: Date) {
  try {
    await blob.del(pathname)
  } catch (error) {
    console.error('[postMediaGc] R2 deletion failed; keeping media unavailable for retry', {
      pathname,
      error: error instanceof Error ? error.message : String(error),
    })
    await db.update(schema.post_media_gc).set({
      delete_after: new Date(now.getTime() + FAILED_DELETE_RETRY_MS).toISOString(),
      attempts: sql`${schema.post_media_gc.attempts} + 1`,
      updated_at: now.toISOString(),
    }).where(and(
      eq(schema.post_media_gc.id, jobId),
      eq(schema.post_media_gc.status, 'deleting'),
    )).run()
    return false
  }

  try {
    await db.update(schema.post_media_gc).set({
      status: 'deleted',
      updated_at: now.toISOString(),
    }).where(and(
      eq(schema.post_media_gc.id, jobId),
      eq(schema.post_media_gc.status, 'deleting'),
    )).run()
    return true
  } catch (error) {
    console.error('[postMediaGc] Could not record completed R2 deletion; keeping media unavailable', {
      pathname,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
