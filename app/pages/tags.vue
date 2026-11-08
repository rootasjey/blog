<template>
  <Transition name="page" appear>
    <div>
      <TagsDirectory
        v-if="!tagsPending && !tagsError"
        :tags="directoryTags"
        :is-admin="isAdmin"
        @create="openNewTag"
        @edit="openEditTag"
        @delete="onDeleteFromDirectory"
      />
      <section v-else class="site-page site-tags-state">
        <div>
          <h1>{{ $t('pages.tags.heading') }}</h1>
          <p>{{ $t('pages.tags.description') }}</p>
          <p v-if="tagsPending" class="site-tags-state-loading">{{ $t('pages.tags.loading') }}</p>
          <EmptyState v-else :title="$t('pages.tags.unavailable')" :description="$t('pages.tags.unavailableDesc')" />
        </div>
      </section>

      <div v-if="!isAdmin && !tagsPending && !tagsError" class="site-public-archive-footer site-public-tags-footer">
        <NewsletterSubscription />
        <HomeRecommendations />
      </div>

  <NDialog v-model:open="tagDialogOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ editingTag ? $t('pages.tags.editTag') : $t('pages.tags.createTag') }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <div class="space-y-3">
          <NInput v-model="tagName" :placeholder="$t('pages.tags.tagNamePlaceholder')" input="outline" class="site-tag-dialog-field" autofocus />
          <NInput v-model="tagDescription" :placeholder="$t('pages.tags.descriptionPlaceholder')" input="outline" class="site-tag-dialog-field" />
          <NInput v-model="tagCategory" :placeholder="$t('pages.tags.categoryPlaceholder')" input="outline" class="site-tag-dialog-field" />
          <div class="pt-1">
            <p class="mb-2 text-sm font-medium">{{ $t('pages.tags.iconLabel') }}</p>
            <TagIconPicker
              v-model="tagIcon"
              :tag-name="tagName"
              :label="$t('pages.tags.iconLabel')"
              :letter-label="$t('pages.tags.keepInitial')"
            />
          </div>
        </div>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="tagDialogOpen = false">{{ $t('common.cancel') }}</NButton>
        <NButton btn="solid-black" size="sm" @click="saveTag" :loading="saving" class="px-6">{{ $t('common.save') }}</NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>

  <NDialog v-model:open="confirmDialogOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ $t('pages.tags.deleteTagTitle') }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('pages.tags.deleteTagConfirm', { name: tagPendingDelete?.name }) }}</p>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="confirmDialogOpen = false">{{ $t('common.cancel') }}</NButton>
        <NButton btn="solid-red" size="sm" @click="confirmDelete" :loading="deleting" class="px-5 py-0 min-h-0">{{ $t('common.delete') }}</NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { ApiTag } from '~~/shared/types/tags'
import type { TagIconName } from '~~/shared/constants/tag-icons'
import type { Post as ApiPost } from '~~/shared/types/post'
import { EXCLUDED_TAGS } from '~/utils/tagConstants'

const { enhancePost } = usePost()
const config = useRuntimeConfig()

