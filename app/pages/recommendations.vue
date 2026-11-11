<template>
  <main class="site-page site-recommendations-page">
    <div class="site-recommendations-content">
      <CollectionIntro :title="copy.title" :description="copy.description" />
      <HomeRecommendations :show-heading="false" editable :is-admin="isAdmin" />
    </div>
  </main>

  <div class="site-recommendations-newsletter">
    <NewsletterSubscription />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_RECOMMENDATIONS_CONTENT, type RecommendationsContent } from '~~/shared/types/public-page-content'

const { $getLocale } = useI18n()
const { data: settingsData } = await useFetch<{ recommendationsContent?: RecommendationsContent }>('/api/site-settings', {
  default: () => ({ recommendationsContent: DEFAULT_RECOMMENDATIONS_CONTENT }),
})
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const copy = computed(() => settingsData.value?.recommendationsContent?.[locale.value] || DEFAULT_RECOMMENDATIONS_CONTENT[locale.value])
const { user, loggedIn } = useUserSession()
const isAdmin = computed(() => !!(loggedIn.value && user.value?.role === 'admin'))

useSeoMeta({
  title: () => `${copy.value.title} - Corpinot`,
  description: () => copy.value.description,
})
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-recommendations-page { padding: 70px 0 0; }
.site-shell .site-recommendations-content { width: min(700px, calc(100vw - 32px)); margin-inline: auto; }
.site-shell .site-recommendations-page .site-collection-intro { margin: 0 0 104px; }
.site-shell .site-recommendations-page .site-collection-avatar { margin-bottom: 48px; }
.site-shell .site-recommendations-page .site-home-recommendations-inner { width: 100%; max-width: 100%; }
.site-shell .site-recommendations-page .site-home-recommendations-grid { width: 100%; max-width: 100%; margin-left: 0; }
.site-shell .site-recommendations-page .site-home-recommendations { margin-top: 0; padding-bottom: 0; }
.site-shell .site-recommendations-newsletter .home-newsletter { margin-top: 150px; }
@media (max-width: 1023px) {
  .site-shell .site-recommendations-page { padding-top: 40px; }
}
@media (max-width: 1023px) {
  .site-shell .site-recommendations-page .site-collection-intro { margin-bottom: 64px; }
}
@media (max-width: 1023px) {
  .site-shell .site-recommendations-page .site-collection-avatar { margin-bottom: 32px; }
}
@media (max-width: 1023px) {
  .site-shell .site-recommendations-newsletter .home-newsletter { margin-top: 100px; }
}
}
</style>
