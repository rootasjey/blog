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
  Object.assign(event.context, { cloudflare: { env: { AI: { run: vi.fn() } } } })

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

async function waitForAiRequestStatus(status: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const [request] = await aiRequestRows()
    if (request?.status === status) return request
    await new Promise(resolve => setTimeout(resolve, 5))
  }

  return (await aiRequestRows())[0]
}

async function invokeAiWriteStream(
  body: Record<string, unknown>,
  apiKey: string,
  options: { signal?: AbortSignal; beforeConsume?: () => void; cancelBody?: boolean } = {},
) {
  const { default: handler } = await import('../../../../server/api/v1/ai/write.post')
  const event = createHandlerEvent({
    method: 'POST',
    path: '/api/v1/ai/write',
    body,
    headers: { host: 'staging.test', authorization: `Bearer ${apiKey}` },
  })
  Object.assign(event.context, { cloudflare: { env: { AI: { run: vi.fn() } } } })
  if (options.signal) Object.assign(event, { web: { request: { signal: options.signal } } })
  const response = await handler(event) as Response
  if (typeof response?.text !== 'function') {
    throw new Error(`Expected a streaming Response, got status ${event.res.statusCode}: ${JSON.stringify(response)}`)
  }
  options.beforeConsume?.()
  if (options.cancelBody) {
    await response.body?.cancel()
    return { response, body: '' }
  }
  return { response, body: await response.text() }
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
      } })),
    })
    const nuxtApp = (await import('#app')).useNuxtApp()
    Object.assign(nuxtApp.$config, { ai: {
      defaultProvider: 'cloudflare',
    } })

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

  it('marks an empty provider stream as failed instead of reporting a completed AI request', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    mocks.streamAI.mockResolvedValueOnce({
      textStream: new ReadableStream<string>({ start(controller) { controller.close() } }),
    })

    const response = await invokeAiWriteStream({
      action: 'ask',
      content: 'Provide a short greeting.',
      postIdentifier: '1',
    }, apiKey.raw)

    expect(response.body).toContain('event: error\ndata: empty_provider_response')
    expect(response.body).not.toContain('event: end')
    const [request] = await aiRequestRows()
    expect(request?.status).toBe('failed')
    expect(request?.error_code).toBe('empty_provider_response')
  })

  it('records provider failures in the audit row and SSE error event', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    mocks.streamAI.mockResolvedValueOnce({
      textStream: new ReadableStream<string>({
        start(controller) {
          controller.error(new Error('Workers AI unavailable'))
        },
      }),
    })

    const response = await invokeAiWriteStream({
      action: 'ask',
      content: 'Provide a short greeting.',
      postIdentifier: '1',
    }, apiKey.raw)

    expect(response.body).toContain('event: error\ndata: provider_stream_error')
    const [request] = await aiRequestRows()
    expect(request?.status).toBe('failed')
    expect(request?.error_code).toBe('provider_stream_error')
  })

  it('completes a provider stream that contains generated text', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    mocks.streamAI.mockResolvedValueOnce({
      textStream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue('Hello.')
          controller.close()
        },
      }),
    })

    const response = await invokeAiWriteStream({
      action: 'ask',
      content: 'Provide a short greeting.',
      postIdentifier: '1',
    }, apiKey.raw)

    expect(response.body).toContain('data: Hello.')
    expect(response.body).toContain('event: end')
    const [request] = await aiRequestRows()
    expect(request?.status).toBe('completed')
    expect(request?.error_code).toBeNull()
  })

  it('marks a provider stream failure after partial text as failed', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    mocks.streamAI.mockResolvedValueOnce({
      textStream: {
        getReader() {
          let firstRead = true
          return {
            async read() {
              if (firstRead) {
                firstRead = false
                return { done: false, value: 'Partial text.' }
              }
              throw new Error('provider stream failed')
            },
            releaseLock() {},
          }
        },
      },
    })

    const response = await invokeAiWriteStream({
      action: 'ask',
      content: 'Provide a short greeting.',
      postIdentifier: '1',
    }, apiKey.raw)

    expect(response.body).toContain('data: Partial text.')
    expect(response.body).toContain('event: error\ndata: provider_stream_error')
    expect(response.body).not.toContain('event: end')
    const [request] = await aiRequestRows()
    expect(request?.status).toBe('failed')
    expect(request?.error_code).toBe('provider_stream_error')
  })

  it('marks a gracefully closed stream as cancelled after the request is aborted', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    const abort = new AbortController()
    mocks.streamAI.mockResolvedValueOnce({
      textStream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue('Partial text.')
          controller.close()
        },
      }),
    })

    const response = await invokeAiWriteStream({
      action: 'ask',
      content: 'Provide a short greeting.',
      postIdentifier: '1',
    }, apiKey.raw, { signal: abort.signal, beforeConsume: () => abort.abort() })

    expect(response.body).toContain('event: error\ndata: cancelled')
    expect(response.body).not.toContain('event: end')
    const request = await waitForAiRequestStatus('cancelled')
    expect(request?.status).toBe('cancelled')
    expect(request?.error_code).toBe('cancelled')
  })

  it('marks an explicitly cancelled response body as cancelled', async () => {
    const apiKey = await createApiKey(['ai:run'], [1])
    mocks.streamAI.mockResolvedValueOnce({
      textStream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue('Partial text.')
        },
      }),
    })

    await invokeAiWriteStream({
      action: 'ask',
      content: 'Provide a short greeting.',
      postIdentifier: '1',
    }, apiKey.raw, { cancelBody: true })

    const request = await waitForAiRequestStatus('cancelled')
    expect(request?.status).toBe('cancelled')
    expect(request?.error_code).toBe('cancelled')
  })
})
