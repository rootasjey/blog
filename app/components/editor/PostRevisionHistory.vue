<template>
  <div class="post-revision-history">
    <section class="post-revision-history-launcher" :aria-label="$ts('pages.postEditor.history')" @click="toggleHistory">
      <div class="post-revision-history-launcher-copy">
        <h2>{{ $ts('pages.postEditor.history') }}</h2>
        <p>{{ $ts('pages.postEditor.historyDescription') }}</p>
      </div>
      <NButton
        class="post-revision-history-trigger"
        btn="outline-gray"
        size="xs"
        :aria-expanded="historyOpen"
      >
        {{ $ts(historyOpen ? 'pages.postEditor.hideHistory' : 'pages.postEditor.showHistory') }}
      </NButton>
    </section>

    <Teleport to="body">
      <Transition name="post-revision-history-panel" :duration="{ enter: 320, leave: 260 }" appear>
        <section
          v-if="historyOpen"
          ref="panel"
          class="post-revision-history-window"
          :class="[panelClasses, { 'is-expanded': isMaximized }]"
          :style="panelStyle"
          role="dialog"
          aria-modal="false"
          aria-labelledby="post-revision-history-title"
        >
          <header class="post-revision-history-header" @pointerdown="startDrag">
            <div>
              <h2 id="post-revision-history-title">{{ $ts('pages.postEditor.history') }}</h2>
              <p>{{ $ts('pages.postEditor.historyDescription') }}</p>
            </div>
            <div class="post-revision-history-actions">
              <NTooltip
                :content="$ts(isMaximized ? 'pages.postEditor.restorePanel' : 'pages.postEditor.expandPanel')"
                :_tooltipContent="{ side: 'top', sideOffset: 8, align: 'end', class: 'post-revision-history-tooltip' }"
              >
                <NButton
                  btn="ghost-gray"
                  icon
                  size="xs"
                  class="post-revision-history-icon-button"
                  :label="isMaximized ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
                  :disabled="historyLoading || !transitionsReady"
                  :aria-label="$ts(isMaximized ? 'pages.postEditor.restorePanel' : 'pages.postEditor.expandPanel')"
                  @click="toggleMaximize"
                />
              </NTooltip>
              <NTooltip :content="$ts('pages.postEditor.closeHistory')" :_tooltipContent="{ side: 'top', sideOffset: 8, align: 'end', class: 'post-revision-history-tooltip' }">
                <NButton
                  btn="ghost-gray"
                  icon
                  size="xs"
                  class="post-revision-history-icon-button"
                  label="i-lucide-x"
                  :aria-label="$ts('pages.postEditor.closeHistory')"
                  @click="closeHistory"
                />
              </NTooltip>
            </div>
          </header>

          <div class="post-revision-history-content">
            <p v-if="historyLoading" role="status" class="text-sm opacity-70">{{ $ts('pages.postEditor.loadingHistory') }}</p>
            <p v-else-if="historyError" role="alert" class="text-sm text-red-600 dark:text-red-400">{{ historyError }}</p>
            <p v-else-if="!revisions.length" class="text-sm opacity-70">{{ $ts('pages.postEditor.noHistory') }}</p>
            <template v-else>
              <ul class="post-revision-history-list">
                <li v-for="revision in revisions" :key="revision.revision" class="post-revision-history-item">
                  <div class="post-revision-history-meta">
                    <strong>v{{ revision.revision }}</strong>
                    <time :datetime="revision.created_at">{{ formatPostDate(revision.created_at) }}</time>
                    <span>{{ revision.source }}</span>
                    <code v-if="isMaximized">{{ revision.content_hash.slice(0, 8) }}</code>
                  </div>
                  <NButton btn="ghost-gray" size="xs" :disabled="historyLoading || restoringRevision" @click="previewRevision(revision.revision)">
                    {{ $ts('pages.postEditor.previewRevision') }}
                  </NButton>
                </li>
              </ul>

              <nav v-if="pageCount > 1" class="post-revision-history-pagination" :aria-label="$ts('pages.postEditor.historyPagination')">
                <NButton btn="ghost-gray" size="xs" :disabled="historyLoading || restoringRevision || currentPage === 1" @click="changeHistoryPage(currentPage - 1)">
                  {{ $ts('pages.postEditor.previousPage') }}
                </NButton>
                <span>{{ $ts('pages.postEditor.historyPage', { page: currentPage, pages: pageCount }) }}</span>
                <NButton btn="ghost-gray" size="xs" :disabled="historyLoading || restoringRevision || currentPage === pageCount" @click="changeHistoryPage(currentPage + 1)">
                  {{ $ts('pages.postEditor.nextPage') }}
                </NButton>
              </nav>
            </template>

            <div v-if="previewedRevision !== null" class="post-revision-history-preview">
              <div class="post-revision-history-preview-header">
                <h3>{{ $ts('pages.postEditor.revisionPreview', { revision: previewedRevision }) }}</h3>
                <NButton btn="solid-black" size="xs" :disabled="restoringRevision || historyLoading" @click="restoreRevision">
                  {{ restoringRevision ? $ts('pages.postEditor.restoringRevision') : $ts('pages.postEditor.restoreRevision') }}
                </NButton>
              </div>
              <pre>{{ revisionPreview }}</pre>
            </div>
          </div>

          <EditorPanelResizeHandle
            v-if="!isMaximized && transitionsReady && !historyLoading"
            :label="resizePanelLabel"
            @start="startResize"
            @keydown="resizeWithKeyboard"
          />
        </section>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useEditorPanelMaximize } from '~/composables/useEditorPanelMaximize'

