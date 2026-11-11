<template>
  <div class="post-author-avatar-stack" :aria-label="authorsLabel">
    <NuxtLink
      v-for="(author, index) in authors"
      :key="author.id"
      class="post-author-avatar-stack__item"
      :to="authorPath(author)"
      :aria-label="author.name || 'Author'"
      :data-cursor-tooltip="author.name || 'Author'"
      :style="{ '--stack-index': index }"
    >
      <PostImage
        v-if="author.avatar"
        provider="hubblob"
        :src="author.avatar"
        :alt="author.name"
        width="40"
        height="40"
        loading="lazy"
      />
      <span v-else class="post-author-avatar-stack__initial" aria-hidden="true">
        {{ author.name?.trim().slice(0, 1).toUpperCase() || '?' }}
      </span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { PostAuthor } from '~~/shared/types/post'

const props = defineProps<{
  authors: PostAuthor[]
  authorPath: (author: PostAuthor) => string
}>()

const authorsLabel = computed(() => props.authors.map(author => author.name).join(', '))
</script>

<style scoped>
@layer components {
.post-author-avatar-stack {
  display: inline-flex;
  align-items: center;
  padding-inline-start: 8px;
}

.post-author-avatar-stack__item {
  position: relative;
  z-index: 1;
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  place-items: center;
  overflow: visible;
  margin-inline-start: -8px;
  border: 2px solid var(--site-color-background);
  border-radius: 50%;
  background: var(--site-color-hover-background);
  color: var(--site-color-heading);
  text-decoration: none;
  transition: transform 180ms var(--site-ease-standard), box-shadow 180ms ease;
}

.post-author-avatar-stack__item:first-child {
  margin-inline-start: 0;
}

.post-author-avatar-stack__item:hover,
.post-author-avatar-stack__item:focus-visible {
  z-index: 2;
  transform: translateY(-2px) scale(1.08);
  box-shadow: 0 0 0 1px var(--site-color-border);
}

.post-author-avatar-stack__initial,
:deep(img) {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

:deep(img) {
  object-fit: cover;
}

.post-author-avatar-stack__initial {
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .post-author-avatar-stack__item {
    transition: none;
  }
}
}
</style>
