<template>
  <!-- Newsletter Subscription -->
  <section id="newsletter" class="home-newsletter py-12 md:py-12 animate-entrance">
    <div class="container mx-auto px-4 text-center">
      <h2>
        {{ $ts('components.newsletter.heading') }}
      </h2>
      <p class="site-newsletter-description">{{ description }}</p>
      <form class="max-w-lg mx-auto" @submit.prevent="handleSubscribe">
        <div class="flex sm:flex-row gap-3 items-stretch">
          <div class="flex-1 relative">
            <input
              v-model="email"
              type="email"
              :placeholder="$ts('components.newsletter.emailPlaceholder')"
              class="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-0 rounded-full 
                font-600 text-sm focus:outline-none focus:ring-2"
              required
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="sm:w-auto px-6 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 
              rounded-full uppercase font-medium text-size-3 font-600 transition-colors text-black disabled:opacity-60 disabled:cursor-not-allowed"
          >
          <span v-if="loading">{{ $ts('components.newsletter.subscribing') }}</span>
          <span v-else>{{ $ts('components.newsletter.subscribe') }}</span>
          </button>
        </div>
        <p v-if="feedback" :class="feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm mt-3">
          {{ feedback.message }}
        </p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const { $ts, $getLocale } = useI18n()
const description = computed(() => {
  const translated = $ts('components.newsletter.description')
  if (translated.toLocaleLowerCase() !== 'components.newsletter.description') return translated
  return $getLocale() === 'fr'
    ? 'Recevez les nouveaux articles, des idées à explorer et des nouvelles des projets du moment. Une lettre occasionnelle, sans spam.'
    : 'Get new writing, ideas to explore, and occasional notes on current projects. No spam, just a thoughtful update.'
})

const email = ref('')
const loading = ref(false)
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)

async function handleSubscribe() {
  if (loading.value) return
  loading.value = true
  feedback.value = null

  try {
    const message = await $fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value },
    }).then((res: any) => res?.message ?? 'Thanks for subscribing!')

    feedback.value = { type: 'success', message }
    email.value = ''
  } catch (error: any) {
    const message = error?.data?.message || 'Unable to subscribe right now. Please try again.'
    feedback.value = { type: 'error', message }
  } finally {
    loading.value = false
  }
}
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .home-newsletter > div {
  width: min(700px, calc(100% - 32px));
  max-width: 700px;
  margin-inline: auto;
  padding-inline: 0;
}
.site-shell .home-newsletter { background: var(--site-color-background); color: var(--site-color-text); }
.site-shell .home-newsletter { margin-top: 80px; padding: 80px 0; }
.site-shell .home-newsletter h2 { max-width: 700px; margin: 0 auto 16px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 18px; font-weight: 550; line-height: 1.4; text-align: center; }
.site-shell .home-newsletter .site-newsletter-description { max-width: 540px; margin: 0 auto; color: var(--site-color-text); font-size: 16px; line-height: 24px; text-align: center; }
.site-shell .home-newsletter form { width: min(320px, 100%); max-width: 320px; margin: 30px auto 0; }
.site-shell .home-newsletter form > div { min-height: 48px; flex-direction: row; align-items: stretch; gap: 0; padding: 4px; border: 1px solid var(--site-color-border); border-radius: 16px; }
.site-shell .home-newsletter form > div > div { min-width: 0; }
.site-shell .home-newsletter input { height: 40px; min-height: 40px; padding: 0 16px; border: 0; border-radius: 12px; background: transparent; color: var(--site-color-text); font-size: 14px; }
.site-shell .home-newsletter button { height: 40px; min-height: 40px; padding: 0 14px; border: 0; border-radius: 12px; background: transparent; color: var(--site-color-text); font-size: 16px; font-weight: 500; text-transform: none; }
.site-shell .home-newsletter button:not(:disabled):hover { background: #323235; }
@media (max-width: 600px) {
  .site-shell .home-newsletter { margin-top: 40px; padding: 56px 0 48px; }
}
@media (max-width: 600px) {
  .site-shell .home-newsletter h2 { margin-bottom: 16px; font-size: 18px; }
}
@media (max-width: 600px) {
  .site-shell .home-newsletter .site-newsletter-description { margin-bottom: 24px; }
}
@media (max-width: 600px) {
  .site-shell .home-newsletter form > div { flex-direction: row; }
}
@media (max-width: 600px) {
  .site-shell .home-newsletter button { height: 40px; min-height: 40px; }
}
}
</style>
