<template>
  <section v-if="articles.length" class="site-post-related" :aria-labelledby="headingId">
    <h2 :id="headingId">{{ $ts('components.relatedPosts.heading') }}</h2>
    <div class="site-post-related-grid">
      <article v-for="article in articles" :key="article.to" class="site-post-related-card">
        <NuxtLink class="site-post-related-image-link" :to="article.to" :aria-label="article.title">
          <PostImage :src="article.image" :alt="article.title" loading="lazy" decoding="async" />
        </NuxtLink>
        <span class="site-post-related-copy">
          <NuxtLink class="site-post-related-title" :to="article.to">{{ article.title }}</NuxtLink>
          <span class="site-post-related-meta">
            <NuxtLink
              v-if="article.tag"
              class="site-post-related-tag"
              :to="tagPath(article.tag)"
              :style="{ '--related-tag-color': postTagColor(article.tag, article.tagColor) }"
            >
              {{ article.tag }}
            </NuxtLink>
            <time v-if="article.date" :datetime="article.date">{{ article.dateLabel }}</time>
          </span>
        </span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

defineProps<{
  articles: Array<{
    to: string
    title: string
    image: string
    tag?: string
    tagColor?: string | null
    date?: string
    dateLabel?: string
  }>
}>()

const { $ts, $getLocale } = useI18n()
const headingId = useId()

function tagPath(tag: string) {
  return `${localizedPath('/posts', $getLocale())}?tag=${encodeURIComponent(tag)}`
}
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-post-related { width: min(700px, calc(100% - 32px)); margin: 72px auto 0; }
.site-shell .site-post-related > h2 { margin: 0 0 20px; color: var(--site-color-muted); font-size: 14px; font-weight: 500; line-height: 20px; }
.site-shell .site-post-related-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.site-shell .site-post-related-card { display: grid; min-width: 0; grid-template-columns: 96px minmax(0, 1fr); align-items: center; gap: 16px; }
.site-shell .site-post-related-image-link { display: block; overflow: hidden; border-radius: 12px; transition: transform 220ms var(--site-ease-standard); }
.site-shell .site-post-related-image-link:hover,
.site-shell .site-post-related-image-link:focus-visible { transform: scale(1.05); }
.site-shell .site-post-related-image-link > img { display: block; width: 96px; height: 80px; border-radius: inherit; object-fit: cover; }
.site-shell .site-post-related-copy { display: grid; min-width: 0; gap: 6px; }
.site-shell .site-post-related-title { color: var(--site-color-heading); font-size: 15px; font-weight: 550; line-height: 1.4; text-decoration: none; }
.site-shell .site-post-related-meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--site-color-muted); font-size: 12px; line-height: 18px; }
.site-shell .site-post-related-tag { position: relative; z-index: 0; color: var(--related-tag-color); font-weight: 550; text-decoration: none; transform-origin: left center; transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1); }
.site-shell .site-post-related-tag::before { position: absolute; z-index: -1; inset: -2px -6px; border-radius: 8px; background: transparent; content: ""; transition: background-color 150ms ease-in-out; }
.site-shell .site-post-related-tag:hover,
.site-shell .site-post-related-tag:focus-visible { color: var(--related-tag-color); transform: scale(1.04); }
.site-shell .site-post-related-tag:hover::before,
.site-shell .site-post-related-tag:focus-visible::before { background: color-mix(in srgb, var(--related-tag-color) 16%, var(--site-color-background)); }
.site-shell .site-post-related-tag:focus-visible,
.site-shell .site-post-related-title:focus-visible,
.site-shell .site-post-related-image-link:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
@media (max-width: 640px) {
  .site-shell .site-post-related-grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-post-related-image-link,
  .site-shell .site-post-related-tag,
  .site-shell .site-post-related-tag::before { transition: none; }
}
}
</style>