type RevisionSummary = { revision: number; source: string; created_at: string; content_hash: string }
type RevisionPage = { items: RevisionSummary[]; page: number; limit: number; total: number }

const props = defineProps<{
  identifier: string
  contentRevision: number
  beforeRestore: () => Promise<number | null>
}>()
const emit = defineEmits<{
  restored: []
  'restore-state': [isRestoring: boolean]
}>()

const { $ts, $getLocale } = useI18n()
const { formatPostDate } = usePost()
const resizePanelLabel = computed(() => $getLocale() === 'en'
  ? 'Resize the history panel. Use arrow keys or drag.'
  : 'Redimensionner le panneau. Utilise les flèches ou fais glisser.')
const historyOpen = ref(false)
const panel = ref<HTMLElement | null>(null)
const x = ref(0)
const y = ref(0)
const historyLoading = ref(false)
const restoringRevision = ref(false)
const historyError = ref('')
const revisions = ref<RevisionSummary[]>([])
const totalRevisions = ref(0)
const previewedRevision = ref<number | null>(null)
const revisionPreview = ref('')
const currentPage = ref(1)
const pageSize = 8
let historyLoadPromise: Promise<void> | null = null
const {
  isMaximized,
  transitionsReady,
  panelStyle,
  panelClasses,
  prepareForOpen,
  captureNormalHeight,
  toggleMaximize,
  startResize,
  resizeWithKeyboard,
} = useEditorPanelMaximize(panel, x, y, historyOpen)
const pageCount = computed(() => Math.max(1, Math.ceil(totalRevisions.value / pageSize)))

async function openHistory() {
  prepareForOpen()
  if (import.meta.client) {
    const width = Math.min(420, window.innerWidth - 32)
    const height = Math.min(260, window.innerHeight - 120)
    x.value = Math.max(8, window.innerWidth - width - 20)
    y.value = Math.max(8, window.innerHeight - height - 96)
  }
  historyOpen.value = true

  if (!revisions.value.length || historyLoading.value) await loadHistory()
  await nextTick()
  if (!historyOpen.value) return

  const element = panel.value
  if (element && import.meta.client) {
    x.value = Math.max(8, Math.min(window.innerWidth - element.offsetWidth - 8, x.value))
    y.value = Math.max(8, window.innerHeight - element.offsetHeight - 96)
    captureNormalHeight()
  }
}

function closeHistory() {
  stopDrag()
  historyOpen.value = false
}

function toggleHistory() {
  if (historyOpen.value) closeHistory()
  else openHistory()
}

let dragOffsetX = 0
let dragOffsetY = 0

