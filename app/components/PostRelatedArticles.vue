<template>
  <section v-if="articles.length" class="site-post-related" :aria-labelledby="headingId">
    <h2 :id="headingId">{{ $ts('components.relatedPosts.heading') }}</h2>
    <div class="site-post-related-grid">
      <NuxtLink v-for="article in articles" :key="article.to" class="site-post-related-card" :to="article.to">
        <PostImage :src="article.image" :alt="article.title" loading="lazy" decoding="async" />
        <span class="site-post-related-copy">
          <span class="site-post-related-title">{{ article.title }}</span>
          <span class="site-post-related-meta">
            <span>{{ article.tag }}</span>
            <time v-if="article.date" :datetime="article.date">{{ article.dateLabel }}</time>
          </span>
        </span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  articles: Array<{
    to: string
    title: string
    image: string
    tag: string
    date?: string
    dateLabel?: string
  }>
}>()

const { $ts } = useI18n()
const headingId = useId()
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-post-related { width: min(700px, calc(100% - 32px)); margin: 72px auto 0; }
.site-shell .site-post-related > h2 { margin: 0 0 20px; color: var(--site-color-muted); font-size: 14px; font-weight: 500; line-height: 20px; }
.site-shell .site-post-related-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.site-shell .site-post-related-card { display: grid; min-width: 0; grid-template-columns: 96px minmax(0, 1fr); align-items: center; gap: 16px; color: var(--site-color-text); text-decoration: none; }
.site-shell .site-post-related-card > img { width: 96px; height: 80px; border-radius: 12px; object-fit: cover; }
.site-shell .site-post-related-copy { display: grid; min-width: 0; gap: 6px; }
.site-shell .site-post-related-title { color: var(--site-color-heading); font-size: 15px; font-weight: 550; line-height: 1.4; }
.site-shell .site-post-related-meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--site-color-muted); font-size: 12px; line-height: 18px; }
.site-shell .site-post-related-meta > span { color: var(--site-color-accent); }
@media (max-width: 640px) {
  .site-shell .site-post-related-grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }
}
}
</style>
