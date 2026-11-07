<template>
  <section class="home-projects animate-entrance">
    <div class="container mx-auto">
      <div class="home-project-heading">
        <HomeSectionHeading
          :to="localizedPath('/projects', $getLocale())"
          :title="$t('components.projectsCarousel.heading')"
        />
      </div>

      <div v-if="pending" class="site-home-project-grid" aria-hidden="true">
        <div v-for="i in 2" :key="i" class="site-home-project-skeleton" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="$t('components.projectsCarousel.unavailable')"
        :description="$t('components.projectsCarousel.unavailableDesc')"
        variant="card"
        icon="i-ph-folder-duotone"
      />

      <div v-else class="site-home-project-grid">
        <article v-for="project in projects" :key="project.slug" class="site-home-project-card">
          <NuxtLink :to="project.to">
            <div class="site-home-project-image">
              <img v-if="project.image.startsWith('/images/')" :src="project.image" :alt="project.title" loading="lazy" decoding="async">
              <PostImage v-else :src="project.image" :alt="project.title" loading="lazy" />
            </div>
            <h3>{{ project.title }}</h3>
            <div class="site-home-project-meta">
              <ProjectTag :label="project.tag" />
              <span>{{ project.year }}</span>
            </div>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '~~/shared/types/post'
const { $t, $getLocale } = useI18n()
import {
  FEATURED_PROJECT_FALLBACK_IMAGE,
  FEATURED_PROJECT_TAG,
  FEATURED_PROJECTS_KEY,
} from '~/utils/featuredProjects'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'

const { enhancePost } = usePost()

// Fetch posts with the featured project tag
const { data, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { tag: FEATURED_PROJECT_TAG, limit: 12, language: $getLocale() },
  key: FEATURED_PROJECTS_KEY,
})

const projects = computed(() => {
  if (data.value && data.value.length > 0) {
    return data.value.slice(0, 2).map(p => enhancePost(p)).map(post => ({
      slug: post.slug,
      to: localizedPath(`/posts/${post.slug}`, $getLocale()),
      title: post.name,
      image: post.image?.src || FEATURED_PROJECT_FALLBACK_IMAGE,
      tag: post.tags?.[0]?.name || $t('components.projectsCarousel.project'),
      year: post.formattedDate.match(/\d{4}/)?.[0] || '',
    }))
  }

  // Presentation projects keep the portfolio navigable before CMS content exists.
  const locale = $getLocale() === 'fr' ? 'fr' : 'en'
  return PRESENTATION_POSTS.filter(project => project.isProject).map(project => ({
    slug: project.slug,
    to: localizedPath(`/preview/${project.slug}`, $getLocale()),
    title: project.title[locale],
    image: project.image,
    tag: project.tag[locale],
    year: new Date(project.publishedAt).getFullYear().toString(),
  }))
})
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .home-projects > div {
  width: min(700px, calc(100% - 32px));
  max-width: 700px;
  margin-inline: auto;
  padding-inline: 0;
}
.site-shell .home-projects {
  margin-top: 81px;
  padding: 0;
  background: var(--site-color-background);
  color: var(--site-color-text);
}
.site-shell .home-projects > div {
  padding-inline: 0;
}
.site-shell .home-project-heading {
  margin-bottom: 24px;
}
.site-shell .site-home-project-grid {
  display: grid;
  width: 720px;
  max-width: calc(100vw - 32px);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin: 0 0 0 -10px;
}
.site-shell .home-projects .site-home-project-card {
  width: auto;
  min-width: 0;
}
.site-shell .site-home-project-card > a {
  display: block;
  color: inherit;
  text-decoration: none;
}
.site-shell .home-projects .site-home-project-image {
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: var(--site-radius-card);
  background: #2b2b30;
}
.site-shell .site-home-project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.21, 1.8);
}
.site-shell .site-home-project-card:hover .site-home-project-image img,
.site-shell .site-home-project-card:focus-within .site-home-project-image img {
  transform: scale(1.03);
}
.site-shell .home-projects .site-home-project-card h3 {
  display: -webkit-box;
  margin: 14px 0 4px;
  overflow: hidden;
  color: var(--site-color-heading);
  font-size: 18px;
  font-weight: 550;
  line-height: 24px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.site-shell .site-home-project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--site-color-muted);
  font-size: 13px;
  line-height: 20px;
}
.site-shell .site-home-project-meta > span:last-child {
  font-weight: 500;
}
.site-shell .site-home-project-skeleton {
  aspect-ratio: 4 / 3;
  border-radius: var(--site-radius-card);
  background: var(--site-color-border);
}
@media (max-width: 1023px) {
  .site-shell .home-projects article {
    width: min(78vw, 348px);
  }
}
@media (max-width: 1023px) {
  .site-shell .home-projects {
    margin-top: 40px;
    padding-block: 0;
  }
}
@media (max-width: 1023px) {
  .site-shell .site-home-project-grid {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
  }
}
@media (max-width: 600px) {
  .site-shell .site-home-project-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-home-project-image img {
    transition: none;
  }

  .site-shell .site-home-project-card:hover .site-home-project-image img,
  .site-shell .site-home-project-card:focus-within .site-home-project-image img {
    transform: none;
  }
}
}
</style>
