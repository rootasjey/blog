import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as h3 from 'h3'
import { eq } from 'drizzle-orm'
import { createHandlerEvent } from '../../helpers/handler'
import { createTestDbSeeded, type TestDb } from '../../helpers/db'
import * as schema from '../../../../server/db/schema'

const mocks = vi.hoisted(() => {
  let testDb: TestDb | null = null
  return {
    db: () => testDb?.db ?? null,
    init: (value: TestDb) => { testDb = value },
    streamAI: vi.fn(),
    translateWithWorkersAI: vi.fn(),
    summarizeWithWorkersAI: vi.fn(),
  }
})

vi.mock('hub:db', async () => ({
  schema: await import('../../../../server/db/schema'),
  db: new Proxy({} as any, {
    get(_, property) {
      const currentDb = mocks.db()
      if (!currentDb) return undefined
      const value = (currentDb as any)[property]
      return typeof value === 'function' ? value.bind(currentDb) : value
    },
  }),
}))

vi.mock('~~/server/utils/ai', async () => {
  const actual = await vi.importActual<typeof import('../../../../server/utils/ai')>('../../../../server/utils/ai')
  return {
    ...actual,
    streamAI: mocks.streamAI,
    translateWithWorkersAI: mocks.translateWithWorkersAI,
    summarizeWithWorkersAI: mocks.summarizeWithWorkersAI,
  }
})

Object.assign(globalThis, {
  defineEventHandler: h3.defineEventHandler,
  readBody: h3.readBody,
  setResponseStatus: h3.setResponseStatus,
  setResponseHeader: h3.setResponseHeader,
  createError: h3.createError,
  apiError: vi.fn((event: any, statusCode: number, code: string, message: string) => {
    h3.setResponseStatus(event, statusCode)
    h3.setResponseHeader(event, 'content-type', 'application/json')
    return { error: { code, message } }
  }),
})

async function invokeAiWrite(body: Record<string, unknown>, apiKey?: string) {
  const { default: handler } = await import('../../../../server/api/v1/ai/write.post')
  const event = createHandlerEvent({
    method: 'POST',
    path: '/api/v1/ai/write',
    body,
    headers: {
      host: 'staging.test',
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
  })

  try {
    const result = await handler(event)
    return { status: event.res.statusCode, result }
  } catch (error: any) {
    return { status: error.statusCode ?? 500, error }
  }
}

async function aiRequestRows() {
  return mocks.db()!.select().from(schema.ai_requests)
}

async function createApiKey(scopes: string[], postIds: number[]) {
  const { generateApiKey } = await import('../../../../server/utils/api')
  const key = await generateApiKey()

  await mocks.db()!.insert(schema.api_keys).values({
    user_id: 1,
    name: 'AI route authorization test',
    hash: key.hash,
    prefix: key.prefix,
    scopes: JSON.stringify(scopes),
    post_ids: JSON.stringify(postIds),
  }).run()

  return key
}

describe('POST /api/v1/ai/write authorization gates', () => {
  beforeEach(async () => {
    const seeded = createTestDbSeeded()
    seeded.sqlite.prepare('UPDATE users SET access_role = ? WHERE id = ?').run('admin', 1)
    mocks.init(seeded)

    vi.clearAllMocks()
    Object.assign(globalThis, {
      getRequestHeader: h3.getRequestHeader,
      getRequestURL: h3.getRequestURL,
      getMethod: h3.getMethod,
      requireUserSession: vi.fn().mockRejectedValue(h3.createError({ statusCode: 401 })),
      requireWriteAccess: (await import('../../../../server/utils/api')).requireWriteAccess,
      useRuntimeConfig: vi.fn(() => ({ ai: {
        defaultProvider: 'cloudflare',
        cloudflareKey: 'test-key',
        cloudflareAccountId: 'test-account',
      } })),
    })

    const postUtils = await import('../../../../server/utils/post')
    Object.assign(globalThis, { getPostByIdentifier: postUtils.getPostByIdentifier })
  })

  it('rejects missing credentials before inserting an AI request or calling a provider', async () => {
    const response = await invokeAiWrite({ action: 'ask', content: 'safe authorization check', postIdentifier: '1' })

    expect(response.status).toBe(401)
    expect(await aiRequestRows()).toHaveLength(0)
    expect(mocks.streamAI).not.toHaveBeenCalled()
    expect(mocks.translateWithWorkersAI).not.toHaveBeenCalled()
    expect(mocks.summarizeWithWorkersAI).not.toHaveBeenCalled()
  })

  it('rejects a revoked bearer key before inserting an AI request or calling a provider', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    await mocks.db()!.update(schema.api_keys)
      .set({ revoked_at: new Date().toISOString() })
      .where(eq(schema.api_keys.prefix, apiKey.prefix))
      .run()

    const response = await invokeAiWrite({ action: 'ask', content: 'safe authorization check', postIdentifier: '1' }, apiKey.raw)

    expect(response.status).toBe(401)
    expect(await aiRequestRows()).toHaveLength(0)
    expect(mocks.streamAI).not.toHaveBeenCalled()
  })

  it('rejects an AI key scoped to a different post before inserting an AI request', async () => {
    const apiKey = await createApiKey(['ai:run'], [999999])

    const response = await invokeAiWrite({ action: 'ask', content: 'safe authorization check', postIdentifier: '1' }, apiKey.raw)

    expect(response.status).toBe(403)
    expect(await aiRequestRows()).toHaveLength(0)
    expect(mocks.streamAI).not.toHaveBeenCalled()
  })

  it('rejects a key without ai:run scope before inserting an AI request', async () => {
    const apiKey = await createApiKey(['posts:read'], [1])

    const response = await invokeAiWrite({ action: 'ask', content: 'safe authorization check', postIdentifier: '1' }, apiKey.raw)

    expect(response.status).toBe(403)
    expect(await aiRequestRows()).toHaveLength(0)
    expect(mocks.streamAI).not.toHaveBeenCalled()
  })

  it('requires a post identifier before inserting an AI request or calling a provider', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])

    const response = await invokeAiWrite({ action: 'ask', content: 'safe validation check' }, apiKey.raw)

    expect(response.status).toBe(400)
    expect(await aiRequestRows()).toHaveLength(0)
    expect(mocks.streamAI).not.toHaveBeenCalled()
  })
})
