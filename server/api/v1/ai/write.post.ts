import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { aiRequestSchema, DEFAULT_CLOUDFLARE_MODEL, DEFAULT_CLOUDFLARE_SUMMARY_MODEL, getPrompt, resolveModel, streamAI, summarizeWithWorkersAI, translateWithWorkersAI } from '~~/server/utils/ai'
import type { AIProvider } from '~~/server/utils/ai'
import { assertPostPermission } from '~~/server/utils/postPermissions'

function encodeSseData(text: string) {
  return text.replace(/\r\n/g, '\n').split('\n').map(line => `data: ${line}`).join('\n') + '\n\n'
}

export default defineEventHandler(async (event) => {
  const actor = await requireWriteAccess(event)
  const parsed = aiRequestSchema.safeParse(await readBody(event))
  if (!parsed.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid AI request')
  const request = parsed.data

  if (!request.postIdentifier) return apiError(event, 400, 'VALIDATION_ERROR', 'postIdentifier is required')
  const post = await getPostByIdentifier(db, request.postIdentifier)
  if (!post) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
  await assertPostPermission(actor, post, 'ai')

  const config = useRuntimeConfig(event)
  const requestedProvider: AIProvider = request.provider
    ?? (config.ai?.defaultProvider === 'openrouter' ? 'openrouter' : 'cloudflare')
  const provider: AIProvider = request.action === 'translate' || request.action === 'summarize'
    ? 'cloudflare'
    : requestedProvider
  const model = request.action === 'translate'
    ? '@cf/meta/m2m100-1.2b'
    : request.action === 'summarize'
      ? DEFAULT_CLOUDFLARE_SUMMARY_MODEL
      : resolveModel(provider, request.model)

  if (provider === 'openrouter' && !config.ai?.openrouterKey) {
    return apiError(event, 503, 'AI_NOT_CONFIGURED', 'OpenRouter is not configured')
  }
  if (provider === 'cloudflare' && (!config.ai?.cloudflareKey || !config.ai?.cloudflareAccountId)) {
    return apiError(event, 503, 'AI_NOT_CONFIGURED', 'Workers AI is not configured')
  }

  const startedAt = Date.now()
  const [inserted] = await db.insert(schema.ai_requests).values({
    user_id: actor.id,
    post_id: post.id,
    action: request.action,
    provider,
    model,
    status: 'started',
    created_at: new Date(startedAt).toISOString(),
  }).returning({ id: schema.ai_requests.id })
  if (!inserted) return apiError(event, 500, 'AI_REQUEST_LOG_FAILED', 'Could not create AI request record')

  const abort = new AbortController()
  const requestSignal = (event as any).web?.request?.signal ?? (event as any).req?.signal
  requestSignal?.addEventListener?.('abort', () => abort.abort(), { once: true })

  try {
    let textStream: ReadableStream<string>
    if (request.action === 'translate') {
      const result = await translateWithWorkersAI(config.ai.cloudflareAccountId, config.ai.cloudflareKey, {
        text: request.content,
        targetLanguage: request.targetLanguage!,
        sourceLanguage: request.sourceLanguage || request.language,
        signal: abort.signal,
      })
      textStream = new ReadableStream({ start(controller) { controller.enqueue(result); controller.close() } })
    } else if (request.action === 'summarize') {
      const result = await summarizeWithWorkersAI(config.ai.cloudflareAccountId, config.ai.cloudflareKey, {
        text: request.content,
        length: request.length,
        signal: abort.signal,
      })
      textStream = new ReadableStream({ start(controller) { controller.enqueue(result); controller.close() } })
    } else {
      const response = await streamAI({
        provider,
        cloudflareAccountId: config.ai?.cloudflareAccountId,
        cloudflareApiKey: config.ai?.cloudflareKey,
        openrouterKey: config.ai?.openrouterKey,
        openrouterBaseUrl: config.ai?.openrouterBaseUrl,
        model: request.model,
        prompt: getPrompt(request),
        signal: abort.signal,
      })
      const stream = (response as any).textStream
      if (!stream?.getReader) throw new Error('AI provider returned no text stream')
      textStream = stream as ReadableStream<string>
    }

    const encoder = new TextEncoder()
    const output = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = textStream.getReader()
        let failed = false
        let generatedText = ''
        try {
          controller.enqueue(encoder.encode(':ok\n\n'))
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            generatedText += value
            controller.enqueue(encoder.encode(encodeSseData(value)))
          }
          if (!generatedText.trim()) {
            failed = true
            const code = 'empty_provider_response'
            await db.update(schema.ai_requests).set({
              status: 'failed',
              error_code: code,
              duration_ms: Date.now() - startedAt,
            }).where(eq(schema.ai_requests.id, inserted.id)).run()
            controller.enqueue(encoder.encode(`event: error\ndata: ${code}\n\n`))
          } else {
            controller.enqueue(encoder.encode('event: end\n\n'))
          }
        } catch (error) {
          failed = true
          const code = abort.signal.aborted ? 'cancelled' : 'provider_stream_error'
          await db.update(schema.ai_requests).set({
            status: abort.signal.aborted ? 'cancelled' : 'failed',
            error_code: code,
            duration_ms: Date.now() - startedAt,
          }).where(eq(schema.ai_requests.id, inserted.id)).run()
          controller.enqueue(encoder.encode(`event: error\ndata: ${code}\n\n`))
        } finally {
          try { reader.releaseLock() } catch {}
          if (!failed) {
            await db.update(schema.ai_requests).set({
              status: 'completed',
              duration_ms: Date.now() - startedAt,
            }).where(eq(schema.ai_requests.id, inserted.id)).run()
          }
          controller.close()
        }
      },
    })

    return new Response(output, { headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    } })
  } catch (error: any) {
    const code = abort.signal.aborted ? 'cancelled' : 'provider_request_error'
    await db.update(schema.ai_requests).set({
      status: abort.signal.aborted ? 'cancelled' : 'failed',
      error_code: code,
      duration_ms: Date.now() - startedAt,
    }).where(and(eq(schema.ai_requests.id, inserted.id), eq(schema.ai_requests.status, 'started'))).run()
    console.error('[API v1] AI request failed:', error?.message || error)
    return apiError(event, 502, 'AI_PROVIDER_ERROR', 'The AI provider request failed')
  }
})
