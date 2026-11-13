import { and, asc, eq, inArray, notExists, sql } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'

type PostRecord = {
  id: number
  blob_path: string | null
  content_revision: number
}

function getStoredMediaPath(value: string, postId: number) {
  try {
    const url = new URL(value, 'https://corpinot.invalid')
    let storedPath = ''

    if (url.pathname.startsWith('/posts/')) {
      storedPath = url.pathname.replace(/^\/+/, '')
    } else if (url.pathname.startsWith('/images/')) {
      const relatedTo = url.searchParams.get('relatedTo')
      const slug = url.searchParams.get('slug')?.replace(/^\/+/, '')
      const filename = url.pathname.split('/').pop()
      if (relatedTo === 'posts' && slug && filename) {
        storedPath = `${relatedTo}/${slug}/${filename}`
      }
    }

    const normalizedPath = decodeURIComponent(storedPath).replace(/^\/+/, '')
    return normalizedPath.startsWith(`posts/${postId}/`) ? normalizedPath : null
  } catch {
    return null
  }
}

function collectMediaPaths(value: unknown, postId: number, paths = new Set<string>()): string[] {
  if (!value || typeof value !== 'object') return [...paths]

  if (Array.isArray(value)) {
    for (const child of value) collectMediaPaths(child, postId, paths)
    return [...paths]
  }

  const node = value as Record<string, unknown>
  const attrs = node.attrs && typeof node.attrs === 'object'
    ? node.attrs as Record<string, unknown>
    : null

  if (attrs) {
    for (const key of ['src', 'poster']) {
      const source = attrs[key]
      if (typeof source !== 'string') continue
      const path = getStoredMediaPath(source, postId)
      if (path) paths.add(path)
    }
  }

  for (const child of Object.values(node)) collectMediaPaths(child, postId, paths)
  return [...paths]
}

export function postArticleUsesMedia(value: unknown, postId: number, storedPath: string) {
  const normalizedPath = storedPath.replace(/^\/+/, '')
  return collectMediaPaths(value, postId).includes(normalizedPath)
}