function startDrag(event: PointerEvent) {
  if (!transitionsReady.value || historyLoading.value || isMaximized.value || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  event.preventDefault()
  dragOffsetX = event.clientX - x.value
  dragOffsetY = event.clientY - y.value
  window.addEventListener('pointermove', drag)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}

function drag(event: PointerEvent) {
  const element = panel.value
  if (!element) return
  const maxX = Math.max(8, window.innerWidth - element.offsetWidth - 8)
  const maxY = Math.max(8, window.innerHeight - element.offsetHeight - 8)
  x.value = Math.max(8, Math.min(maxX, event.clientX - dragOffsetX))
  y.value = Math.max(8, Math.min(maxY, event.clientY - dragOffsetY))
}

function stopDrag() {
  if (!import.meta.client) return
  window.removeEventListener('pointermove', drag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

async function loadHistory(page = currentPage.value) {
  if (historyLoadPromise) return historyLoadPromise

  historyError.value = ''
  historyLoading.value = true
  historyLoadPromise = (async () => {
    try {
      const endpoint: string = `/api/posts/${encodeURIComponent(props.identifier)}/revisions`
      const result = await $fetch<RevisionPage>(endpoint, { query: { page, limit: pageSize } })
      revisions.value = result.items
      currentPage.value = result.page
      totalRevisions.value = result.total
    } catch (error: any) {
      historyError.value = error?.data?.message || $ts('pages.postEditor.historyLoadFailed')
    } finally {
      historyLoading.value = false
    }
  })()

  try {
    await historyLoadPromise
  } finally {
    historyLoadPromise = null
  }
}

async function changeHistoryPage(page: number) {
  if (historyLoading.value || restoringRevision.value || page < 1 || page > pageCount.value) return
  await loadHistory(page)
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
  if (previewedRevision.value === null || restoringRevision.value || historyLoading.value) return
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
    totalRevisions.value = 0
    currentPage.value = 1
    emit('restored')
    await loadHistory(1)
  } catch (error: any) {
    historyError.value = error?.data?.message || $ts('pages.postEditor.restoreFailed')
  } finally {
    restoringRevision.value = false
    emit('restore-state', false)
  }
}

onBeforeUnmount(stopDrag)
</script>

<style scoped>
@layer components {
.post-revision-history { margin-top: 24px; }
.post-revision-history-launcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px;
  border-radius: var(--site-radius-card);
  background: color-mix(in srgb, var(--site-color-background) 90%, #000);
  cursor: pointer;
}
.post-revision-history-launcher-copy { min-width: 0; }
.post-revision-history-launcher h2 { color: var(--site-color-heading); font-size: 15px; font-weight: 600; }
.post-revision-history-launcher p { margin-top: 4px; color: var(--site-color-muted); font-size: 12px; line-height: 1.4; }
.post-revision-history-trigger { flex: none; }
.post-revision-history-window {
  position: fixed;
  z-index: 100;
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
  height: var(--editor-panel-normal-height, auto);
}
.post-revision-history-window.editor-panel--transition-ready {
  transition: left 520ms cubic-bezier(.2, .75, .25, 1), top 520ms cubic-bezier(.2, .75, .25, 1), width 520ms cubic-bezier(.2, .75, .25, 1), height 520ms cubic-bezier(.2, .75, .25, 1), max-height 520ms cubic-bezier(.2, .75, .25, 1), border-radius 300ms ease;
}
:global(.post-revision-history-tooltip) { z-index: 200; }
.post-revision-history-window.post-revision-history-panel-enter-active,
.post-revision-history-window.post-revision-history-panel-leave-active {
  transition: left 520ms cubic-bezier(.2, .75, .25, 1), top 520ms cubic-bezier(.2, .75, .25, 1), width 520ms cubic-bezier(.2, .75, .25, 1), height 520ms cubic-bezier(.2, .75, .25, 1), max-height 520ms cubic-bezier(.2, .75, .25, 1), border-radius 300ms ease, opacity 260ms ease, transform 260ms cubic-bezier(.2, .75, .25, 1);
}
.post-revision-history-window.editor-panel--resizing { transition: none !important; }
.post-revision-history-window.editor-panel--spring-expanding { animation: editor-panel-spring-expand 620ms cubic-bezier(.2, .75, .25, 1) both; }
.post-revision-history-window.editor-panel--spring-restoring { animation: editor-panel-spring-restore 620ms cubic-bezier(.2, .75, .25, 1) both; }
.post-revision-history-window.editor-panel--maximized { border-radius: var(--site-radius-card); }
.post-revision-history-window.editor-panel--maximized .post-revision-history-content { min-height: 0; flex: 1 1 auto; }
.post-revision-history-header { display: flex; flex: none; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px; border-bottom: 1px solid var(--site-color-border); cursor: move; touch-action: none; }
.post-revision-history-header h2 { color: var(--site-color-heading); font-size: 15px; font-weight: 600; }
.post-revision-history-header p { margin-top: 4px; color: var(--site-color-muted); font-size: 12px; line-height: 1.4; }
.post-revision-history-actions { display: flex; flex: none; align-items: center; gap: 4px; }
.post-revision-history-icon-button { display: grid; width: 40px; height: 40px; place-items: center; padding: 0; }
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
.post-revision-history-window.is-expanded .post-revision-history-preview pre { max-height: min(48vh, 500px); }
.post-revision-history-panel-enter-active,
.post-revision-history-panel-leave-active { transform-origin: bottom right; }
.post-revision-history-panel-enter-from,
.post-revision-history-panel-leave-to { opacity: 0; transform: translateY(12px) scale(.985); }
@keyframes editor-panel-spring-expand {
  0% { transform: scale(.985); }
  72% { transform: scale(1.022); }
  88% { transform: scale(.996); }
  100% { transform: scale(1); }
}
@keyframes editor-panel-spring-restore {
  0% { transform: scale(1); }
  72% { transform: scale(.985); }
  88% { transform: scale(1.008); }
  100% { transform: scale(1); }
}
@media (max-width: 640px) {
  .post-revision-history-launcher { align-items: flex-start; gap: 12px; }
  .post-revision-history-launcher-copy { flex: 1 1 auto; }
  .post-revision-history-window { max-height: calc(100dvh - 108px); }
  .post-revision-history-window.editor-panel--maximized { width: 90vw; max-height: 90dvh; }
}
@media (prefers-reduced-motion: reduce) {
  .post-revision-history-panel-enter-active,
  .post-revision-history-panel-leave-active,
  .post-revision-history-window.editor-panel--transition-ready { transition-duration: 0.01ms; }
  .post-revision-history-window.editor-panel--spring-expanding,
  .post-revision-history-window.editor-panel--spring-restoring { animation-duration: 0.01ms; }
}
}
</style>
