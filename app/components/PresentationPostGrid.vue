<template>
  <section class="site-demo-post-grid" :aria-label="$t('pages.posts.publishedHeading')">
    <NuxtLink
      v-for="post in visiblePosts"
      :key="post.slug"
      :to="localizedPath(`/preview/${post.slug}`, $getLocale())"
      class="site-demo-post"
    >
      <img :src="post.image" :alt="post.title[locale]" class="site-demo-post-image" loading="lazy" decoding="async">
      <span class="site-demo-post-copy">
        <span class="site-demo-post-title">{{ post.title[locale] }}</span>
        <span class="site-demo-post-meta">
          <span>{{ post.tag[locale] }}</span>
          <time>{{ formatDate(post.publishedAt) }}</time>
        </span>
      </span>
    </NuxtLink>
    <p v-if="filteredPosts.length === 0" class="site-demo-post-empty">
      {{ $t('pages.posts.noMatchingPresentationPosts') }}
    </p>
    <LoadMoreButton
      v-if="visibleCount < filteredPosts.length"
      @click="visibleCount += pageSize"
    >
      {{ locale === 'fr' ? 'Charger plus' : 'Load More' }}
    </LoadMoreButton>
  </section>
</template>

<script setup lang="ts">
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'

const { $getLocale, $t } = useI18n()
const route = useRoute()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const pageSize = 4
const visibleCount = ref(pageSize)
const filteredPosts = computed(() => {
  const tag = String(route.query.tag || '').toLocaleLowerCase(locale.value)
  return PRESENTATION_POSTS
    .filter(post => !post.isProject)
    .filter(post => !tag || post.tag[locale.value].toLocaleLowerCase(locale.value) === tag)
})
const visiblePosts = computed(() => filteredPosts.value.slice(0, visibleCount.value))

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(locale.value, { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-demo-post-grid { display: grid; width: 720px; max-width: calc(100vw - 32px); grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin: 0 0 64px -10px; }
.site-shell .site-demo-post { display: grid; min-width: 0; grid-template-columns: 100px minmax(0, 1fr); align-items: center; gap: 16px; color: var(--site-color-text); text-decoration: none; }
.site-shell .site-demo-post-image { width: 100px; height: 100px; border-radius: var(--site-radius-card); object-fit: cover; }
.site-shell .site-demo-post-copy { display: grid; min-width: 0; gap: 6px; }
.site-shell .site-demo-post-title { color: var(--site-color-heading); font-size: 18px; font-weight: 550; line-height: 24px; }
.site-shell .site-demo-post-meta { display: flex; flex-wrap: wrap; gap: 12px; color: var(--site-color-muted); font-size: 13px; line-height: 20px; }
.site-shell .site-demo-post-meta > span { color: var(--site-color-accent); }
.site-shell .site-demo-post:hover .site-demo-post-title { text-decoration: underline; text-underline-offset: var(--site-link-underline-offset); }
.site-shell .site-demo-post-empty { grid-column: 1 / -1; color: var(--site-color-muted); }
.site-shell .site-demo-post-grid { width: 100%; max-width: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 28px; margin: 0 0 64px; }
.site-shell .site-demo-post { grid-template-columns: 128px minmax(0, 1fr); gap: 16px; }
.site-shell .site-demo-post-image { width: 128px; height: 128px; }
@media (max-width: 1023px) {
  .site-shell .site-demo-post-grid { width: 100%; max-width: 100%; margin: 0 0 48px; }
}
@media (max-width: 600px) {
  .site-shell .site-demo-post-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .site-shell .site-demo-post { grid-template-columns: 96px minmax(0, 1fr); gap: 14px; }
}
@media (max-width: 600px) {
  .site-shell .site-demo-post-image { width: 96px; height: 96px; }
}
}
</style>
