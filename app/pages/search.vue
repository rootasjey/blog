<template>
  <main class="site-page site-search">
    <div class="site-search-content">
      <header class="site-search-heading">
        <h1>{{ $t('pages.search.title') }}</h1>
      </header>

      <div class="site-search-field-wrap">
        <label class="sr-only" for="search-page-input">{{ $t('pages.search.title') }}</label>
        <input
          id="search-page-input"
          v-model="query"
          class="site-search-field"
          type="search"
          :placeholder="$t('pages.search.placeholder')"
          autocomplete="off"
          autofocus
        >
        <span class="i-ph-magnifying-glass" aria-hidden="true" />
      </div>

      <div v-if="recentSearches.length || suggestedTags.length" class="site-search-shortcuts">
        <section v-if="recentSearches.length" class="site-search-shortcut-group" :aria-label="$t('pages.search.recent')">
          <h2>{{ $t('pages.search.recent') }}</h2>
          <div class="site-search-chip-list">
            <button
              v-for="item in recentSearches"
              :key="item"
              type="button"
              class="site-search-chip"
              @click="query = item"
            >
              {{ item }}
            </button>
          </div>
        </section>

        <section class="site-search-shortcut-group" :aria-label="$t('pages.search.suggestedTags')">
          <h2>{{ $t('pages.search.suggestedTags') }}</h2>
          <div class="site-search-chip-list">
            <button
              v-for="tag in suggestedTags"
              :key="tag.id"
              type="button"
              class="site-search-chip"
              :disabled="tagsPending"
              @click="query = tag.name"
            >
              #{{ tag.name }}
            </button>
            <span v-if="!suggestedTags.length && tagsPending" class="site-search-muted">{{ $t('common.loading') }}</span>
            <span v-else-if="!suggestedTags.length" class="site-search-muted">{{ $t('common.noTagsYet') }}</span>
          </div>
        </section>
      </div>

      <SearchRecentPosts
        v-if="isMobile && !query.trim() && (recentPending || recentError || enhancedRecentPosts.length)"
        :posts="enhancedRecentPosts"
        :pending="recentPending"
        :has-error="Boolean(recentError)"
        :locale="locale"
      />

      <section class="site-search-results" :aria-label="$t('pages.search.title')" aria-live="polite" :aria-busy="pending">
        <div v-if="pending && showSkeleton" class="site-search-loading" aria-hidden="true">
          <div v-for="i in 5" :key="i" />
        </div>

        <p v-else-if="!results.length && query.trim()" class="site-search-empty">
          {{ $t('pages.search.noResultsYet') }}
        </p>
        <p v-else-if="!results.length" class="site-search-empty">
          {{ $t('pages.search.helperText') }}
        </p>

        <ul v-else class="site-search-result-list">
          <li v-for="item in results" :key="`${item.type}-${item.id}`">
            <NuxtLink :to="resultPath(item)" class="site-search-result">
              <span class="site-search-result-copy">
                <span class="site-search-result-meta">
                  <span>{{ resultTypeLabel(item.type) }}</span>
                  <span v-if="item.type === 'post' && item.readingTime" aria-hidden="true">·</span>
                  <span v-if="item.type === 'post' && item.readingTime">{{ item.readingTime }}</span>
                </span>
                <span class="site-search-result-title">{{ item.name }}</span>
                <span v-if="item.type === 'post' && item.description" class="site-search-result-description">{{ item.description }}</span>
                <span v-else-if="item.type === 'author' && item.biography" class="site-search-result-description">{{ item.biography }}</span>
                <span v-else-if="item.type === 'tag'" class="site-search-result-description">{{ $t('pages.search.tag') }}</span>
              </span>
              <span class="site-search-result-icon" aria-hidden="true">
                <span v-if="item.type === 'post'" class="i-ph-newspaper" />
                <span v-else-if="item.type === 'author'" class="i-ph-user" />
                <span v-else class="i-ph-tag" />
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDebounceFn, useStorage } from '@vueuse/core'
import type { Post } from '~~/shared/types/post'

