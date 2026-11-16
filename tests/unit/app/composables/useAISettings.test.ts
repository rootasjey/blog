import { describe, expect, it } from 'vitest'
import { normalizeModels } from '../../../../app/composables/useAISettings'

describe('normalizeModels', () => {
  it('migrates the retired Cloudflare default while preserving custom models', () => {
    const models = normalizeModels({
      fix: '@cf/meta/llama-2-7b-chat-int8',
      ask: 'custom/model',
    }, 'cloudflare')

    expect(models.fix).toBe('@cf/zai-org/glm-4.7-flash')
    expect(models.ask).toBe('custom/model')
    expect(models.summarize).toBe('@cf/zai-org/glm-4.7-flash')
  })

  it('does not change OpenRouter model preferences', () => {
    const models = normalizeModels({
      fix: '@cf/meta/llama-2-7b-chat-int8',
    }, 'openrouter')

    expect(models.fix).toBe('@cf/meta/llama-2-7b-chat-int8')
  })
})
