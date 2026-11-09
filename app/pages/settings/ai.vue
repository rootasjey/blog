<template>
  <div class="site-page site-settings site-settings--ai">
    <div class="site-settings-content">
      <header class="site-settings-header site-settings-header--detail">
        <NuxtLink :to="localizedPath('/settings', $getLocale())" class="site-settings-back-link">
          <span class="i-ph-arrow-left" aria-hidden="true" />
          <span>{{ $ts('pages.settingsAi.backToSettings') }}</span>
        </NuxtLink>
        <h1 class="site-admin-heading">{{ $ts('pages.settingsAi.heading') }}</h1>
        <p class="site-settings-intro">{{ $ts('pages.settingsAi.description') }}</p>
      </header>

      <section class="site-settings-section" aria-labelledby="ai-provider-heading">
        <div class="site-settings-section-header">
          <div>
            <h2 id="ai-provider-heading" class="site-settings-section-title">{{ $ts('pages.settingsAi.defaultProvider') }}</h2>
            <p class="site-settings-row-description">{{ $ts('pages.settingsAi.defaultProviderDesc') }}</p>
          </div>
        </div>

        <div class="site-settings-ai-providers">
          <button
            type="button"
            class="site-settings-ai-provider"
            :class="{ 'site-settings-ai-provider--selected': provider === 'cloudflare' }"
            @click="setProvider('cloudflare')"
          >
            <span class="i-lucide-cloud site-settings-ai-provider-icon" aria-hidden="true" />
            <div class="site-settings-ai-provider-copy">
              <span class="site-settings-row-title">{{ $ts('pages.settingsAi.cloudflare') }}</span>
              <span class="site-settings-row-description">{{ $ts('pages.settingsAi.cloudflareDesc') }}</span>
            </div>
            <span v-if="provider === 'cloudflare'" class="i-ph-check-fat site-settings-ai-check" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="site-settings-ai-provider"
            :class="{ 'site-settings-ai-provider--selected': provider === 'openrouter' }"
            @click="setProvider('openrouter')"
          >
            <span class="i-lucide-network site-settings-ai-provider-icon" aria-hidden="true" />
            <div class="site-settings-ai-provider-copy">
              <span class="site-settings-row-title">{{ $ts('pages.settingsAi.openrouter') }}</span>
              <span class="site-settings-row-description">{{ $ts('pages.settingsAi.openrouterDesc') }}</span>
            </div>
            <span v-if="provider === 'openrouter'" class="i-ph-check-fat site-settings-ai-check" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section class="site-settings-section" aria-labelledby="cf-models-heading">
        <div class="site-settings-section-header">
          <div>
            <h2 id="cf-models-heading" class="site-settings-section-title">{{ $ts('pages.settingsAi.cfModels') }}</h2>
            <p class="site-settings-row-description">{{ $ts('pages.settingsAi.cfModelsDesc') }}</p>
          </div>
          <NButton btn="ghost-gray" size="xs" @click="resetModels('cloudflare')">{{ $ts('pages.settingsAi.reset') }}</NButton>
        </div>

        <div class="site-settings-model-list">
          <div v-for="action in actions" :key="`cf-${action.key}`" class="site-settings-model-row">
            <div class="site-settings-model-copy">
              <div class="site-settings-row-title">{{ action.label }}</div>
              <div class="site-settings-row-description">{{ action.description }}</div>
              <NBadge v-if="action.key === 'translate' || action.key === 'summarize'" class="site-settings-always-cf" badge="soft" color="gray">{{ $ts('pages.settingsAi.alwaysCf') }}</NBadge>
            </div>
            <NInput
              v-model="cloudflareModels[action.key]"
              input="outline"
              class="site-settings-model-input"
              :placeholder="$ts('pages.settingsAi.cfPlaceholder')"
            />
          </div>
        </div>
      </section>

      <section class="site-settings-section" aria-labelledby="or-models-heading">
        <div class="site-settings-section-header">
          <div>
            <h2 id="or-models-heading" class="site-settings-section-title">{{ $ts('pages.settingsAi.orModels') }}</h2>
            <p class="site-settings-row-description">{{ $ts('pages.settingsAi.orModelsDesc') }}</p>
          </div>
          <NButton btn="ghost-gray" size="xs" @click="resetModels('openrouter')">{{ $ts('pages.settingsAi.reset') }}</NButton>
        </div>

        <div class="site-settings-model-list">
          <div v-for="action in actions" :key="`or-${action.key}`" class="site-settings-model-row">
            <div class="site-settings-model-copy">
              <div class="site-settings-row-title">{{ action.label }}</div>
              <div class="site-settings-row-description">{{ action.description }}</div>
            </div>
            <NInput
              v-model="openrouterModels[action.key]"
              input="outline"
              class="site-settings-model-input"
              :placeholder="$ts('pages.settingsAi.orPlaceholder')"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'

import { computed } from 'vue'
import { AI_ACTIONS, useAISettings } from '~/composables/useAISettings'

const { $ts, $getLocale } = useI18n()
useSeoMeta({ title: `${$ts('pages.settingsAi.heading')} — ${$ts('seo.siteName')}` })

const actions = computed(() => AI_ACTIONS.map(action => ({
  key: action.key,
  label: translatedActionText(action.key, 'label', action.label),
  description: translatedActionText(action.key, 'description', action.description),
})))
const { provider, cloudflareModels, openrouterModels, resetModels } = useAISettings()

function translatedActionText(key: string, field: 'label' | 'description', fallback: string) {
  const translationKey = `pages.settingsAi.actions.${key}.${field}`
  const translation = $ts(translationKey)
  return translation === translationKey ? fallback : translation
}

function setProvider(next: 'cloudflare' | 'openrouter') {
  provider.value = next
}
</script>
