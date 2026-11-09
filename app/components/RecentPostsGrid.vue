<template>
  <section class="home-recent-posts py-12 md:py-16 animate-entrance">
    <div class="home-recent-container">
      <div class="site-recent-header flex items-center justify-between mb-6">
        <HomeSectionHeading
          :to="localizedPath('/posts', $getLocale())"
          :title="$ts('components.recentPosts.heading')"
        />

        <NuxtLink
          :to="localizedPath('/posts', $getLocale())"
          class="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
          :aria-label="$ts('common.viewAllPosts')"
        >
          <span>{{ $ts('common.seeAll') }}</span>
          <NIcon name="i-ph-arrow-up-right" />
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="home-recent-grid">
        <CardSkeleton v-for="i in 6" :key="i" :lines="3" />
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        :title="$ts('components.recentPosts.unavailable')"
        :description="$ts('components.recentPosts.unavailableDesc')"
        :secondary-to="localizedPath('/posts', $getLocale())"
        :secondary-label="$ts('common.retry')"
        variant="card"
        icon="i-ph-clock-counter-clockwise-duotone"
      />

      <!-- Empty: dummy grid matching final UI -->
      <div v-else-if="!enhancedPosts.length" class="home-recent-grid">
        <article v-for="(post, i) in demoPosts" :key="post.slug" class="group flex flex-col animate-entrance-item" :style="{ animationDelay: `${i * 40}ms` }">
          <NuxtLink :to="localizedPath(`/preview/${post.slug}`, $getLocale())" class="home-recent-link">
            <div class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 bg-gray-200 dark:bg-gray-800">
              <img :src="post.image" :alt="post.title" class="w-full h-full object-cover" loading="lazy" decoding="async">
            </div>
            <div class="home-recent-content">
              <h3 class="line-clamp-2">{{ post.title }}</h3>
              <div class="home-recent-meta">
                <span class="home-recent-tag" :style="{ color: postTagColor(post.tag) }">{{ post.tag }}</span>
                <time>{{ post.date }}</time>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Grid layout for posts -->
      <div v-else class="home-recent-grid">
        <article
          v-for="(post, i) in enhancedPosts"
          :key="post.slug"
          class="group flex flex-col animate-entrance-item"
          :style="{ animationDelay: `${i * 40}ms` }"
        >
          <NuxtLink :to="localizedPath(`/posts/${post.slug}`, $getLocale())" class="home-recent-link">
            <!-- Image -->
            <div class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
              <PostImage :src="post.image?.src || '/images/corpinot-cover.jpeg'" :alt="post.image?.alt || post.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            <!-- Content -->
            <div class="home-recent-content">
              <h3 class="line-clamp-2 group-hover:opacity-80 transition-opacity">
                {{ post.name }}
              </h3>
              <div v-if="post.tags?.length || post.formattedDate" class="home-recent-meta">
                <span v-if="post.tags?.[0]?.name" class="home-recent-tag" :style="{ color: postTagColor(post.tags[0].name, post.tags[0].color) }">{{ post.tags[0].name }}</span>
                <time v-if="post.formattedDate">{{ post.formattedDate }}</time>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import { EXCLUDED_TAGS } from '~/utils/tagConstants'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

const { $ts, $getLocale } = useI18n()
const { enhancePost } = usePost()

const { data: items, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { limit: 4, exclude: EXCLUDED_TAGS.join(',') },
})

const enhancedPosts = computed(() => {
  const posts = (items.value ?? []).map(p => enhancePost(p))
  const excludeSet = new Set(EXCLUDED_TAGS.map(t => t.toLowerCase()))
  return posts.filter(post => !(post.tags?.some(tag => excludeSet.has(tag.name.toLowerCase()))))
})

const demoPosts = computed(() => {
  const locale = $getLocale() === 'fr' ? 'fr' : 'en'
  return PRESENTATION_POSTS.filter(post => !post.isProject).slice(0, 4).map(post => ({
    slug: post.slug,
    title: post.title[locale],
    tag: post.tag[locale],
    image: post.image,
    date: new Date(post.publishedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
  }))
})

</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .home-recent-container {
  box-sizing: border-box;
  width: min(700px, calc(100% - 32px));
  max-width: 700px;
  margin-inline: auto;
}
.site-shell .home-recent-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-inline: -10px;
}
.site-shell .home-recent-posts { background: var(--site-color-background); color: var(--site-color-text); }
.site-shell .home-recent-posts { margin-top: 80px; padding: 0; }
.site-shell .home-recent-posts .site-recent-header { margin-bottom: 24px; padding: 0; }
.site-shell .home-recent-posts .site-recent-header > a:nth-child(2) { display: none; }
.site-shell .home-recent-posts article { min-width: 0; }
.site-shell .home-recent-posts article > a { display: grid; grid-template-columns: 100px minmax(0, 1fr); align-items: center; gap: 16px; color: inherit; text-decoration: none; }
.site-shell .home-recent-posts article > a > div:first-child { width: 100px; height: 100px; flex: 0 0 100px; margin: 0; border-radius: var(--site-radius-card); aspect-ratio: 1; transition: transform 220ms var(--site-ease-standard); }
.site-shell .home-recent-posts article:hover > a > div:first-child { transform: scale(1.03); }
.site-shell .home-recent-content { display: flex; min-width: 0; flex-direction: column; justify-content: center; gap: 2px; padding-block: 6px; transition: transform 250ms ease; }
.site-shell .home-recent-posts article:hover .home-recent-content { transform: translateX(2px); }
.site-shell .home-recent-posts article h3 { color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 16px; font-weight: 550; line-height: 1.4; }
.site-shell .home-recent-meta { display: flex; align-items: center; gap: 8px; color: var(--site-color-muted); font-size: 13px; line-height: 1.5; }
.site-shell .home-recent-tag { font-size: 13px; }
.site-shell .home-recent-meta time { color: var(--site-color-muted); }
@media (max-width: 1023px) {
  .site-shell .home-recent-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .site-shell .home-recent-posts { margin-top: 0; padding: 48px 0 24px; }
}
}
</style>
