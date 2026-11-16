import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { AIAction } from '~/composables/useAIWriter'

export type AIProvider = 'cloudflare' | 'openrouter'

const DEFAULT_CLOUDFLARE_MODEL = '@cf/zai-org/glm-4.7-flash'
const RETIRED_CLOUDFLARE_MODEL = '@cf/meta/llama-2-7b-chat-int8'

export const AI_ACTIONS: { key: AIAction; label: string; description: string }[] = [
  { key: 'fix', label: 'Fix grammar', description: 'Correct grammar, spelling, and punctuation while keeping tone.' },
  { key: 'shorten', label: 'Make shorter', description: 'Condense the selected text without losing meaning.' },
  { key: 'continue', label: 'Continue writing', description: 'Continue from the cursor with consistent tone.' },
  { key: 'summarize', label: 'Summarize', description: 'Summarize selected text into a concise version.' },
  { key: 'translate', label: 'Translate', description: 'Translate selected text to another language.' },
  { key: 'ask', label: 'Ask', description: 'Respond to a prompt or question.' },
]

const DEFAULT_MODELS: Record<AIProvider, Record<AIAction, string>> = {
  cloudflare: {
    fix: DEFAULT_CLOUDFLARE_MODEL,
    shorten: DEFAULT_CLOUDFLARE_MODEL,
    continue: DEFAULT_CLOUDFLARE_MODEL,
    summarize: DEFAULT_CLOUDFLARE_MODEL,
    translate: DEFAULT_CLOUDFLARE_MODEL,
    ask: DEFAULT_CLOUDFLARE_MODEL,
  },
  openrouter: {
    fix: 'mistralai/devstral-2512:free',
    shorten: 'mistralai/devstral-2512:free',
    continue: 'mistralai/devstral-2512:free',
    summarize: 'mistralai/devstral-2512:free',
    translate: 'mistralai/devstral-2512:free',
    ask: 'mistralai/devstral-2512:free',
  },
}

export function normalizeModels(value: Partial<Record<AIAction, string>> | undefined, provider: AIProvider) {
  const normalized = {
    ...DEFAULT_MODELS[provider],
    ...(value || {}),
  }

  if (provider === 'cloudflare') {
    for (const action of AI_ACTIONS) {
      if (normalized[action.key] === RETIRED_CLOUDFLARE_MODEL) {
        normalized[action.key] = DEFAULT_CLOUDFLARE_MODEL
      }
    }
  }

  return normalized
}

export function useAISettings() {
  const provider = useStorage<AIProvider>('ai-provider', 'cloudflare')
  const cloudflareModels = useStorage<Record<AIAction, string>>('ai-models-cloudflare', DEFAULT_MODELS.cloudflare)
  const openrouterModels = useStorage<Record<AIAction, string>>('ai-models-openrouter', DEFAULT_MODELS.openrouter)

  cloudflareModels.value = normalizeModels(cloudflareModels.value, 'cloudflare')
  openrouterModels.value = normalizeModels(openrouterModels.value, 'openrouter')

  const modelsByProvider = computed(() => ({
    cloudflare: cloudflareModels.value,
    openrouter: openrouterModels.value,
  }))

  const getModelForAction = (action: AIAction, providerForAction: AIProvider) => {
    const models = modelsByProvider.value[providerForAction]
    return models[action] || DEFAULT_MODELS[providerForAction][action]
  }

  const setModelForAction = (providerForAction: AIProvider, action: AIAction, model: string) => {
    if (providerForAction === 'cloudflare') {
      cloudflareModels.value = { ...cloudflareModels.value, [action]: model }
      return
    }
    openrouterModels.value = { ...openrouterModels.value, [action]: model }
  }

  const resetModels = (providerForAction?: AIProvider) => {
    if (!providerForAction || providerForAction === 'cloudflare') {
      cloudflareModels.value = { ...DEFAULT_MODELS.cloudflare }
    }
    if (!providerForAction || providerForAction === 'openrouter') {
      openrouterModels.value = { ...DEFAULT_MODELS.openrouter }
    }
  }

  return {
    provider,
    cloudflareModels,
    openrouterModels,
    modelsByProvider,
    getModelForAction,
    setModelForAction,
    resetModels,
  }
}
