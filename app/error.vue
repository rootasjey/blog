<template>
  <NuxtLayout>
    <section class="site-error-page">
      <section class="site-error-content" aria-labelledby="error-title">
        <p v-if="is404" class="site-error-eyebrow">{{ error?.statusCode }} <span aria-hidden="true">·</span> {{ $ts('error.pageNotFound') }}</p>
        <p v-else class="site-error-code" aria-hidden="true">{{ error?.statusCode || '500' }}</p>
        <h1 id="error-title">{{ errorTitle }}</h1>
        <p class="site-error-message">{{ errorMessage }}</p>

        <div class="site-error-actions">
          <button class="site-interactive-hover site-outline-action site-error-home-action" type="button" @click="handleError">
            <span>{{ $ts(is404 ? 'error.returnHome' : 'common.goHome') }}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <details v-if="error?.stack && isAdmin" class="site-error-debug">
          <summary>{{ $ts('error.debugInfo') }}</summary>
          <pre>{{ error.stack }}</pre>
        </details>
      </section>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { localizedPath } from '~/utils/presentationPosts'

const props = defineProps<{ error: NuxtError }>()
const { loggedIn, user } = useUserSession()
const { $ts, $getLocale } = useI18n()
const is404 = computed(() => props.error?.statusCode === 404)
const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')
const errorTitle = computed(() => is404.value ? $ts('error.notFoundTitle') : $ts('error.somethingWentWrong'))
const errorMessage = computed(() => is404.value ? $ts('error.notFoundDescription') : $ts('error.genericErrorDescription'))

function handleError() {
  clearError({ redirect: localizedPath('/', $getLocale()) })
}
</script>

<style scoped>
@layer components {
  .site-error-page {
    display: grid;
    flex: 1;
    min-height: 0;
    padding: 48px 24px;
    place-items: center;
    background: var(--site-color-background);
    color: var(--site-color-text);
  }

  .site-error-content {
    width: min(100%, 700px);
    text-align: left;
  }

  .site-error-code {
    margin: 0;
    color: var(--site-color-muted);
    font-size: clamp(48px, 8vw, 72px);
    font-weight: 550;
    letter-spacing: -0.06em;
    line-height: 0.95;
  }

  .site-error-eyebrow {
    margin: 0 0 20px;
    color: var(--site-color-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 520px;
    margin: 0;
    color: var(--site-color-heading);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 550;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }

  .site-error-message {
    max-width: 460px;
    margin: 16px 0 0;
    color: var(--site-color-muted);
    font-size: 16px;
    line-height: 1.6;
  }

  .site-error-actions {
    display: flex;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .site-error-home-action {
    gap: 10px;
  }

  .site-error-debug summary:focus-visible {
    outline: 2px solid var(--site-color-focus-ring);
    outline-offset: 3px;
  }

  .site-error-debug {
    margin-top: 32px;
    border: 1px solid var(--site-color-border);
    border-radius: 12px;
    text-align: left;
  }

  .site-error-debug summary {
    padding: 12px 16px;
    color: var(--site-color-muted);
    cursor: pointer;
  }

  .site-error-debug pre {
    overflow: auto;
    padding: 16px;
    border-top: 1px solid var(--site-color-border);
    font-size: 12px;
  }

  @media (max-width: 520px) {
    .site-error-page {
      padding: 40px 16px;
    }
  }

}
</style>
