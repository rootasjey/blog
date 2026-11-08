<template>
  <section class="site-public-post-archive" :aria-label="$t('pages.posts.publishedHeading')">
    <div class="site-public-post-grid">
      <article
        v-for="post in visiblePosts"
        :key="post.slug"
        class="site-public-post"
      >
        <NuxtLink
          :to="localizedPath(`/posts/${post.slug}`, locale)"
          :aria-label="post.name"
          class="site-public-post-image-link"
        >
          <PostImage
            v-if="post.image?.src"
            :src="post.image.src"
            :alt="post.image.alt || post.name"
            class="site-public-post-image"
            loading="lazy"
          />
          <span v-else class="site-public-post-image site-public-post-image--empty" aria-hidden="true" />
        </NuxtLink>
        <div class="site-public-post-caption">
          <NuxtLink
            :to="localizedPath(`/posts/${post.slug}`, locale)"
            class="site-public-post-title"
          >
            {{ post.name }}
          </NuxtLink>
          <span class="site-public-post-meta">
            <NuxtLink
              v-if="post.tags?.[0]?.name"
              :to="`${localizedPath('/posts', locale)}?tag=${encodeURIComponent(post.tags[0].name)}`"
              :style="{ '--tag-accent': postTagColor(post.tags[0].name) }"
              class="site-public-post-tag"
            >
              {{ post.tags[0].name }}
            </NuxtLink>
            <time :datetime="post.publishedAt || post.createdAt">{{ formatDate(post.publishedAt || post.createdAt) }}</time>
          </span>
        </div>
      </article>
    </div>

    <LoadMoreButton
      v-if="visibleCount < posts.length"
      @click="visibleCount += pageSize"
    >
      {{ locale === 'fr' ? 'Charger plus' : 'Load More' }}
    </LoadMoreButton>
  </section>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import { localizedPath } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

const props = defineProps<{ posts: Post[] }>()
const { $getLocale, $t } = useI18n()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const pageSize = 4
const visibleCount = ref(pageSize)
const visiblePosts = computed(() => props.posts.slice(0, visibleCount.value))

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale.value, { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
@layer components {

.site-public-post-archive {
  width: 100%;
  margin-bottom: 64px;
}

.site-public-post-grid {
  display: grid;
  width: 720px;
  max-width: calc(100vw - 32px);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin: 0 0 64px -10px;
}

.site-public-post {
  display: grid;
  min-width: 0;
  height: 100px;
  grid-template-columns: 100px minmax(0, 1fr);
  grid-template-rows: minmax(24px, 48px) 20px;
  align-content: center;
  column-gap: 16px;
  row-gap: 6px;
  color: var(--site-color-text);
}

.site-public-post-image-link {
  display: block;
  min-width: 0;
  grid-column: 1;
  grid-row: 1 / span 2;
  align-self: center;
  color: inherit;
  text-decoration: none;
}

.site-public-post-image {
  display: block;
  width: 100px;
  height: 100px;
  border-radius: 16px;
  object-fit: cover;
  transition: transform 220ms var(--site-ease-standard);
}

.site-public-post-image--empty {
  background: linear-gradient(135deg, #171b27, #5752f2 52%, #12b8d1);
}

.site-public-post-image-link:hover .site-public-post-image {
  transform: scale(1.03);
}

.site-public-post-caption {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  gap: 6px;
  height: 100%;
}

.site-public-post-title {
  overflow: hidden;
  color: var(--site-color-heading);
  font-family: var(--site-font-body);
  font-size: 18px;
  font-weight: 600;
  line-height: 18px;
  text-decoration: none;
  text-overflow: ellipsis;
}

.site-public-post-meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  color: var(--site-color-muted);
  font-family: var(--site-font-body);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}

.site-public-post-tag {
  position: relative;
  z-index: 0;
  display: inline-block;
  color: var(--tag-accent);
  font-weight: 600;
  text-decoration: none;
  transform: scale(1);
  transition: transform 220ms var(--site-ease-standard);
}

.site-public-post-tag::before {
  position: absolute;
  z-index: -1;
  inset: -2px -6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background-color: transparent;
  content: '';
  transition: background-color 150ms ease-in-out, border-color 150ms ease-in-out;
}

.site-public-post-tag:hover,
.site-public-post-tag:focus-visible {
  color: var(--tag-accent);
  transform: scale(1.04);
}

.site-public-post-tag:hover::before,
.site-public-post-tag:focus-visible::before {
  border-color: color-mix(in srgb, var(--tag-accent) 6%, var(--site-color-background) 94%);
  background-color: color-mix(in srgb, var(--tag-accent) 6%, var(--site-color-background) 94%);
}

.site-public-post-tag:focus-visible {
  outline: 2px solid var(--tag-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

.site-public-post-image-link:focus-visible .site-public-post-image {
  outline: 2px solid var(--site-color-accent);
  outline-offset: 4px;
}

.site-public-post-title:focus-visible {
  outline: 2px solid var(--site-color-accent);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (max-width: 1023px) {
  .site-public-post-grid {
    width: 100%;
    max-width: 100%;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin-left: 0;
  }

  .site-public-post {
    height: 96px;
    grid-template-columns: 96px minmax(0, 1fr);
    column-gap: 14px;
  }

  .site-public-post-image {
    width: 96px;
    height: 96px;
    border-radius: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-public-post-image,
  .site-public-post-tag {
    transition: none;
  }
}
}
</style>
