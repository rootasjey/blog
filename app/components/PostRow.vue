<template>
  <div
    :class="[
      'group relative w-full transition-all duration-500 ease-out will-change-transform',
      { 'opacity-0 translate-y-3': !entered, 'opacity-100 translate-y-0': entered, 'site-post-row--compact': compact }
    ]"
    :data-public-page-edit-target="`post:${post.slug}`"
    :style="{ transitionDelay: `${idx * 35}ms` }"
    @pointerdown="() => $emit('long-press-start', post.slug)"
    @pointerup="$emit('long-press-cancel')"
    @pointercancel="$emit('long-press-cancel')"
    @mouseleave="$emit('long-press-cancel')"
  >
    <ClientOnly>
      <div v-if="isAdmin && selectionMode" class="site-post-row-selection absolute right-12 top-5 z-2">
        <NCheckbox :model-value="selectedSlugs.has(post.slug)" @update:model-value="$emit('toggle-selected', post.slug)" />
      </div>
    </ClientOnly>

    <NLink :to="link" @click="(e: MouseEvent) => $emit('post-click', e, post)" :class="['site-post-row-link group block bg-background border border-border rounded-lg overflow-hidden hover:shadow transition-all duration-200 transform active:scale-99 flex items-start gap-4 p-4', { 'site-post-row-link--compact': compact }]" :aria-busy="duplicatingPosts.has(post.slug)">
      <div v-if="post.image?.src" class="site-post-row-thumb w-36 h-24 overflow-hidden flex-shrink-0 rounded">
        <PostImage :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover" />
      </div>
      <span v-else-if="compact" class="site-post-row-thumb site-post-row-thumb--empty" aria-hidden="true" />

      <div v-if="compact" class="site-post-row-caption">
        <h2 class="site-post-row-title">{{ post.name }}</h2>
        <div class="site-post-row-meta">
          <span v-if="post.tags?.[0]?.name" class="site-post-row-tag">{{ post.tags[0].name }}</span>
          <time>{{ post.formattedDate }}</time>
        </div>
      </div>
      <div v-else class="flex-1">
        <PostMeta layout="row" :post="post" :duplicating="duplicatingPosts.has(post.slug)" />
      </div>
    </NLink>

    <ClientOnly>
      <div v-if="isAdmin" class="site-post-row-menu absolute right-3 top-3 z-10">
        <PostMenu :items="menuItemsForPost(post)" :disabled="duplicatingPosts.has(post.slug)" />
      </div>
    </ClientOnly>

    <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const props = defineProps<{
  post: Post
  idx: number
  link: string
  isAdmin: boolean
  selectionMode: boolean
  selectedSlugs: Set<string>
  duplicatingPosts: Set<string | number>
  menuItemsForPost: (p: Post) => any
  entered?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-selected', slug: string): void
  (e: 'long-press-start', slug: string): void
  (e: 'long-press-cancel'): void
  (e: 'post-click', eev: MouseEvent, post: Post): void
}>()
</script>
