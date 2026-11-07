<template>
  <section class="home-trending-tags">
    <div class="container mx-auto">
      <h2>
        <NuxtLink class="home-trending-tags-heading" :to="localizedPath('/tags', $getLocale())">
          <span>{{ $t('components.trendingTags.heading') }}</span>
          <span class="i-ph-arrow-right" aria-hidden="true" />
        </NuxtLink>
      </h2>
      <nav :aria-label="$t('components.trendingTags.heading')">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.name"
          :to="`${localizedPath('/posts', $getLocale())}?tag=${encodeURIComponent(tag.name)}`"
          :aria-label="`${tag.name}: ${tag.count}`"
          :style="{ '--tag-accent': postTagColor(tag.name) }"
        >
          <span class="home-trending-tag-icon" aria-hidden="true">
            <NIcon v-if="tag.icon" :name="tag.icon" />
            <span v-else>{{ tagInitial(tag.name) }}</span>
          </span>
          <span class="home-trending-tag-name">
            {{ tag.name }}
            <span class="home-trending-tag-count">x{{ tag.count }}</span>
          </span>
        </NuxtLink>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ApiTag } from '~~/shared/types/tags'
import { EXCLUDED_TAGS } from '~/utils/tagConstants'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

const { $getLocale, $t } = useI18n()
const tagStore = useTagStore()

try {
  await tagStore.fetchTags()
} catch {
  // Presentation tags keep the homepage navigable when the API is unavailable.
}

const tags = computed(() => {
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
      name: tag.name,
      count: tag.count ?? 0,
      icon: tag.icon ?? null,
    }))
  }

  return [...sampleCounts].slice(0, 4).map(([name, count]) => ({ name, count, icon: null }))
})

function tagInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() || '#'
}
</script>

<style>
@layer components {
  /* Component and page styles moved from the global stylesheets. */
  .site-shell .home-trending-tags > div {
    display: grid;
    width: min(700px, calc(100% - 32px));
    max-width: 700px;
    row-gap: 32px;
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
      transform 300ms cubic-bezier(0.4, 0, 0.2, 2.4);
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
  .site-shell .home-trending-tags nav a {
    display: flex;
    min-width: 0;
    height: 44px;
    flex: 0 0 44px;
    align-items: center;
    gap: 12px;
    padding-inline: 10px;
    color: var(--site-color-heading);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
  }
  .site-shell .home-trending-tag-icon {
    display: grid;
    box-sizing: border-box;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    place-items: center;
    outline: none;
    border: 1px solid color-mix(in srgb, var(--tag-accent) 30%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--tag-accent) 5%, transparent);
    color: var(--tag-accent);
    font-size: 15px;
    font-weight: 550;
    transition:
      transform 300ms cubic-bezier(0.4, 0, 0.21, 1.8),
      background-color 200ms ease,
      border-color 200ms ease;
  }
  .site-shell .home-trending-tag-icon > span {
    display: grid;
    width: 16px;
    height: 16px;
    place-items: center;
    line-height: 1;
  }
  .site-shell .home-trending-tags nav a:hover .home-trending-tag-icon {
    background: color-mix(in srgb, var(--tag-accent) 11%, transparent);
    border-color: transparent;
    transform: scale(1.05);
  }
  .site-shell .home-trending-tag-name {
    min-width: 0;
    overflow: hidden;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: transform 250ms ease;
  }
  .site-shell .home-trending-tags nav a:hover .home-trending-tag-name {
    transform: translateX(2px);
  }
  .site-shell .home-trending-tag-count {
    color: var(--site-color-muted);
    font-size: 12px;
    font-weight: 400;
  }
  @media (max-width: 600px) {
    .site-shell .home-trending-tags {
      margin-top: 40px;
      padding: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .site-shell .home-trending-tags-heading,
    .site-shell .home-trending-tags-heading > span:last-child,
    .site-shell .home-trending-tag-icon,
    .site-shell .home-trending-tag-name {
      transition: none;
      transform: none;
    }
  }
}
</style>

<style>
/* Keep the custom tag-chip border above unlayered UnoCSS resets. */
.site-shell .home-trending-tags .home-trending-tag-icon {
  border: 1px solid color-mix(in srgb, var(--tag-accent) 30%, transparent);
  transition:
    transform 300ms cubic-bezier(.4, 0, .21, 1.8),
    background-color 200ms ease,
    border-color 200ms ease;
}
.site-shell .home-trending-tags nav a:hover .home-trending-tag-icon {
  background: color-mix(in srgb, var(--tag-accent) 11%, transparent);
  border-color: transparent;
  transform: scale(1.05);
}
</style>