// Tags (use useFetch for SSR-safe hydration)
const { data: tagsData, pending: tagsPending, error: tagsError } = await useFetch<ApiTag[]>('/api/tags')
const tags = ref<ApiTag[]>(tagsData.value ?? [])
// keep tags ref in sync with fetched data (works on both server and client)
watch(tagsData, (v) => { tags.value = v ?? [] })
const { $t, $getLocale } = useI18n()
useSeoMeta({
  title: () => `${$t('pages.tags.heading')} - ${$t('seo.siteName')}`,
  description: () => $t('pages.tags.description'),
  ogTitle: () => $t('pages.tags.heading'),
  ogDescription: () => $t('pages.tags.description'),
  ogImage: `${config.public.siteUrl}/og/home/default.png`,
  ogUrl: () => `${config.public.siteUrl}/tags`,
  twitterCard: 'summary_large_image',
  twitterImage: `${config.public.siteUrl}/og/home/default.png`,
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/tags` }],
})

// Posts
const { data: postsData } = await useFetch<ApiPost[]>('/api/posts')
const posts = computed(() => (postsData.value ?? []).map(p => enhancePost(p)))
const publicTags = computed(() => {
  const hiddenNames = new Set([...EXCLUDED_TAGS, 'project', 'hero'])
  const locale = $getLocale()
  const counts = new Map<string, number>()

  for (const post of posts.value) {
    if (post.language !== locale) continue
    for (const tag of post.tags ?? []) {
      const key = tag.name.toLocaleLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return tags.value
    .map(tag => ({ ...tag, count: counts.get(tag.name.trim().toLocaleLowerCase()) ?? 0 }))
    .filter(tag => tag.count > 0 && !hiddenNames.has(tag.name.trim().toLocaleLowerCase()))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map(tag => ({ ...tag, count: counts.get(tag.name.trim().toLocaleLowerCase()) ?? 0 }))
})

// Admin session + UI
const { user, loggedIn } = useUserSession()
const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')
// Tag CRUD UI state
const tagDialogOpen = ref(false)
const editingTag = ref<ApiTag | null>(null)
const tagName = ref('')
const tagCategory = ref('')
const tagDescription = ref('')
const tagIcon = ref<TagIconName | null>(null)
const saving = ref(false)

const confirmDialogOpen = ref(false)
const tagPendingDelete = ref<ApiTag | null>(null)
const deleting = ref(false)

const tagCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  posts.value.forEach(p => {
    p.tags?.forEach(t => {
      counts[t.name] = (counts[t.name] || 0) + 1
    })
  })
  return counts
})

const directoryTags = computed(() => isAdmin.value ? tags.value.map(tag => ({ ...tag, count: tagCounts.value[tag.name] ?? 0 })) : publicTags.value)

function openNewTag() {
  editingTag.value = null
  tagName.value = ''
  tagCategory.value = ''
  tagDescription.value = ''
  tagIcon.value = null
  tagDialogOpen.value = true
}

function openEditTag(tag: ApiTag) {
  editingTag.value = tag
  tagName.value = tag.name
  tagCategory.value = tag.category || ''
  tagDescription.value = tag.description || ''
  tagIcon.value = (tag.icon as TagIconName | null) || null
  tagDialogOpen.value = true
}

function onDeleteFromDirectory(tag: ApiTag) {
  tagPendingDelete.value = tag
  confirmDialogOpen.value = true
}

async function saveTag() {
  if (!tagName.value?.trim()) {
    alert($t('pages.profile.nameRequired'))
    return
  }
  saving.value = true
  try {
    if (editingTag.value) {
      const updated = await $fetch<ApiTag>(`/api/tags/${editingTag.value.id}`, { method: 'PUT' as any, body: { name: tagName.value.trim(), category: tagCategory.value.trim() || 'general', description: tagDescription.value.trim(), icon: tagIcon.value } })
      tags.value = tags.value.map(t => t.id === updated.id ? updated : t)
    } else {
      const created = await $fetch<ApiTag>('/api/tags', { method: 'POST' as any, body: { name: tagName.value.trim(), category: tagCategory.value.trim() || 'general', description: tagDescription.value.trim(), icon: tagIcon.value } })
      tags.value = [...tags.value, created].sort((a, b) => a.name.localeCompare(b.name))
    }
    tagDialogOpen.value = false
  } catch (e: any) {
    alert(e?.message || 'Failed to save tag')
  } finally {
    saving.value = false
  }
}

// Keyboard shortcut: Cmd/Ctrl + Enter to confirm tag dialog
function handleTagDialogKey(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (!(e.metaKey || e.ctrlKey)) return
  if (!tagDialogOpen.value) return
  e.preventDefault()
  if (!saving.value) saveTag()
}

watch(tagDialogOpen, (open) => {
  if (open) window.addEventListener('keydown', handleTagDialogKey)
  else window.removeEventListener('keydown', handleTagDialogKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleTagDialogKey)
})

async function confirmDelete() {
  if (!tagPendingDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/tags/${tagPendingDelete.value.id}`, { method: 'DELETE' as any })
    tags.value = tags.value.filter(t => t.id !== tagPendingDelete.value?.id)
    tagPendingDelete.value = null
    confirmDialogOpen.value = false
  } catch (e) {
    console.error('Failed to delete tag', e)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-enter-active {
  transition: opacity 280ms cubic-bezier(.2, 0, .2, 1), transform 280ms cubic-bezier(.2, 0, .2, 1);
}

.page-enter-to {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-from,
  .page-enter-to,
  .page-enter-active {
    transition: none;
    transform: none;
  }
}
</style>

<style>
@layer components {
  .site-tag-dialog-field:focus-visible {
    border-width: 2px !important;
    border-color: var(--site-color-focus-ring) !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .site-shell .site-public-tags-footer .home-newsletter { margin-top: 120px; }
  .site-shell .site-tags-state { padding: 64px 0; }
  .site-shell .site-tags-state > div { width: min(700px, calc(100% - 32px)); margin-inline: auto; }
  .site-shell .site-tags-state h1 {
    margin: 0 0 12px;
    color: var(--site-color-heading);
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -.03em;
  }
  .site-shell .site-tags-state > div > p:not(.site-tags-state-loading) { margin: 0 0 24px; color: var(--site-color-muted); }
  .site-shell .site-tags-state-loading { color: var(--site-color-muted); }
}
</style>
