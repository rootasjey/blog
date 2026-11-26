<template>
  <section class="home-trending-tags">
    <div class="container mx-auto">
      <h2>
        <NuxtLink class="home-trending-tags-heading" :to="localizedPath('/tags', $getLocale())">
          <span>{{ $ts('components.trendingTags.heading') }}</span>
          <span class="i-ph-arrow-right" aria-hidden="true" />
        </NuxtLink>
      </h2>
      <nav :aria-label="$ts('components.trendingTags.heading')">
        <TagDisplayItem
          v-for="tag in tags"
          :key="tag.name"
          class="home-trending-tag"
          :to="`${localizedPath('/posts', $getLocale())}?tag=${encodeURIComponent(tag.name)}`"
          :name="tag.name"
          :title="tag.title"
          :count="tag.count"
          :icon="tag.icon"
          :icon-svg="tag.iconSvg"
          :color="tag.color"
          variant="home"
          :aria-label="`${tag.title}: ${tag.count}`"
          :edit-target="isAdmin && isEditMode && tag.id != null ? `tag:${tag.id}` : undefined"
        />
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ApiTag } from '~~/shared/types/tags'
import { EXCLUDED_TAGS } from '~/utils/tagConstants'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'
import { localizedTagTitle } from '~~/shared/utils/tag-localization'

type TrendingTag = {
  id?: number
  name: string
  title: string
  count: number
  icon: string | null
  iconSvg: string | null
  color: string | null
}

defineProps<{ isAdmin: boolean; isEditMode: boolean }>()

const { $getLocale, $ts } = useI18n()
const tagStore = useTagStore()

try {
  await tagStore.fetchTags()
} catch {
  // Presentation tags keep the homepage navigable when the API is unavailable.
}

const tags = computed<TrendingTag[]>(() => {
  const locale = $getLocale() === 'fr' ? 'fr' : 'en'
  const posts = PRESENTATION_POSTS.filter(post => !post.isProject)
  const sampleCounts = new Map<string, number>()

  for (const post of posts) {
    const name = post.tag[locale]
    sampleCounts.set(name, (sampleCounts.get(name) || 0) + 1)
  }

  const hiddenTags = new Set([...EXCLUDED_TAGS, 'project'])
  const liveTags = (tagStore.allTags as ApiTag[])
    .filter(tag => !hiddenTags.has(tag.name.toLocaleLowerCase()) && (tag.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 4)
  if (liveTags.length) {
    return liveTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      title: localizedTagTitle(tag, locale),
      count: tag.count ?? 0,
      icon: tag.icon ?? null,
      iconSvg: tag.icon_svg ?? null,
      color: tag.color ?? null,
    }))
  }

  return [...sampleCounts].slice(0, 4).map(([name, count]) => ({ name, title: name, count, icon: null, iconSvg: null, color: null }))
})
</script>

<style>
@layer components {
  /* Component and page styles moved from the global stylesheets. */
  .site-shell .home-trending-tags > div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: min(700px, calc(100% - 32px));
    max-width: 700px;
    min-width: 0;
    row-gap: 24px;
    margin-inline: auto;
    padding-inline: 0;
  }
  .site-shell .home-trending-tags h2 {
    margin: 0 0 20px;
    color: var(--site-color-text);
    font-family: var(--site-font-body);
    font-size: 16px;
    font-weight: 550;
    letter-spacing: 0;
    text-transform: none;
  }
  .site-shell .home-trending-tags {
    background: var(--site-color-background);
    color: var(--site-color-text);
  }
  .site-shell .home-trending-tags {
    margin-top: 62px;
    padding: 0;
  }
  .site-shell .home-trending-tags h2 {
    display: flex;
    width: 100%;
    margin: 0;
    color: var(--site-color-muted);
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }
  .site-shell .home-trending-tags-heading {
    position: relative;
    z-index: 1;
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 2px;
    color: var(--site-color-muted);
    text-decoration: none;
    transition:
      color 200ms ease,
      transform 220ms var(--site-ease-standard);
  }
  .site-shell .home-trending-tags-heading::before {
    position: absolute;
    z-index: -1;
    inset: -3px -8px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    content: "";
    transition: background-color 150ms ease;
  }
  .site-shell .home-trending-tags-heading > span:last-child {
    width: 1em;
    height: 1em;
    transition: transform 200ms ease;
  }
  .site-shell .home-trending-tags-heading:hover {
    color: var(--site-color-heading);
    transform: translateY(-1px);
  }
  .site-shell .home-trending-tags-heading:hover::before {
    border-color: var(--site-color-hover-background);
    background: var(--site-color-hover-background);
  }
  .site-shell .home-trending-tags-heading:hover > span:last-child {
    transform: translateX(1px);
  }
  .site-shell .home-trending-tags nav {
    display: flex;
    width: 720px;
    max-width: calc(100% + 20px);
    flex-direction: column;
    gap: 12px;
    margin: 0 0 0 -10px;
  }
  @media (max-width: 600px) {
    .site-shell .home-trending-tags {
      margin-top: 40px;
      padding: 0;
    }
    .site-shell .home-trending-tags nav {
      width: 100%;
      max-width: 100%;
      margin-inline: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .site-shell .home-trending-tags-heading,
    .site-shell .home-trending-tags-heading > span:last-child {
      transition: none;
      transform: none;
    }
  }
}
</style>
