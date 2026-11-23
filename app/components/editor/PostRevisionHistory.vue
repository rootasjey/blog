<template>
  <div class="post-revision-history">
    <NButton
      v-if="!historyOpen"
      class="post-revision-history-trigger"
      btn="solid-gray"
      size="xs"
      leading="i-lucide-history"
      @click="openHistory"
    >
      {{ $ts('pages.postEditor.showHistory') }}
    </NButton>

    <section
      v-else
      class="post-revision-history-panel"
      :class="{ 'is-expanded': isExpanded }"
      role="dialog"
      :aria-label="$ts('pages.postEditor.history')"
    >
      <header class="post-revision-history-header">
        <div>
          <h2>{{ $ts('pages.postEditor.history') }}</h2>
          <p>{{ $ts('pages.postEditor.historyDescription') }}</p>
        </div>
        <div class="post-revision-history-actions">
          <NButton
            btn="ghost-gray"
            size="xs"
            :aria-label="$ts(isExpanded ? 'pages.postEditor.restorePanel' : 'pages.postEditor.expandPanel')"
            :title="$ts(isExpanded ? 'pages.postEditor.restorePanel' : 'pages.postEditor.expandPanel')"
            :leading="isExpanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
            @click="isExpanded = !isExpanded"
          />
          <NButton
            btn="ghost-gray"
            size="xs"
            :aria-label="$ts('pages.postEditor.closeHistory')"
            :title="$ts('pages.postEditor.closeHistory')"
            leading="i-lucide-x"
            @click="closeHistory"
          />
        </div>
      </header>

      <div class="post-revision-history-content">
        <p v-if="historyLoading" role="status" class="text-sm opacity-70">{{ $ts('pages.postEditor.loadingHistory') }}</p>
        <p v-else-if="historyError" role="alert" class="text-sm text-red-600 dark:text-red-400">{{ historyError }}</p>
        <p v-else-if="!revisions.length" class="text-sm opacity-70">{{ $ts('pages.postEditor.noHistory') }}</p>
        <template v-else>
          <ul class="post-revision-history-list">
            <li v-for="revision in visibleRevisions" :key="revision.revision" class="post-revision-history-item">
              <div class="post-revision-history-meta">
                <strong>v{{ revision.revision }}</strong>
                <time :datetime="revision.created_at">{{ formatPostDate(revision.created_at) }}</time>
                <span>{{ revision.source }}</span>
                <code v-if="isExpanded">{{ revision.content_hash.slice(0, 8) }}</code>
              </div>
              <NButton btn="ghost-gray" size="xs" @click="previewRevision(revision.revision)">
                {{ $ts('pages.postEditor.previewRevision') }}
              </NButton>
            </li>
          </ul>

          <nav v-if="pageCount > 1" class="post-revision-history-pagination" :aria-label="$ts('pages.postEditor.historyPagination')">
            <NButton btn="ghost-gray" size="xs" :disabled="currentPage === 1" @click="currentPage--">
              {{ $ts('pages.postEditor.previousPage') }}
            </NButton>
            <span>{{ $ts('pages.postEditor.historyPage', { page: currentPage, pages: pageCount }) }}</span>
            <NButton btn="ghost-gray" size="xs" :disabled="currentPage === pageCount" @click="currentPage++">
              {{ $ts('pages.postEditor.nextPage') }}
            </NButton>
          </nav>
        </template>

        <div v-if="previewedRevision !== null" class="post-revision-history-preview">
          <div class="post-revision-history-preview-header">
            <h3>{{ $ts('pages.postEditor.revisionPreview', { revision: previewedRevision }) }}</h3>
            <NButton btn="solid-black" size="xs" :disabled="restoringRevision" @click="restoreRevision">
              {{ restoringRevision ? $ts('pages.postEditor.restoringRevision') : $ts('pages.postEditor.restoreRevision') }}
            </NButton>
          </div>
          <pre>{{ revisionPreview }}</pre>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type RevisionSummary = { revision: number; source: string; created_at: string; content_hash: string }

const props = defineProps<{
  identifier: string
  contentRevision: number
  beforeRestore: () => Promise<number | null>
}>()
const emit = defineEmits<{
  restored: []
  'restore-state': [isRestoring: boolean]
}>()

const { $ts } = useI18n()
const { formatPostDate } = usePost()
const historyOpen = ref(false)
const historyLoading = ref(false)
const restoringRevision = ref(false)
const historyError = ref('')
const revisions = ref<RevisionSummary[]>([])
const previewedRevision = ref<number | null>(null)
const revisionPreview = ref('')
const isExpanded = ref(false)
const currentPage = ref(1)
const pageSize = 8
const pageCount = computed(() => Math.max(1, Math.ceil(revisions.value.length / pageSize)))
const visibleRevisions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return revisions.value.slice(start, start + pageSize)
})

async function openHistory() {
  historyOpen.value = true
  if (!revisions.value.length && !historyLoading.value) await loadHistory()
}

function closeHistory() {
  historyOpen.value = false
  isExpanded.value = false
}