type SearchResultType = 'post' | 'author' | 'tag'
interface SearchResult {
  id: string | number
  type: SearchResultType
  name: string
  slug?: string
  description?: string
  biography?: string
  readingTime?: string
}

interface TagSuggestion {
  id: string | number
  name: string
}

const router = useRouter()
const route = useRoute()
const { $t, $getLocale } = useI18n()
const locale = computed(() => $getLocale())
const resultTypeLabels = computed<Record<SearchResultType, string>>(() => locale.value === 'fr'
  ? { post: 'Article', author: 'Auteur', tag: $t('pages.search.tag') }
  : { post: 'Post', author: 'Author', tag: $t('pages.search.tag') })
const initialQuery = typeof route.query.q === 'string' ? route.query.q : ''
const query = ref(initialQuery)
const results = ref<SearchResult[]>([])
const pending = ref(false)
const showSkeleton = ref(false)
let skeletonTimer: ReturnType<typeof setTimeout> | null = null
let requestVersion = 0
const recentSearches = useStorage<string[]>('corpinot-search-recent', [])

const { data: tagsData, pending: tagsPending } = await useFetch<TagSuggestion[]>('/api/tags')
const suggestedTags = computed(() => (tagsData.value ?? []).slice(0, 10))
const isMobile = useIsMobile()
const { data: recentPostsData, pending: recentPending, error: recentError } = await useFetch<Post[]>('/api/posts', { params: { page: 1, limit: 6 } })
const { enhancePost } = usePost()
const enhancedRecentPosts = computed(() => (recentPostsData.value ?? []).map(post => enhancePost(post)))

function clearSkeletonTimer() {
  if (skeletonTimer) clearTimeout(skeletonTimer)
  skeletonTimer = null
  showSkeleton.value = false
}

function resultPath(item: SearchResult) {
  if (item.type === 'post' && item.slug) return localizedPath(`/posts/${item.slug}`, locale.value)
  if (item.type === 'author') return localizedPath(`/authors/${item.slug || item.id}`, locale.value)
  if (item.type === 'tag') return `${localizedPath('/posts', locale.value)}?tag=${encodeURIComponent(item.name)}`
  return localizedPath('/posts', locale.value)
}

function resultTypeLabel(type: SearchResultType) {
  return resultTypeLabels.value[type]
}

function addRecent(term: string) {
  const value = term.trim()
  if (!value) return
  const filtered = recentSearches.value.filter(item => item.toLowerCase() !== value.toLowerCase())
  recentSearches.value = [value, ...filtered].slice(0, 10)
}

const fetchResults = useDebounceFn(async () => {
  const q = query.value.trim()
  const version = ++requestVersion
  if (!q) {
    results.value = []
    pending.value = false
    clearSkeletonTimer()
    const { q: _query, ...otherQuery } = route.query
    router.replace({ query: otherQuery })
    return
  }

  pending.value = true
  clearSkeletonTimer()
  skeletonTimer = setTimeout(() => {
    if (version === requestVersion) showSkeleton.value = true
  }, 180)
  router.replace({ query: { ...route.query, q } })

  try {
    const response = await $fetch<{ posts?: SearchResult[]; authors?: SearchResult[]; tags?: SearchResult[] }>('/api/search', { params: { q } })
    if (version !== requestVersion) return
    results.value = [...(response.posts ?? []), ...(response.authors ?? []), ...(response.tags ?? [])]
    addRecent(q)
  } catch {
    if (version === requestVersion) results.value = []
  } finally {
    if (version === requestVersion) {
      pending.value = false
      clearSkeletonTimer()
    }
  }
}, 300)

watch(query, () => {
  requestVersion += 1
  fetchResults()
})

onMounted(() => {
  document.getElementById('search-page-input')?.focus()
  if (query.value.trim()) fetchResults()
})
</script>

<style scoped>
.site-search {
  min-height: calc(100vh - var(--site-header-height, 72px));
  padding: clamp(48px, 8vh, 88px) 24px 112px;
  background: var(--site-color-background);
  color: var(--site-color-text);
}

.site-search-content {
  width: min(100%, 700px);
  margin-inline: auto;
}

.site-search-heading {
  margin-bottom: 32px;
}

