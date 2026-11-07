<template>
  <article
    class="site-project-admin-card group"
    :class="{ 'is-entered': entered, 'is-duplicating': duplicatingPosts.has(post.slug) }"
    :style="{ transitionDelay: `${idx * 35}ms` }"
    @pointerdown="$emit('long-press-start', post.slug)"
    @pointerup="$emit('long-press-cancel')"
    @pointercancel="$emit('long-press-cancel')"
    @mouseleave="$emit('long-press-cancel')"
  >
    <ClientOnly>
      <div v-if="isAdmin && selectionMode" class="site-project-admin-selection">
        <NCheckbox :model-value="selectedSlugs.has(post.slug)" @update:model-value="$emit('toggle-selected', post.slug)" />
      </div>
    </ClientOnly>

    <NLink
      :to="link"
      class="site-project-admin-card-link"
      :aria-busy="duplicatingPosts.has(post.slug)"
      @click="(event: MouseEvent) => $emit('post-click', event, post)"
    >
      <div class="site-project-admin-image">
        <PostImage v-if="post.image?.src" :src="post.image.src" :alt="post.image.alt || post.name" />
        <span v-else class="site-project-admin-image-empty" aria-hidden="true" />
      </div>

      <div class="site-project-admin-copy">
        <span v-if="post.status !== 'published'" class="site-project-admin-status">
          {{ post.status === 'draft' ? $t('components.postMeta.draft') : $t('components.postMeta.archived') }}
        </span>
        <h2>{{ post.name }}</h2>
        <p class="site-project-admin-meta">
          <span v-if="category">{{ category }}</span>
          <time v-if="projectDate" :datetime="projectDate">{{ projectYear }}</time>
        </p>
      </div>
    </NLink>

    <ClientOnly>
      <div v-if="isAdmin" class="site-project-admin-menu">
        <PostMenu :items="menuItemsForPost(post)" :disabled="duplicatingPosts.has(post.slug)" />
      </div>
    </ClientOnly>
  </article>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import PostMenu from '~/components/PostMenu.vue'

const props = defineProps<{
  post: Post
  idx: number
  link: string
  isAdmin: boolean
  selectionMode: boolean
  selectedSlugs: Set<string>
  duplicatingPosts: Set<string | number>
  menuItemsForPost: (post: Post) => any
  entered: boolean
}>()

defineEmits<{
  (event: 'toggle-selected', slug: string): void
  (event: 'long-press-start', slug: string): void
  (event: 'long-press-cancel'): void
  (event: 'post-click', eventObject: MouseEvent, post: Post): void
}>()

const category = computed(() => props.post.tags?.find(tag => !['project', 'featured project'].includes(tag.name.toLowerCase()))?.name)
const projectDate = computed(() => props.post.publishedAt || props.post.createdAt || '')
const projectYear = computed(() => projectDate.value ? new Date(projectDate.value).getFullYear() : '')
const { $t } = useI18n()
</script>