async function loadHistory() {
  historyError.value = ''
  historyLoading.value = true
  try {
    const endpoint: string = `/api/posts/${encodeURIComponent(props.identifier)}/revisions`
    revisions.value = await $fetch<RevisionSummary[]>(endpoint)
    currentPage.value = 1
  } catch (error: any) {
    historyError.value = error?.data?.message || $ts('pages.postEditor.historyLoadFailed')
  } finally {
    historyLoading.value = false
  }
}

function extractRevisionText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  if (Array.isArray(value)) return value.map(extractRevisionText).filter(Boolean).join('\n')
  const node = value as Record<string, unknown>
  const ownText = typeof node.text === 'string' ? node.text : ''
  const children = Array.isArray(node.content) ? extractRevisionText(node.content) : ''
  return ownText || children
}

async function previewRevision(revision: number) {
  historyError.value = ''
  try {
    const endpoint: string = `/api/posts/${encodeURIComponent(props.identifier)}/revisions/${revision}`
    const result = await $fetch<{ revision: number; article: object }>(endpoint)
    previewedRevision.value = result.revision
    const text = extractRevisionText(result.article) || JSON.stringify(result.article, null, 2)
    revisionPreview.value = text.length > 4000 ? `${text.slice(0, 4000)}\n…` : text
  } catch (error: any) {
    historyError.value = error?.data?.message || $ts('pages.postEditor.historyLoadFailed')
  }
}

async function restoreRevision() {
  if (previewedRevision.value === null) return
  historyError.value = ''
  restoringRevision.value = true
  emit('restore-state', true)
  try {
    const expectedRevision = await props.beforeRestore()
    if (expectedRevision === null) return

    const endpoint: string = `/api/posts/${encodeURIComponent(props.identifier)}/revisions/restore`
    await $fetch(endpoint, {
      method: 'POST',
      body: { revision: previewedRevision.value, expectedRevision },
    })
    previewedRevision.value = null
    revisionPreview.value = ''
    revisions.value = []
    emit('restored')
    await loadHistory()
  } catch (error: any) {
    historyError.value = error?.data?.message || $ts('pages.postEditor.restoreFailed')
  } finally {
    restoringRevision.value = false
    emit('restore-state', false)
  }
}
</script>

<style scoped>
@layer components {
.post-revision-history { position: fixed; z-index: 45; inset-inline-end: 20px; inset-block-end: calc(84px + env(safe-area-inset-bottom)); }
.post-revision-history-trigger { box-shadow: 0 8px 24px rgb(0 0 0 / 24%); }
.post-revision-history-panel {
  display: flex;
  width: min(420px, calc(100vw - 32px));
  max-height: min(560px, calc(100dvh - 120px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-card);
  background: var(--site-color-surface);
  color: var(--site-color-text);
  box-shadow: 0 16px 48px rgb(0 0 0 / 32%);
}
.post-revision-history-panel.is-expanded { width: min(960px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); }
.post-revision-history-header { display: flex; flex: none; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px; border-bottom: 1px solid var(--site-color-border); }
.post-revision-history-header h2 { color: var(--site-color-heading); font-size: 15px; font-weight: 600; }
.post-revision-history-header p { margin-top: 4px; color: var(--site-color-muted); font-size: 12px; line-height: 1.4; }
.post-revision-history-actions { display: flex; flex: none; gap: 4px; }
.post-revision-history-content { min-height: 0; overflow-y: auto; padding: 12px; scrollbar-gutter: stable; }
.post-revision-history-list { display: grid; gap: 4px; }
.post-revision-history-item { display: flex; min-height: 48px; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 8px; border-radius: var(--site-radius-control); }
.post-revision-history-item:hover { background: var(--site-color-hover-background); }
.post-revision-history-meta { display: flex; min-width: 0; flex-wrap: wrap; align-items: baseline; gap: 6px 10px; font-size: 12px; }
.post-revision-history-meta strong { color: var(--site-color-heading); }
.post-revision-history-meta time { color: var(--site-color-text); }
.post-revision-history-meta span, .post-revision-history-meta code { color: var(--site-color-muted); }
.post-revision-history-meta code { font-size: 10px; }
.post-revision-history-pagination, .post-revision-history-preview-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.post-revision-history-pagination { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--site-color-border); color: var(--site-color-muted); font-size: 12px; }
.post-revision-history-preview { display: grid; gap: 8px; margin-top: 12px; padding: 12px; border-radius: var(--site-radius-control); background: var(--site-color-hover-background); }
.post-revision-history-preview h3 { color: var(--site-color-heading); font-size: 13px; font-weight: 600; }
.post-revision-history-preview pre { max-height: 220px; overflow: auto; white-space: pre-wrap; font-size: 12px; }
.post-revision-history-panel.is-expanded .post-revision-history-preview pre { max-height: min(48vh, 500px); }
@media (max-width: 640px) {
  .post-revision-history { inset-inline: 12px; inset-block-end: calc(76px + env(safe-area-inset-bottom)); display: flex; justify-content: flex-end; }
  .post-revision-history-panel { max-height: calc(100dvh - 108px); }
  .post-revision-history-panel.is-expanded { width: 100%; max-height: calc(100dvh - 24px); }
}
}
</style>
