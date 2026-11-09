<template>
  <section class="site-page site-author-index">
    <div>
      <CollectionIntro :title="copy.title" :description="copy.description" />

      <div v-if="pending" class="site-author-index-list" aria-label="Loading authors">
        <div v-for="i in 2" :key="i" class="site-author-index-skeleton" />
      </div>

      <p v-else-if="error" class="site-author-index-message">{{ $ts('pages.authors.unavailable') }}</p>

      <div v-else class="site-author-index-list">
        <NuxtLink
          v-for="author in authors"
          :key="author.id"
          :to="localizedPath(`/authors/${author.slug || author.id}`, $getLocale())"
          class="site-author-index-entry"
        >
          <NuxtImg
            v-if="author.avatar"
            provider="hubblob"
            :src="author.avatar"
            :alt="author.name"
            class="site-author-index-avatar"
            width="104"
            height="104"
          />
          <span v-else class="site-author-index-avatar site-author-index-avatar--empty" aria-hidden="true">
            {{ author.name.charAt(0).toUpperCase() }}
          </span>

          <span class="site-author-index-copy">
            <span class="site-author-index-name">{{ author.name }}</span>
            <span v-if="author.biography" class="site-author-index-biography">{{ author.biography }}</span>
            <span class="site-author-index-count">
              {{ author.postCount }}
              {{ locale === 'fr'
                ? (author.postCount === 1 ? 'article' : 'articles')
                : (author.postCount === 1 ? 'post' : 'posts') }}
            </span>
          </span>
        </NuxtLink>

        <p v-if="!authors.length" class="site-author-index-message">
          {{ locale === 'fr' ? 'Aucun auteur à afficher pour le moment.' : 'There are no authors to display yet.' }}
        </p>
      </div>
    </div>
  </section>

  <div class="site-public-archive-footer site-public-authors-footer">
    <NewsletterSubscription />
    <HomeRecommendations />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { localizedPath } from '~/utils/presentationPosts'

type Author = {
  id: number
  name: string
  slug?: string
  avatar: string | null
  biography: string | null
  job: string | null
  location: string | null
  postCount: number
}

const { $getLocale, $ts } = useI18n()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const copy = computed(() => locale.value === 'fr'
  ? {
      title: 'Contributeurs & collaborateurs',
      description: 'Un cercle choisi de rédacteurs, designers et chercheurs dont les perspectives nourrissent ce journal. Découvrez les personnes derrière les essais, les notes et les projets publiés ici.',
    }
  : {
      title: 'Contributors & Collaborators',
      description: 'A curated circle of writers, designers, and researchers whose perspectives shape this journal. Explore the people behind the essays, notes, and selected work published here.',
    })

const { data, pending, error } = await useFetch<Author[]>('/api/authors')
const authors = computed(() => data.value ?? [])
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-author-index { padding: 70px 0 64px; }
.site-shell .site-author-index > div { width: min(960px, calc(100vw - 32px)); max-width: 960px; margin-inline: auto; }
.site-shell .site-author-index .site-collection-intro { margin: 0 0 104px; }
.site-shell .site-author-index .site-collection-avatar { margin-bottom: 48px; }
.site-shell .site-author-index-list { display: grid; gap: 72px; }
.site-shell .site-author-index-entry { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 0; color: var(--site-color-text); text-decoration: none; }
.site-shell .site-author-index-avatar { display: grid; width: 128px; height: 128px; margin-bottom: 32px; place-items: center; border-radius: 50%; background: var(--site-color-hover-background); color: var(--site-color-muted); font-size: 24px; object-fit: cover; }
.site-shell .site-author-index-copy { display: grid; gap: 12px; min-width: 0; }
.site-shell .site-author-index-name { color: var(--site-color-heading); font-size: 20px; font-weight: 550; line-height: 28px; }
.site-shell .site-author-index-biography { color: var(--site-color-text); font-size: 16px; line-height: 24px; }
.site-shell .site-author-index-count { color: var(--site-color-muted); font-size: 14px; line-height: 20px; }
.site-shell .site-author-index-entry:hover .site-author-index-name { text-decoration: underline; text-underline-offset: var(--site-link-underline-offset); }
.site-shell .site-author-index-entry:focus-visible { outline: 2px solid var(--site-color-accent); outline-offset: 6px; border-radius: 3px; }
.site-shell .site-author-index-message { color: var(--site-color-muted); }
.site-shell .site-author-index-skeleton { width: 100%; height: 104px; border-radius: 16px; background: var(--site-color-hover-background); animation: pulse 1.5s ease-in-out infinite; }
.site-shell .site-public-authors-footer .home-newsletter { margin-top: 120px; }
.site-shell .site-author-index > div { width: min(700px, calc(100% - 32px)); max-width: 700px; margin-inline: auto; }
@media (max-width: 1023px) {
  .site-shell .site-author-index { padding-top: 40px; }
}
@media (max-width: 1023px) {
  .site-shell .site-author-index .site-collection-intro { margin-bottom: 56px; }
}
@media (max-width: 1023px) {
  .site-shell .site-author-index .site-collection-avatar { margin-bottom: 32px; }
}
@media (max-width: 1023px) {
  .site-shell .site-author-index-list { gap: 48px; }
}
@media (max-width: 1023px) {
  .site-shell .site-author-index-entry { grid-template-columns: minmax(0, 1fr); gap: 0; }
}
@media (max-width: 1023px) {
  .site-shell .site-author-index-avatar { width: 96px; height: 96px; margin-bottom: 24px; }
}
@media (max-width: 1023px) {
  .site-shell .site-public-authors-footer .home-newsletter { margin-top: 80px; }
}
}
</style>
