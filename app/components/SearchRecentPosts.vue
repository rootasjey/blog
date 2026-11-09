<template>
  <section class="site-search-recent-posts">
    <h2>{{ $ts('pages.search.recentPosts') }}</h2>
    <div v-if="pending" class="site-search-recent-loading" aria-hidden="true">
      <div v-for="index in 4" :key="index" />
    </div>
    <ul v-else class="site-search-recent-list">
      <li v-for="post in posts" :key="post.slug">
        <PostImage
          v-if="post.image?.src"
          :src="post.image.src"
          :alt="post.image.alt || post.name"
          loading="lazy"
          decoding="async"
          format="webp"
        />
        <span v-else class="site-search-recent-placeholder" aria-hidden="true" />
        <NuxtLink :to="localizedPath(`/posts/${post.slug}`, locale)">
          <span>{{ post.name }}</span>
          <span class="site-search-recent-meta">
            <time>{{ post.formattedDate }}</time>
            <span aria-hidden="true">·</span>
            <span>{{ post.readingTime }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p v-if="hasError" class="site-search-muted">{{ $ts('pages.search.recentPostsError') }}</p>
  </section>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'

interface SearchRecentPost {
  slug: string
  name: string
  formattedDate: string
  readingTime: string
  image?: { src: string; alt?: string | null } | null
}

defineProps<{
  posts: SearchRecentPost[]
  pending: boolean
  hasError: boolean
  locale: string
}>()

const { $ts } = useI18n()
</script>

<style scoped>
.site-search-recent-posts {
  margin: 0 0 32px;
}

.site-search-recent-posts h2 {
  margin: 0 0 10px;
  color: var(--site-color-muted);
  font-size: 13px;
  font-weight: 550;
}

.site-search-recent-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-search-recent-list li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid var(--site-color-border);
}

.site-search-recent-list img,
.site-search-recent-placeholder {
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  border-radius: var(--site-radius-card);
  background: var(--site-color-hover-background);
  object-fit: cover;
}

.site-search-recent-list a {
  display: grid;
  gap: 4px;
  color: var(--site-color-heading);
  font-weight: 500;
  text-decoration: none;
}

.site-search-recent-list a:hover span:first-child {
  text-decoration: underline;
  text-underline-offset: var(--site-link-underline-offset);
}

.site-search-recent-meta {
  display: flex;
  gap: 8px;
  color: var(--site-color-muted);
  font-size: 13px;
  font-weight: 400;
}

.site-search-recent-loading {
  display: grid;
  gap: 0;
}

.site-search-recent-loading > div {
  height: 64px;
  border-top: 1px solid var(--site-color-border);
  background: linear-gradient(90deg, transparent, var(--site-color-hover-background), transparent);
  background-size: 200% 100%;
  animation: site-search-recent-shimmer 1.2s ease-in-out infinite;
}

.site-search-muted {
  color: var(--site-color-muted);
}

@keyframes site-search-recent-shimmer {
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .site-search-recent-loading > div {
    animation: none;
  }
}
</style>
