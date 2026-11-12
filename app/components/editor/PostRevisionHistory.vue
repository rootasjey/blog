<template>
  <section class="mt-6 rounded-xl border border-gray-200/70 bg-white/70 p-4 dark:border-gray-800/70 dark:bg-gray-950/40">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold">{{ $ts('pages.postEditor.history') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ $ts('pages.postEditor.historyDescription') }}</p>
      </div>
      <NButton btn="outline-gray" size="xs" :disabled="historyLoading" @click="toggleHistory">
        {{ historyOpen ? $ts('pages.postEditor.hideHistory') : $ts('pages.postEditor.showHistory') }}
      </NButton>
    </div>

    <div v-if="historyOpen" class="mt-4 space-y-3">
      <p v-if="historyLoading" role="status" class="text-sm opacity-70">{{ $ts('pages.postEditor.loadingHistory') }}</p>
      <p v-else-if="historyError" role="alert" class="text-sm text-red-600 dark:text-red-400">{{ historyError }}</p>
      <p v-else-if="!revisions.length" class="text-sm opacity-70">{{ $ts('pages.postEditor.noHistory') }}</p>
      <ul v-else class="space-y-2">
        <li
          v-for="revision in revisions"
          :key="revision.revision"
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200/60 px-3 py-2 dark:border-gray-800/60"
        >
          <span class="text-sm">v{{ revision.revision }} · {{ formatPostDate(revision.created_at) }} · {{ revision.source }}</span>
          <NButton btn="ghost-gray" size="xs" @click="previewRevision(revision.revision)">
            {{ $ts('pages.postEditor.previewRevision') }}
          </NButton>
        </li>
      </ul>

      <div v-if="previewedRevision !== null" class="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-sm font-semibold">{{ $ts('pages.postEditor.revisionPreview', { revision: previewedRevision }) }}</h3>
          <NButton btn="solid-black" size="xs" :disabled="restoringRevision" @click="restoreRevision">
            {{ restoringRevision ? $ts('pages.postEditor.restoringRevision') : $ts('pages.postEditor.restoreRevision') }}
          </NButton>
        </div>
        <pre class="max-h-64 overflow-auto whitespace-pre-wrap text-sm">{{ revisionPreview }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type RevisionSummary = { revision: number; source: string; created_at: string }

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

async function toggleHistory() {
  historyOpen.value = !historyOpen.value
  if (!historyOpen.value || revisions.value.length || historyLoading.value) return
  await loadHistory()
}

async function loadHistory() {
  historyError.value = ''
  historyLoading.value = true
  try {
    const endpoint: string = `/api/posts/${encodeURIComponent(props.identifier)}/revisions`
    revisions.value = await $fetch<RevisionSummary[]>(endpoint)
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
    const result = await $fetch<{ revision: number; article: object }>(
      endpoint,
    )
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
