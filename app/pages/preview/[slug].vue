<template>
  <main v-if="post" class="site-post site-preview-post">
    <header class="site-post-header">
      <div class="container">
        <div>
          <nav class="site-preview-topic-nav" :aria-label="locale === 'fr' ? 'Articles associés' : 'Related posts'">
            <NuxtLink v-if="previousPost" :to="localizedPath(`/preview/${previousPost.slug}`, $getLocale())" :aria-label="locale === 'fr' ? 'Article précédent' : 'Previous post'" :data-cursor-tooltip="locale === 'fr' ? 'Article précédent' : 'Previous post'">
              <span class="i-ph-arrow-left" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink class="site-preview-tag" :to="`${localizedPath('/posts', $getLocale())}?tag=${encodeURIComponent(post.tag[locale])}`">
              {{ post.tag[locale] }}
            </NuxtLink>
            <NuxtLink v-if="nextPost" :to="localizedPath(`/preview/${nextPost.slug}`, $getLocale())" :aria-label="locale === 'fr' ? 'Article suivant' : 'Next post'" :data-cursor-tooltip="locale === 'fr' ? 'Article suivant' : 'Next post'">
              <span class="i-ph-arrow-right" aria-hidden="true" />
            </NuxtLink>
          </nav>
          <h1>{{ post.title[locale] }}</h1>
          <p class="post-summary">{{ post.description[locale] }}</p>
        </div>
      </div>
    </header>

    <div class="site-preview-cover">
      <img :src="post.image" :alt="post.title[locale]" class="post-cover" decoding="async">
    </div>

    <ReadingProgress content-selector=".site-preview-post .post-content" />

    <article class="site-post-content">
      <div class="container">
        <div class="site-post-reading-column post-content">
          <p v-for="paragraph in post.paragraphs[locale]" :key="paragraph">{{ paragraph }}</p>
          <h2>{{ locale === 'fr' ? 'À retenir' : 'A note to take away' }}</h2>
          <p>{{ locale === 'fr'
            ? 'Cette page présente le parcours éditorial de Corpinot. Les articles réels publiés depuis le CMS prennent automatiquement la place de ces exemples.'
            : 'This page previews Corpinot’s editorial flow. Articles published from the CMS automatically take the place of these examples.' }}</p>
          <NuxtLink class="site-preview-back" :to="localizedPath('/posts', $getLocale())">{{ locale === 'fr' ? 'Retour aux articles' : 'Back to the journal' }}</NuxtLink>
        </div>
      </div>
    </article>

    <section v-if="!post.isProject" class="site-post-end">
      <div class="container">
        <div class="site-post-author-card site-post-public-byline">
          <NuxtLink class="site-post-author-link" :to="localizedPath('/about', $getLocale())" :aria-label="$ts('components.postEndMatter.authorName')">
            <div class="site-post-author-heading">
              <img src="/images/presentation/jc-pp.jpg" :alt="$ts('components.postEndMatter.authorName')" width="32" height="32" loading="lazy">
              <span>{{ $ts('components.postEndMatter.authorName') }}</span>
            </div>
            <p class="site-post-author-bio">{{ $ts('components.postEndMatter.authorBio') }}</p>
          </NuxtLink>
          <div class="site-post-public-meta">
            <time :datetime="post.publishedAt">{{ publishedAtLabel }}</time>
          </div>
        </div>

        <div class="site-post-actions-row">
          <PostShareActions :title="post.title[locale]" />
        </div>
        <PostRelatedArticles :articles="relatedArticles" />
      </div>
    </section>

    <NewsletterSubscription v-if="!post.isProject" />
  </main>
</template>

<script setup lang="ts">
import { createError } from 'h3'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'

const route = useRoute()
const { $getLocale, $ts } = useI18n()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const post = computed(() => PRESENTATION_POSTS.find(item => item.slug === route.params.slug))
const postIndex = computed(() => PRESENTATION_POSTS.findIndex(item => item.slug === route.params.slug))
const publishedAtLabel = computed(() => {
  const publishedAt = post.value?.publishedAt
  if (!publishedAt) return ''

  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(`${publishedAt}T12:00:00`))
})
const previousPost = computed(() => PRESENTATION_POSTS[(postIndex.value - 1 + PRESENTATION_POSTS.length) % PRESENTATION_POSTS.length])
const nextPost = computed(() => PRESENTATION_POSTS[(postIndex.value + 1) % PRESENTATION_POSTS.length])
const relatedArticles = computed(() => {
  if (!post.value) return []
  const otherPosts = PRESENTATION_POSTS.filter(item => !item.isProject && item.slug !== post.value?.slug)
  const sameTag = otherPosts.filter(item => item.tag[locale.value] === post.value?.tag[locale.value])
  const selected = [...sameTag, ...otherPosts.filter(item => !sameTag.includes(item))].slice(0, 2)

  return selected.map(item => ({
    to: localizedPath(`/preview/${item.slug}`, $getLocale()),
    title: item.title[locale.value],
    image: item.image,
    tag: item.tag[locale.value],
    date: item.publishedAt,
    dateLabel: new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(`${item.publishedAt}T12:00:00`)),
  }))
})

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Preview article not found' })
}

useSeoMeta({
  title: () => post.value?.title[locale.value],
  description: () => post.value?.description[locale.value],
})
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-preview-back { color: var(--site-color-accent); text-decoration: underline; text-underline-offset: var(--site-link-underline-offset); }
.site-shell .site-preview-post .site-post-content .post-content { color: var(--site-color-text); font-family: var(--site-font-body); font-size: 16px; line-height: 1.7; }
.site-shell .site-preview-post .site-post-content .post-content > p { margin-block: 0 24px; font-size: 16px; line-height: 1.7; }
.site-shell .site-preview-post .site-post-content .post-content h2 { margin-block: 40px 18px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 20px; font-weight: 550; letter-spacing: 0; line-height: 1.4; }
.site-shell .site-preview-post .site-post-author-heading { display: flex; width: fit-content; align-items: center; gap: 12px; color: var(--site-color-heading); font-size: 16px; font-weight: 550; }
.site-shell .site-preview-post .site-post-author-heading > img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.site-shell .site-preview-post .site-post-author-bio { margin: 14px 0 0; color: var(--site-color-muted); font-size: 14px; line-height: 1.55; }
.site-shell .site-preview-post .site-post-actions-row { display: flex; width: min(700px, calc(100% - 32px)); align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: 20px auto 0; }
@media (max-width: 640px) {
  .site-shell .site-preview-post .site-post-author-heading { gap: 10px; }
  .site-shell .site-preview-post .site-post-actions-row { gap: 8px; margin-top: 16px; }
  .site-shell .site-preview-post .site-post-actions-row .site-post-share-actions { gap: 4px; }
  .site-shell .site-preview-post .site-post-actions-row .site-post-share-actions > a,
  .site-shell .site-preview-post .site-post-actions-row .site-post-share-actions > button { width: 32px; height: 32px; }
}
}
</style>