async function contentHash(content: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function readCurrentArticle(post: PostRecord) {
  if (!post.blob_path) return JSON.stringify({ type: 'doc', content: [] })
  const object = await blob.get(post.blob_path)
  if (!object) throw createError({ statusCode: 409, statusMessage: 'Current article content is missing' })
  return object.text()
}

export async function savePostRevision(input: {
  post: PostRecord
  actorId: number
  article: Record<string, unknown>
  expectedRevision: number
  source: 'editor' | 'ai' | 'restore' | 'api'
}) {
  const { post, actorId, article, expectedRevision, source } = input
  if (expectedRevision !== post.content_revision) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Article changed since it was loaded. Reload it before saving.',
      data: { currentRevision: post.content_revision },
    })
  }

  const previousContent = await readCurrentArticle(post)
  const nextContent = JSON.stringify(article)
  const nextRevision = expectedRevision + 1
  const previousPath = post.blob_path ?? `posts/${post.id}/revisions/0-initial.json`
  const nextPath = `posts/${post.id}/revisions/${nextRevision}-${crypto.randomUUID()}.json`
  const previousMedia = collectMediaPaths(JSON.parse(previousContent) as unknown, post.id)
  const nextMedia = collectMediaPaths(article, post.id)
  const previousHash = await contentHash(previousContent)
  const nextHash = await contentHash(nextContent)
  const mediaAvailable = nextMedia.length
    ? notExists(db.select({ id: schema.post_media_gc.id })
      .from(schema.post_media_gc)
      .where(and(
        inArray(schema.post_media_gc.pathname, nextMedia),
        inArray(schema.post_media_gc.status, ['deleting', 'deleted']),
      )))
    : sql`1 = 1`

  // R2 and D1 cannot share a transaction. Immutable objects are written first;
  // a failed compare-and-swap leaves only an orphan object, never a lost article.
  if (!post.blob_path) {
    await blob.put(previousPath, previousContent, { addRandomSuffix: false })
  }
  await blob.put(nextPath, nextContent, { addRandomSuffix: false })

  const updatedAt = new Date().toISOString()
  const updatePost = db.update(schema.posts)
    .set({ blob_path: nextPath, content_revision: nextRevision, updated_at: updatedAt })
    .where(and(
      eq(schema.posts.id, post.id),
      eq(schema.posts.content_revision, expectedRevision),
      mediaAvailable,
    ))

  const savedPostCondition = and(
    eq(schema.posts.id, post.id),
    eq(schema.posts.content_revision, nextRevision),
    eq(schema.posts.blob_path, nextPath),
    mediaAvailable,
  )
  const insertBaseline = db.insert(schema.post_revisions)
    .select(db.select({
      id: sql<number>`NULL`.as('id'),
      post_id: sql<number>`${post.id}`.as('post_id'),
      revision: sql<number>`${expectedRevision}`.as('revision'),
      blob_path: sql<string>`${previousPath}`.as('blob_path'),
      content_hash: sql<string>`${previousHash}`.as('content_hash'),
      media_paths: sql<string>`${JSON.stringify(previousMedia)}`.as('media_paths'),
      source: sql<string>`'baseline'`.as('source'),
      created_by: sql<number>`${actorId}`.as('created_by'),
      created_at: sql<string>`${updatedAt}`.as('created_at'),
    }).from(schema.posts).where(savedPostCondition))
    .onConflictDoNothing()

  const insertCurrent = db.insert(schema.post_revisions)
    .select(db.select({
      id: sql<number>`NULL`.as('id'),
      post_id: sql<number>`${post.id}`.as('post_id'),
      revision: sql<number>`${nextRevision}`.as('revision'),
      blob_path: sql<string>`${nextPath}`.as('blob_path'),
      content_hash: sql<string>`${nextHash}`.as('content_hash'),
      media_paths: sql<string>`${JSON.stringify(nextMedia)}`.as('media_paths'),
      source: sql<string>`${source}`.as('source'),
      created_by: sql<number>`${actorId}`.as('created_by'),
      created_at: sql<string>`${updatedAt}`.as('created_at'),
    }).from(schema.posts).where(savedPostCondition))

  let results
  try {
    results = await db.batch([updatePost, insertBaseline, insertCurrent])
  } catch (error) {
    await cleanupUnreferencedRevisionBlob(post.id, nextPath)
    throw error
  }
  const changes = Number((results[0] as any)?.meta?.changes ?? (results[0] as any)?.rowsAffected ?? 0)
  if (!changes) {
    await cleanupUnreferencedRevisionBlob(post.id, nextPath)
    if (nextMedia.length) {
      const unavailableMedia = await db.query.post_media_gc.findFirst({
        where: and(
          inArray(schema.post_media_gc.pathname, nextMedia),
          inArray(schema.post_media_gc.status, ['deleting', 'deleted']),
        ),
        columns: { pathname: true },
      })
      if (unavailableMedia) {
        throw createError({
          statusCode: 409,
          statusMessage: 'One of this article’s media files is being deleted. Upload it again before saving.',
        })
      }
    }
    throw createError({
      statusCode: 409,
      statusMessage: 'Article changed while saving. Reload it before saving again.',
    })
  }

  return { revision: nextRevision, blobPath: nextPath }
}

async function cleanupUnreferencedRevisionBlob(postId: number, blobPath: string) {
  const currentPost = await db.query.posts.findFirst({
    where: and(eq(schema.posts.id, postId), eq(schema.posts.blob_path, blobPath)),
    columns: { id: true },
  })
  if (currentPost) return

  const revision = await db.query.post_revisions.findFirst({
    where: and(eq(schema.post_revisions.post_id, postId), eq(schema.post_revisions.blob_path, blobPath)),
    columns: { id: true },
  })
  if (!revision) await blob.del(blobPath).catch(() => {})
}

export async function listPostRevisions(postId: number) {
  return db.select({
    id: schema.post_revisions.id,
    revision: schema.post_revisions.revision,
    source: schema.post_revisions.source,
    created_by: schema.post_revisions.created_by,
    created_at: schema.post_revisions.created_at,
    content_hash: schema.post_revisions.content_hash,
  }).from(schema.post_revisions)
    .where(eq(schema.post_revisions.post_id, postId))
    .orderBy(sql`${schema.post_revisions.revision} DESC`)
}

