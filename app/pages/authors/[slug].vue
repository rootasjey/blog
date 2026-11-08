<template>
  <section class="site-page site-author-detail">
    <div class="site-author-container">
      <NuxtLink :to="localizedPath('/authors', $getLocale())" class="site-author-back">{{ $t('pages.authors.backToAuthors') }}</NuxtLink>

      <header class="site-author-profile">
        <NuxtImg
          v-if="author?.avatar"
          provider="hubblob"
          :src="author.avatar"
          :alt="author.name"
          class="site-author-avatar"
          width="96"
          height="96"
        />
        <span v-else class="site-author-avatar site-author-avatar--empty" aria-hidden="true">
          {{ authorInitials }}
        </span>

        <h1>{{ author?.name }}</h1>
        <p v-if="author?.job || author?.location" class="site-author-role">
          <span v-if="author?.job">{{ author.job }}</span>
          <span v-if="author?.job && author?.location" aria-hidden="true">·</span>
          <span v-if="author?.location">{{ author.location }}</span>
        </p>
        <p v-if="author?.biography" class="site-author-biography">{{ author.biography }}</p>

        <nav v-if="authorSocials.length" class="site-author-socials" :aria-label="$t('pages.authors.socialLinks')">
          <a
            v-for="social in authorSocials"
            :key="social.platform + social.url"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NIcon :name="platformIcon(social.platform)" aria-hidden="true" />
            <span>{{ social.platform }}</span>
          </a>
        </nav>
      </header>

      <section class="site-author-posts" :aria-label="$t('pages.authors.articles')">
        <div class="site-author-posts-heading">
          <h2>{{ $t('pages.authors.articles') }}</h2>
          <span>{{ posts.length }} {{ $t('pages.authors.published') }}</span>
        </div>

        <div v-if="postsPending" class="site-author-posts-list" aria-hidden="true">
          <div v-for="i in 4" :key="i" class="site-author-post-skeleton" />
        </div>

        <p v-else-if="postsError" class="site-author-posts-message site-author-posts-message--error">{{ postsError }}</p>

        <p v-else-if="!posts.length" class="site-author-posts-message">{{ $t('pages.authors.noArticles') }}</p>

        <div v-else class="site-author-posts-list">
          <NuxtLink
            v-for="post in posts"
            :key="post.slug"
            :to="localizedPath(`/posts/${post.slug}`, $getLocale())"
            class="site-author-post"
          >
            <span class="site-author-post-image">
              <PostImage
                v-if="post.image?.src"
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                loading="lazy"
              />
              <NIcon v-else name="i-lucide-file-text" aria-hidden="true" />
            </span>
            <span class="site-author-post-copy">
              <span class="site-author-post-title">{{ post.name }}</span>
              <span class="site-author-post-meta">
                <span
                  v-if="post.tags?.[0]?.name"
                  :style="{ '--site-author-tag-color': postTagColor(post.tags[0].name) }"
                >{{ post.tags[0].name }}</span>
                <time :datetime="post.publishedAt || post.createdAt">
                  {{ formatPostDate(post.publishedAt || post.createdAt, 'long') }}
                </time>
              </span>
            </span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createError } from 'h3'
import type { Post } from '~~/shared/types/post'
import { localizedPath } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

type Author = {
  id: number
  name: string
  slug?: string
  avatar: string
  biography: string
  job: string
  location: string
  socials: { platform: string; url: string }[]
}

const route = useRoute()
const slug = String(route.params.slug)
const { $t, $getLocale } = useI18n()
const { formatPostDate } = usePost()

const { data: authorData, error: authorError } = await useFetch<Author>(`/api/authors/${slug}`)
const author = computed(() => authorData.value)

const authorInitials = computed(() => {
  if (!author.value?.name) return ''
  return author.value.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
})

const authorSocials = computed(() => author.value?.socials ?? [])

function platformIcon(platform?: string) {
  if (!platform) return 'i-lucide-link'
  let p = platform.toLowerCase().trim()
  if (p.startsWith('http')) {
    try {
      const h = new URL(p).hostname
      p = h.replace(/^www\./, '')
    } catch (_) {}
  }
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'i-lucide-twitter'
  if (p.includes('github')) return 'i-lucide-github'
  if (p.includes('linkedin')) return 'i-lucide-linkedin'
  if (p.includes('instagram')) return 'i-lucide-instagram'
  if (p.includes('facebook')) return 'i-lucide-facebook'
  if (p.includes('tiktok')) return 'i-lucide-music'
  if (p.includes('youtube') || p.includes('youtu.be')) return 'i-lucide-youtube'
  if (p.includes('website') || p.includes('site') || p.includes('blog') || p.includes('homepage')) return 'i-lucide-globe'
  return 'i-lucide-link'
}

const {
  data: postsData,
  pending: postsPending,
  error: postsError,
} = await useFetch<Post[]>(`/api/posts`, {
  params: { author: slug, status: 'published' },
})

