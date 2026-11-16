import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as schema from '../../../server/db/schema'
import { createTestDbSeeded } from '../helpers/db'
import type { TestDb } from '../helpers/db'

const state = vi.hoisted(() => {
  let testDb: TestDb | null = null
  const objects = new Map<string, string>()
  return {
    db: () => testDb?.db ?? null,
    init: (value: TestDb) => { testDb = value },
    objects,
  }
})

vi.mock('hub:db', () => ({
  schema,
  db: new Proxy({} as any, {
    get(_, property) {
      const currentDb = state.db()
      if (!currentDb) return undefined
      const value = (currentDb as any)[property]
      return typeof value === 'function' ? value.bind(currentDb) : value
    },
  }),
}))

vi.mock('hub:blob', () => ({
  blob: {
    put: vi.fn(async (pathname: string, content: string) => { state.objects.set(pathname, content) }),
    get: vi.fn(async (pathname: string) => {
      const content = state.objects.get(pathname)
      return content === undefined ? null : { text: async () => content }
    }),
    del: vi.fn(async (pathname: string | string[]) => {
      for (const path of Array.isArray(pathname) ? pathname : [pathname]) state.objects.delete(path)
    }),
    list: vi.fn(async () => ({ blobs: [] })),
  },
}))

Object.assign(globalThis, {
  createError: (error: any) => Object.assign(new Error(error.statusMessage), error),
})

beforeEach(() => {
  const seeded = createTestDbSeeded()
  const sqlite = seeded.sqlite
  const currentDb = seeded.db as any
  currentDb.batch = async (queries: any[]) => sqlite.transaction(() => queries.map((query) => {
    const result = query.run()
    return { ...result, rowsAffected: result.changes, meta: { changes: result.changes } }
  }))()
  state.init(seeded)
  state.objects.clear()
  vi.clearAllMocks()
})

describe('D1 insert result parsing', () => {
  it('accepts both SQLite and Cloudflare D1 insert IDs', async () => {
    const { getInsertedRowId } = await import('../../../server/utils/api')
    expect(getInsertedRowId({ lastInsertRowid: 12 })).toBe(12)
    expect(getInsertedRowId({ meta: { last_row_id: 13 } })).toBe(13)
    expect(getInsertedRowId({ meta: { last_row_id: 0 } })).toBe(0)
  })
})

describe('post revision history and retention', () => {
  it('stores the previous and next article atomically and rejects a stale revision', async () => {
    const current = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })
    state.objects.set('posts/3/article.json', current)
    state.db()!.update(schema.posts).set({ blob_path: 'posts/3/article.json' }).where((await import('drizzle-orm')).eq(schema.posts.id, 3)).run()

    const { savePostRevision } = await import('../../../server/utils/postRevisions')
    const article = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'updated' }] }] }
    const saved = await savePostRevision({
      post: { id: 3, blob_path: 'posts/3/article.json', content_revision: 0 },
      actorId: 1,
      article,
      expectedRevision: 0,
      source: 'editor',
    })

    expect(saved.revision).toBe(1)
    expect(state.db()!.select().from(schema.post_revisions).all()).toHaveLength(2)
    expect(JSON.parse(state.objects.get(saved.blobPath)!)).toEqual(article)

    await expect(savePostRevision({
      post: { id: 3, blob_path: saved.blobPath, content_revision: 1 },
      actorId: 1,
      article,
      expectedRevision: 0,
      source: 'editor',
    })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('keeps the newest twenty revisions and queues expired revision blobs', async () => {
    const currentDb = state.db()!
    const rows = Array.from({ length: 21 }, (_, index) => ({
      post_id: 3,
      revision: index,
      blob_path: `posts/3/revisions/${index}.json`,
      content_hash: `hash-${index}`,
      media_paths: '[]',
      source: 'editor',
      created_by: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    }))
    currentDb.insert(schema.post_revisions).values(rows).run()

    const { pruneExpiredPostRevisions } = await import('../../../server/utils/postRevisions')
    const result = await pruneExpiredPostRevisions(new Date('2026-11-16T00:00:00.000Z'))

    expect(result).toEqual({ pruned: 1, blobsQueued: 1 })
    expect(currentDb.select().from(schema.post_revisions).all()).toHaveLength(20)
    expect(currentDb.select().from(schema.post_media_gc).all().map((job: any) => job.pathname))
      .toEqual(['posts/3/revisions/0.json'])
  })

  it('preserves media referenced by an article revision and deletes unreferenced media after the grace period', async () => {
    const currentDb = state.db()!
    const now = new Date('2026-11-16T00:00:00.000Z')
    currentDb.update(schema.posts).set({ blob_path: 'posts/3/article.json' }).where((await import('drizzle-orm')).eq(schema.posts.id, 3)).run()
    currentDb.insert(schema.post_revisions).values({
      post_id: 3,
      revision: 0,
      blob_path: 'posts/3/revisions/0.json',
      content_hash: 'old-hash',
      media_paths: JSON.stringify(['posts/3/keep.jpg']),
      source: 'editor',
      created_by: 1,
    }).run()
    currentDb.insert(schema.post_media_gc).values([
      { post_id: 3, pathname: 'posts/3/keep.jpg', status: 'pending', delete_after: '2026-11-15T00:00:00.000Z' },
      { post_id: 3, pathname: 'posts/3/remove.jpg', status: 'pending', delete_after: '2026-11-15T00:00:00.000Z' },
    ]).run()
    state.objects.set('posts/3/article.json', JSON.stringify({ type: 'doc', content: [] }))
    state.objects.set('posts/3/keep.jpg', 'kept')
    state.objects.set('posts/3/remove.jpg', 'removed')

    const { collectScheduledPostMediaDeletions } = await import('../../../server/utils/postMediaGc')
    const result = await collectScheduledPostMediaDeletions(now)

    expect(result).toMatchObject({ scanned: 2, deleted: 1, deferred: 1, failed: 0 })
    expect(state.objects.has('posts/3/keep.jpg')).toBe(true)
    expect(state.objects.has('posts/3/remove.jpg')).toBe(false)
    expect(currentDb.select().from(schema.post_media_gc).all().map((job: any) => job.status).sort())
      .toEqual(['deleted', 'pending'])
  })

  it('defers a blob purge when another post owns an overlapping slug prefix', async () => {
    const now = new Date('2026-11-16T00:00:00.000Z')
    state.db()!.insert(schema.post_blob_gc).values({
      post_id: 99,
      slug: 'hello-world/archive',
      prefix: 'posts/hello-world/archive/',
      status: 'pending',
      delete_after: '2026-11-15T00:00:00.000Z',
      quiet_until: '2026-11-17T00:00:00.000Z',
    }).run()

    const { collectScheduledPostBlobPurges } = await import('../../../server/utils/postBlobGc')
    const result = await collectScheduledPostBlobPurges(now)
    const { blob } = await import('hub:blob')

    expect(result).toMatchObject({ scanned: 1, deletedObjects: 0, completed: 0, deferred: 1 })
    expect(blob.list).not.toHaveBeenCalled()
    expect(state.db()!.select().from(schema.post_blob_gc).get()?.status).toBe('pending')
  })
})
