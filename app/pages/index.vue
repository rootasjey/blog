<template>
  <div class="site-home">
    <!-- Client-only mobile experience -->
    <ClientOnly>
      <component
        v-if="mobileIndex && isMobile"
        :is="mobileIndex"
        :identity="homeIdentity"
        :is-admin="isAdmin"
        :is-edit-mode="isContentEditMode"
        @saved="saveIdentity"
      />
    </ClientOnly>

    <!-- Desktop / SSR experience -->
    <div v-if="!isMobile">
      <section class="site-intro" :data-public-page-edit-target="isContentEditMode ? 'home-intro' : undefined">
        <HomeIntroEditor
          :identity="homeIdentity"
          :is-admin="isAdmin"
          :is-edit-mode="isContentEditMode"
          @saved="saveIdentity"
        />
        <img class="site-intro-mark" :src="homeIdentity.avatar" :alt="localizedIdentity.name" width="100" height="100">
        <h1>{{ localizedIdentity.name }}</h1>
        <p v-for="(paragraph, index) in homeIntroParagraphs" :key="index">{{ paragraph }}</p>
        <a class="site-interactive-hover site-outline-action site-intro-subscribe" href="#newsletter">{{ $ts('common.subscribe') }}</a>
      </section>
      <div class="animate-entrance"><FeaturedPostsGrid /></div>
      <div class="animate-entrance"><TrendingTagsCarousel /></div>
      <div class="animate-entrance"><RecentPostsGrid /></div>
      <div class="animate-entrance"><NewsletterSubscription /></div>
      <div class="animate-entrance"><ProjectsCarousel /></div>
      <div class="animate-entrance"><HomeRecommendations editable :is-admin="isAdmin" :is-edit-mode="isContentEditMode" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { DEFAULT_HOME_IDENTITY, type HomeIdentity } from '~~/shared/types/home-identity'

const isMobile = useIsMobile()
const config = useRuntimeConfig()

const mobileIndex = computed(() => {
  if (!import.meta.client) return null
  return defineAsyncComponent(() => import('~~/app/components/MobileIndex.vue'))
})

const ogImageUrl = `${config.public.siteUrl}/og/home/default.png`

const { $ts } = useI18n()
const { $getLocale } = useI18n()
const { data: settingsData } = await useFetch<{ socials: unknown[]; homeIdentity?: HomeIdentity }>('/api/site-settings', {
  default: () => ({ socials: [], homeIdentity: DEFAULT_HOME_IDENTITY }),
})
const homeIdentity = computed(() => settingsData.value?.homeIdentity || DEFAULT_HOME_IDENTITY)
const localizedIdentity = computed(() => homeIdentity.value[$getLocale() === 'en' ? 'en' : 'fr'])
const homeIntroParagraphs = computed(() => localizedIdentity.value.description.split(/\n\s*\n/).filter(Boolean))
const { user, loggedIn } = useUserSession()
const isAdmin = computed(() => !!(loggedIn.value && user.value?.role === 'admin'))
const siteEditMode = usePublicPageEditMode()
const isContentEditMode = computed(() => isAdmin.value && siteEditMode.value)

function saveIdentity(identity: HomeIdentity) {
  if (settingsData.value) settingsData.value.homeIdentity = identity
}

const { website } = useJsonld()

useSeoMeta({
  title: $ts('pages.home.title'),
  description: $ts('pages.home.description'),
  ogTitle: $ts('pages.home.ogTitle'),
  ogDescription: $ts('pages.home.ogDescription'),
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
.site-shell .site-intro a:not(.site-outline-action) { color: var(--site-color-accent); text-decoration: underline; text-underline-offset: var(--site-link-underline-offset); }
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
