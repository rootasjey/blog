<template>
  <div class="site-home">
    <!-- Client-only mobile experience -->
    <ClientOnly>
      <component
        v-if="mobileIndex && isMobile"
        :is="mobileIndex"
      />
    </ClientOnly>

    <!-- Desktop / SSR experience -->
    <div v-if="!isMobile">
      <section class="site-intro">
        <img class="site-intro-mark" src="/images/presentation/jc-pp.jpg" alt="Jérémie Corpinot" width="100" height="100">
        <h1>Jérémie Corpinot</h1>
        <p v-for="(paragraph, index) in homeIntroParagraphs" :key="index">{{ paragraph }}</p>
        <a class="site-interactive-hover site-outline-action site-intro-subscribe" href="#newsletter">{{ $t('common.subscribe') }}</a>
      </section>
      <div class="animate-entrance"><FeaturedPostsGrid /></div>
      <div class="animate-entrance"><TrendingTagsCarousel /></div>
      <div class="animate-entrance"><RecentPostsGrid /></div>
      <div class="animate-entrance"><NewsletterSubscription /></div>
      <div class="animate-entrance"><ProjectsCarousel /></div>
      <div class="animate-entrance"><HomeRecommendations /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

const isMobile = useIsMobile()
const config = useRuntimeConfig()

const mobileIndex = computed(() => {
  if (!import.meta.client) return null
  return defineAsyncComponent(() => import('~~/app/components/MobileIndex.vue'))
})

const ogImageUrl = `${config.public.siteUrl}/og/home/default.png`

const { $t } = useI18n()
const homeIntroParagraphs = computed(() => $t('pages.home.intro').split(/\n\s*\n/).filter(Boolean))

const { website } = useJsonld()

useSeoMeta({
  title: $t('pages.home.title'),
  description: $t('pages.home.description'),
  ogTitle: $t('pages.home.ogTitle'),
  ogDescription: $t('pages.home.ogDescription'),
  ogImage: ogImageUrl,
  ogUrl: config.public.siteUrl,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
})

useHead({
  link: [{ rel: 'canonical', href: config.public.siteUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(website()),
    },
  ],
})
</script>

<style>
@layer components {

/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
}
</style>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-home { background: var(--site-color-background); color: var(--site-color-text); }
.site-shell .site-intro {
  width: min(700px, calc(100% - 32px));
  box-sizing: border-box;
  margin-inline: auto;
  padding-block: 70px 49px;
  color: var(--site-color-text);
}
.site-shell .site-intro-mark {
  display: grid;
  width: 100px;
  height: 100px;
  place-items: center;
  margin-bottom: 38px;
  border: 0;
  border-radius: 50%;
  object-fit: cover;
}
.site-shell .site-intro h1 { margin: 0 0 12px; font-family: var(--site-font-heading); color: var(--site-color-heading); font-size: 20px; font-weight: 550; line-height: 1.4; }
.site-shell .site-intro p { max-width: 700px; margin: 0 0 8px; font-family: var(--site-font-heading); color: var(--site-color-text); line-height: 1.5; }
.site-shell .site-intro a:not(.site-outline-action) { color: var(--site-color-accent); text-decoration: underline; text-underline-offset: 0.2em; }
.site-shell .site-intro .site-intro-subscribe { margin-top: 41px; }
.site-shell:has(.site-home):not(:has(.site-home-recommendations)) > .site-footer { padding-top: 48px; }
@media (max-width: 1023px) {
  .site-shell .site-intro { padding-block: 40px 52px; }
}
@media (max-width: 1023px) {
  .site-shell .site-intro-mark { width: 72px; height: 72px; margin-bottom: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-intro-subscribe { transition: border-color 160ms ease; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-intro-subscribe:hover,
.site-shell .site-intro-subscribe:focus-visible,
.site-shell .site-intro-subscribe:active { transform: none; }
}
}
</style>