export async function getPostRevision(postId: number, revision: number) {
  const row = await db.query.post_revisions.findFirst({
    where: and(
      eq(schema.post_revisions.post_id, postId),
      eq(schema.post_revisions.revision, revision),
    ),
  })
  if (!row) return null
  const object = await blob.get(row.blob_path)
  if (!object) throw createError({ statusCode: 500, statusMessage: 'Revision content is missing' })
  return { row, article: JSON.parse(await object.text()) as object }
}

const REVISION_RETENTION_DAYS = 90
const MINIMUM_RETAINED_REVISIONS = 20
const MAX_REVISIONS_PRUNED_PER_RUN = 100
const REVISION_BLOB_DELETE_GRACE_MS = 24 * 60 * 60 * 1000

export async function pruneExpiredPostRevisions(now = new Date()) {
  const cutoff = new Date(now.getTime() - REVISION_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const candidates = await db.select({
    id: schema.post_revisions.id,
    post_id: schema.post_revisions.post_id,
    blob_path: schema.post_revisions.blob_path,
    media_paths: schema.post_revisions.media_paths,
  }).from(schema.post_revisions)
    .where(sql`
      julianday(${schema.post_revisions.created_at}) < julianday(${cutoff})
      AND ${schema.post_revisions.id} NOT IN (
        SELECT retained.id
        FROM post_revisions retained
        WHERE retained.post_id = ${schema.post_revisions.post_id}
        ORDER BY retained.revision DESC
        LIMIT ${MINIMUM_RETAINED_REVISIONS}
      )
    `)
    .orderBy(asc(schema.post_revisions.created_at))
    .limit(MAX_REVISIONS_PRUNED_PER_RUN)

  if (!candidates.length) return { pruned: 0, blobsQueued: 0 }

  const revisionIds = candidates.map(revision => revision.id)
  const releasedMediaPaths = [...new Set(candidates.flatMap((revision) => {
    try {
      const paths: unknown = JSON.parse(revision.media_paths)
      return Array.isArray(paths)
        ? paths.filter((path): path is string => typeof path === 'string').map(path => path.replace(/^\/+/, ''))
        : []
    } catch {
      return []
    }
  }))]
  const nowIso = now.toISOString()
  const deleteAfter = new Date(now.getTime() + REVISION_BLOB_DELETE_GRACE_MS).toISOString()

  const scheduleReleasedMedia = db.update(schema.post_media_gc).set({
    delete_after: deleteAfter,
    updated_at: nowIso,
  }).where(and(
    eq(schema.post_media_gc.status, 'pending'),
    inArray(schema.post_media_gc.pathname, releasedMediaPaths.length ? releasedMediaPaths : ['']),
  ))

  const queueRevisionBlobs = db.insert(schema.post_media_gc).select(db.select({
    id: sql<number>`NULL`.as('id'),
    post_id: schema.post_revisions.post_id,
    pathname: schema.post_revisions.blob_path,
    status: sql<string>`'pending'`.as('status'),
    delete_after: sql<string>`${deleteAfter}`.as('delete_after'),
    attempts: sql<number>`0`.as('attempts'),
    created_at: sql<string>`${nowIso}`.as('created_at'),
    updated_at: sql<string>`${nowIso}`.as('updated_at'),
  }).from(schema.post_revisions)
    .where(inArray(schema.post_revisions.id, revisionIds)))
    .onConflictDoNothing()

  const deleteRevisions = db.delete(schema.post_revisions)
    .where(inArray(schema.post_revisions.id, revisionIds))

  const results = await db.batch([scheduleReleasedMedia, queueRevisionBlobs, deleteRevisions])
  const pruned = Number((results[2] as any)?.meta?.changes ?? (results[2] as any)?.rowsAffected ?? 0)
  const blobsQueued = Number((results[1] as any)?.meta?.changes ?? (results[1] as any)?.rowsAffected ?? 0)

  return { pruned, blobsQueued }
}