.site-search-heading h1 {
  margin: 0;
  color: var(--site-color-heading);
  font-family: var(--site-font-heading);
  font-size: clamp(28px, 3vw, 36px);
  font-weight: 550;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.site-search-field-wrap {
  position: relative;
}

.site-search-field {
  box-sizing: border-box;
  width: 100%;
  min-height: 60px;
  padding: 15px 54px 15px 18px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  outline: none;
  background: var(--site-color-surface);
  color: var(--site-color-heading);
  font: inherit;
  font-size: 18px;
  transition: border-color var(--site-motion-standard) var(--site-ease-standard), background-color var(--site-motion-standard) var(--site-ease-standard);
}

.site-search-field::placeholder,
.site-search-muted {
  color: var(--site-color-muted);
}

.site-search-field:focus-visible {
  border-color: var(--site-color-focus-ring);
}

.site-search-field-wrap > span {
  position: absolute;
  top: 50%;
  right: 20px;
  color: var(--site-color-muted);
  font-size: 20px;
  transform: translateY(-50%);
  pointer-events: none;
}

.site-search-shortcuts {
  display: grid;
  gap: 22px;
  margin: 28px 0 40px;
}

.site-search-shortcut-group h2 {
  margin: 0 0 10px;
  color: var(--site-color-muted);
  font-size: 13px;
  font-weight: 550;
}

.site-search-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.site-search-chip {
  min-height: 34px;
  padding: 5px 10px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-tag);
  background: transparent;
  color: var(--site-color-text);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: color var(--site-motion-fast) ease, background-color var(--site-motion-fast) ease, border-color var(--site-motion-fast) ease;
}

.site-search-chip:hover:not(:disabled),
.site-search-chip:focus-visible {
  border-color: var(--site-color-focus-ring);
  background: var(--site-color-hover-background);
  color: var(--site-color-heading);
}

.site-search-chip:focus-visible,
.site-search-result:focus-visible,
.site-search-recent-list a:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 3px;
}

.site-search-chip:disabled {
  cursor: wait;
  opacity: 0.6;
}

.site-search-results {
  min-width: 0;
}

.site-search-result-list,
.site-search-recent-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-search-result-list li + li,
.site-search-recent-list li + li {
  border-top: 1px solid var(--site-color-border);
}

.site-search-result {
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 4px;
  color: inherit;
  text-decoration: none;
  transition: color var(--site-motion-fast) ease, padding var(--site-motion-fast) ease;
}

.site-search-result:hover {
  padding-inline: 10px;
  color: var(--site-color-heading);
}

.site-search-result-copy {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.site-search-result-meta {
  display: flex;
  gap: 7px;
  color: var(--site-color-muted);
  font-size: 13px;
  text-transform: capitalize;
}

.site-search-result-title {
  color: var(--site-color-heading);
  font-size: 19px;
  font-weight: 550;
  line-height: 1.3;
}

.site-search-result-description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--site-color-muted);
  font-size: 15px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.site-search-result-icon {
  flex: 0 0 auto;
  color: var(--site-color-muted);
  font-size: 20px;
}

.site-search-empty {
  margin: 0;
  padding: 24px 4px;
  color: var(--site-color-muted);
}

.site-search-loading {
  display: grid;
  gap: 0;
}

.site-search-loading > div {
  height: 72px;
  border-bottom: 1px solid var(--site-color-border);
  background: linear-gradient(90deg, transparent, var(--site-color-hover-background), transparent);
  background-size: 200% 100%;
  animation: site-search-shimmer 1.2s ease-in-out infinite;
}

@keyframes site-search-shimmer {
  to { background-position: -200% 0; }
}

@media (max-width: 640px) {
  .site-search {
    padding: 40px 20px 96px;
  }

  .site-search-shortcuts {
    margin: 24px 0 32px;
  }

  .site-search-result {
    min-height: 88px;
    gap: 12px;
  }

  .site-search-result-title {
    font-size: 17px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-search-field,
  .site-search-chip,
  .site-search-result {
    transition: none;
  }

  .site-search-loading > div {
    animation: none;
  }
}
</style>
