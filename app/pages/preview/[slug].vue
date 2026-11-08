<template>
  <main v-if="post" class="site-post site-preview-post">
    <header class="site-post-header">
      <div class="container">
        <div>
          <nav class="site-preview-topic-nav" :aria-label="locale === 'fr' ? 'Articles associés' : 'Related posts'">
            <NuxtLink :to="localizedPath(`/preview/${previousPost.slug}`, $getLocale())" :aria-label="locale === 'fr' ? 'Article précédent' : 'Previous post'">
              <span class="i-ph-arrow-left" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink class="site-preview-tag" :to="`${localizedPath('/posts', $getLocale())}?tag=${encodeURIComponent(post.tag[locale])}`">
              {{ post.tag[locale] }}
            </NuxtLink>
            <NuxtLink :to="localizedPath(`/preview/${nextPost.slug}`, $getLocale())" :aria-label="locale === 'fr' ? 'Article suivant' : 'Next post'">
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
        <div class="post-content">
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
        <div class="site-post-author-card">
          <img src="/images/presentation/jc-pp.jpg" :alt="$t('components.postEndMatter.authorName')" width="48" height="48" loading="lazy">
          <div class="site-post-author-copy">
            <NuxtLink :to="localizedPath('/about', $getLocale())">{{ $t('components.postEndMatter.authorName') }}</NuxtLink>
            <p>{{ $t('components.postEndMatter.authorBio') }}</p>
          </div>
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
const { $getLocale, $t } = useI18n()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const post = computed(() => PRESENTATION_POSTS.find(item => item.slug === route.params.slug))
const postIndex = computed(() => PRESENTATION_POSTS.findIndex(item => item.slug === route.params.slug))
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
}
</style>