const posts = computed(() => postsData.value ?? [])

if (authorError.value) {
  const { $t } = useI18n()
  throw createError({ statusCode: 404, statusMessage: $t('pages.authors.notFound') })
}

const config = useRuntimeConfig()
const ogImageUrl = computed(() => `${config.public.siteUrl}/og/author/${slug}.png`)

useSeoMeta({
  title: () => `${author.value?.name} - Corpinot`,
  description: () => author.value?.biography || `Articles by ${author.value?.name}`,
  ogTitle: () => author.value?.name || '',
  ogDescription: () => author.value?.biography || `Articles by ${author.value?.name}`,
  ogImage: ogImageUrl,
  ogUrl: () => `${config.public.siteUrl}/authors/${slug}`,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/authors/${slug}` }],
})
</script>

<style>
@layer components {

.site-shell .site-author-detail { padding-block: 40px 64px; }
.site-shell .site-author-container { width: min(700px, calc(100% - 32px)); margin-inline: auto; }
.site-shell .site-author-back { display: inline-flex; align-items: center; margin-bottom: 36px; color: var(--site-color-muted); font-size: 13px; text-decoration: none; transition: color 180ms ease; }
.site-shell .site-author-back:hover { color: var(--site-color-heading); }
.site-shell .site-author-back:focus-visible,
.site-shell .site-author-socials a:focus-visible,
.site-shell .site-author-post:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 4px; border-radius: 4px; }
.site-shell .site-author-profile { display: grid; justify-items: start; margin-bottom: 56px; }
.site-shell .site-author-avatar { display: grid; width: 100px; height: 100px; margin-bottom: 32px; place-items: center; border-radius: 50%; background: var(--site-color-hover-background); color: var(--site-color-muted); font-size: 24px; object-fit: cover; }
.site-shell .site-author-profile h1 { margin: 0 0 8px; color: var(--site-color-heading); font-family: var(--site-font-heading); font-size: 24px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.3; }
.site-shell .site-author-role { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; color: var(--site-color-muted); font-size: 14px; line-height: 20px; }
.site-shell .site-author-biography { max-width: 660px; margin: 0; color: var(--site-color-text); font-size: 16px; line-height: 1.6; }
.site-shell .site-author-socials { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
.site-shell .site-author-socials a { display: inline-flex; align-items: center; gap: 6px; color: var(--site-color-muted); font-size: 13px; text-decoration: none; transition: color 180ms ease; }
.site-shell .site-author-socials a:hover { color: var(--site-color-heading); }
.site-shell .site-author-posts-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.site-shell .site-author-posts-heading h2 { margin: 0; color: var(--site-color-muted); font-size: 14px; font-weight: 500; line-height: 20px; }
.site-shell .site-author-posts-heading > span { color: var(--site-color-muted); font-size: 12px; line-height: 18px; }
.site-shell .site-author-posts-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.site-shell .site-author-post { display: grid; min-width: 0; grid-template-columns: 100px minmax(0, 1fr); align-items: center; gap: 16px; color: var(--site-color-text); text-decoration: none; }
.site-shell .site-author-post-image { display: grid; width: 100px; height: 100px; overflow: hidden; place-items: center; border-radius: 14px; background: var(--site-color-hover-background); color: var(--site-color-muted); }
.site-shell .site-author-post-image > img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 260ms var(--site-ease-standard); }
.site-shell .site-author-post:hover .site-author-post-image > img { transform: scale(1.04); }
.site-shell .site-author-post-copy { display: grid; min-width: 0; gap: 7px; }
.site-shell .site-author-post-title { display: -webkit-box; overflow: hidden; color: var(--site-color-heading); font-size: 18px; font-weight: 550; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.site-shell .site-author-post:hover .site-author-post-title { text-decoration: underline; text-underline-offset: var(--site-link-underline-offset); }
.site-shell .site-author-post-meta { display: flex; flex-wrap: wrap; gap: 8px; color: var(--site-color-muted); font-size: 12px; line-height: 18px; }
.site-shell .site-author-post-meta > span { color: var(--site-author-tag-color, var(--site-color-accent)); }
.site-shell .site-author-posts-message { color: var(--site-color-muted); }
.site-shell .site-author-posts-message--error { color: var(--site-color-danger); }
.site-shell .site-author-post-skeleton { height: 100px; border-radius: 14px; background: var(--site-color-hover-background); animation: pulse 1.5s ease-in-out infinite; }
@media (max-width: 680px) {
  .site-shell .site-author-detail { padding-block: 32px 48px; }
  .site-shell .site-author-back { margin-bottom: 28px; }
  .site-shell .site-author-profile { margin-bottom: 40px; }
  .site-shell .site-author-posts-list { grid-template-columns: minmax(0, 1fr); gap: 24px; }
}
}
</style>
