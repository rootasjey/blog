<template>
  <section class="home-pinned-posts py-8 md:py-12 bg-[#F8F9FA] dark:bg-gray-900 animate-entrance">
    <div class="container mx-auto px-4 max-w-7xl">
      <!-- Loading -->
      <div v-if="pending" :class="scrollerClasses">
        <div v-for="i in 4" :key="i" :class="['flex gap-3 md:gap-4 items-start animate-pulse', itemClass]">
          <div class="rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 bg-gray-200 dark:bg-gray-800"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        :title="$ts('components.topPinned.unavailable')"
        :description="$ts('components.topPinned.unavailableDesc')"
        :secondary-to="localizedPath('/posts', $getLocale())"
        :secondary-label="$ts('common.viewAllPosts')"
        variant="card"
        icon="i-ph-chats-duotone"
      />

      <!-- Content -->
      <div v-else-if="topPosts.length" :class="scrollerClasses">
        <article
          v-for="(post, i) in topPosts"
          :key="post.slug"
          :class="['group', itemClass, 'animate-entrance-item']"
          :style="{ animationDelay: `${i * 60}ms` }"
        >
          <NuxtLink :to="localizedPath(`/posts/${post.slug}`, $getLocale())" class="flex gap-3 md:gap-4 items-start">
            <!-- Image on Left (smaller) -->
            <div v-if="post.image?.src" class="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 flex-shrink-0">
              <PostImage :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover" />
            </div>

            <!-- Content on Right -->
            <div class="flex-1 min-w-0">
              <h2 class="text-base md:text-lg xl:text-base font-text font-bold mb-2 group-hover:underline transition-all line-clamp-1 md:line-clamp-1">
                {{ post.name }}
              </h2>
              <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400">
                <time>{{ post.formattedDate }}</time>
                <span>—</span>
                <span>{{ post.user?.name }}</span>
              </div>
              <span class="line-clamp-2 text-size-4 font-500 text-gray-700 dark:text-gray-300">{{ post.description }}</span>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Empty: dummy row matching final UI -->
      <div v-else :class="[scrollerClasses, 'justify-items-center']">
        <article v-for="(item, i) in dummyHero" :key="item.slug" :class="['group w-90 xl:w-auto', itemClass, 'animate-entrance-item']" :style="{ animationDelay: `${i * 60}ms` }">
          <NuxtLink :to="localizedPath(`/preview/${item.slug}`, $getLocale())" class="flex gap-3 md:gap-4 items-start">
            <!-- Image placeholder on Left -->
            <div class="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 flex-shrink-0 bg-gray-200 dark:bg-gray-800">
              <PostImage v-if="item.img.src" :src="item.img.src" :alt="$ts('components.topPinned.placeholderImgAlt')" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="i-ph-image-duotone text-2xl text-gray-400" />
              </div>
            </div>

            <!-- Content on Right -->
            <div class="flex-1 min-w-0">
              <h2 class="text-base md:text-lg xl:text-base font-text font-bold mb-2 line-clamp-2">
                {{ item.title }}
              </h2>
              <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400">
                <time>{{ item.date }}</time>
                <span>—</span>
                <span>{{ item.author }}</span>
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
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'

const { $getLocale } = useI18n()
const { enhancePost } = usePost()
const TOP_PINNED_TAG = 'top pinned' 

const { data, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { tag: TOP_PINNED_TAG, limit: 4, language: $getLocale() },
})

const topPosts = computed(() => (data.value ?? []).map(p => enhancePost(p)))

const scrollerClasses = 'flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-6 xl:gap-4 md:overflow-visible md:snap-none'
const itemClass = 'min-w-[16rem] flex-shrink-0 snap-start md:min-w-0'

// Dummy items when empty – match the final UI
const { $ts } = useI18n()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const dummyHero = computed(() => PRESENTATION_POSTS.slice(0, 4).map((post, index) => ({
  slug: post.slug,
  title: index === 0 ? $ts('components.topPinned.dummyTitle1') : post.title[locale.value],
  date: new Date(post.publishedAt).toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' }),
  author: $ts(`components.topPinned.dummyAuthor${index + 1}`),
  img: { src: post.image },
})))
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .home-pinned-posts { padding-block: 6px; background: var(--site-color-background); border-bottom: 1px solid var(--site-color-border); }
.site-shell .home-pinned-posts > div {
  width: min(700px, calc(100% - 32px));
  max-width: 700px;
  margin-inline: auto;
  padding-inline: 0;
}
.site-shell .home-pinned-posts > div > div { display: flex; gap: 20px; overflow-x: auto; scrollbar-width: none; }
.site-shell .home-pinned-posts > div > div::-webkit-scrollbar { display: none; }
.site-shell .home-pinned-posts article { flex: 0 0 230px; min-width: 0; }
.site-shell .home-pinned-posts article a { align-items: center; color: var(--site-color-text); text-decoration: none; }
.site-shell .home-pinned-posts article a > div:first-child { width: 60px; height: 60px; border-radius: 50%; }
.site-shell .home-pinned-posts article h2 { margin-bottom: 2px; font-size: 14px; font-weight: 550; }
.site-shell .home-pinned-posts article span { color: var(--site-color-muted); }
@media (max-width: 600px) {
  .site-shell .home-pinned-posts article { flex-basis: min(72vw, 270px); }
}
}
</style>
