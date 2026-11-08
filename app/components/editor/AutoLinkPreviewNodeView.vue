<template>
  <NodeViewWrapper :class="['auto-link-preview', selected ? 'is-selected' : '']" :data-loading="loading ? 'true' : 'false'" :data-image-position="imagePosition">
    <div class="auto-link-preview__media" :class="{ 'is-clickable': isClickable }">
      <NuxtImg v-if="imageSrc" :src="imageSrc" :alt="imageAlt" fit="cover" class="auto-link-preview__image" />
      <div v-else class="auto-link-preview__placeholder">Preview</div>

      <div v-if="loading" class="auto-link-preview__spinner">
        <span class="spinner" />
      </div>

      <button v-if="isEditable && href" type="button" class="auto-link-preview__revert-btn" @click.stop.prevent="revertToLink" title="Revert to link"><span class="i-lucide-link-2" /></button>
    </div>

    <div class="auto-link-preview__meta" :class="{ 'is-clickable': isClickable }" @click="onMetaClick">
      <template v-if="isEditable">
        <input v-model="localTitle" @blur="commitTitle" @keydown.enter.prevent="commitTitle" placeholder="Title" class="auto-link-preview__title-input" />
        <textarea v-model="localDescription" @blur="commitDescription" rows="2" placeholder="Description" class="auto-link-preview__desc-input" />
      </template>

      <template v-else>
        <NLink v-if="title" class="auto-link-preview__link" :href="href" target="_blank" rel="noopener">
          <h3 v-if="title" class="auto-link-preview__title">{{ title }}</h3>
          <p v-if="description" class="auto-link-preview__description">{{ description }}</p>
        </NLink>
      </template>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { editorIsEditable } from './editorUtils'

const props = defineProps(nodeViewProps)

const isEditable = computed(() => editorIsEditable(props.editor))
const selected = computed(() => !!props.selected)
const href = computed(() => props.node.attrs?.href ?? '')
const title = computed(() => props.node.attrs?.title ?? '')
const description = computed(() => props.node.attrs?.description ?? '')
const imageSrc = computed(() => props.node.attrs?.imageSrc ?? '')
const imageAlt = computed(() => props.node.attrs?.imageAlt ?? '')
const imagePosition = computed(() => (props.node.attrs?.imagePosition === 'right' ? 'right' : 'left'))
const loading = computed(() => !!props.node.attrs?.loading)

const localTitle = ref(title.value)
const localDescription = ref(description.value)
let titleTimer: ReturnType<typeof setTimeout> | null = null
let descTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.node.attrs?.title, (v) => { localTitle.value = v ?? '' })
watch(() => props.node.attrs?.description, (v) => { localDescription.value = v ?? '' })

function commitTitle() {
  if (titleTimer) clearTimeout(titleTimer)
  props.updateAttributes({ title: localTitle.value })
}

function commitDescription() {
  if (descTimer) clearTimeout(descTimer)
  props.updateAttributes({ description: localDescription.value })
}

watch(localTitle, (v) => {
  if (titleTimer) clearTimeout(titleTimer)
  titleTimer = setTimeout(() => props.updateAttributes({ title: v }), 700)
})

watch(localDescription, (v) => {
  if (descTimer) clearTimeout(descTimer)
  descTimer = setTimeout(() => props.updateAttributes({ description: v }), 700)
})

function revertToLink() {
  const u = href.value
  if (!u) return
  const pos = props.getPos?.()
  if (typeof pos !== 'number') return

  const schema = props.editor?.schema
  const hasLinkMark = !!schema?.marks?.link
  const nodeToInsert = hasLinkMark
    ? { type: 'paragraph', content: [{ type: 'text', text: u, marks: [{ type: 'link', attrs: { href: u } }] }] }
    : { type: 'paragraph', content: [{ type: 'text', text: u }] }

  props.editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + props.node.nodeSize })
    .insertContentAt(pos, nodeToInsert)
    .run()
}

// Open a URL in a new tab (client-only)
function openInNewTab(url: string | null) {
  if (!url) return
  if (typeof window === 'undefined') return
  window.open(String(url), '_blank', 'noopener')
}

const isClickable = computed(() => !isEditable.value && (!!href.value || !!imageSrc.value))

function onMediaClick(e: MouseEvent) {
  if (isEditable.value) return
  if (imageSrc.value) {
    // e.stopPropagation()
    // openInNewTab(imageSrc.value)
  } else if (href.value) {
    e.stopPropagation()
    openInNewTab(href.value)
  }
}

function onMetaClick(e: MouseEvent) {
  if (isEditable.value) return
  if (href.value) openInNewTab(href.value)
}
</script>

<style>
@layer components {

/* Tiptap styles for this component. */
.post-content .ProseMirror .auto-link-preview { @apply relative flex items-center gap-4 border-1.5 border-border rounded-xl p-3 my-2 md:p-4 bg-background hover:scale-102 active:scale-99 transition-transform duration-200 ease-in; }
.post-content .ProseMirror .auto-link-preview[data-image-position="right"] { flex-direction: row-reverse; }
.dark .post-content .ProseMirror .auto-link-preview ::selection { @apply bg-transparent color-white; }
.post-content .ProseMirror .auto-link-preview__link,
.post-content .ProseMirror .auto-link-preview__link:hover { display: block; width: 100%; color: inherit; text-decoration: none; }
.post-content .ProseMirror .auto-link-preview__media { @apply relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center; }
.post-content .ProseMirror .auto-link-preview__image { @apply w-full h-full object-cover; }
.post-content .ProseMirror .auto-link-preview__placeholder { @apply text-xs text-slate-500 dark:text-slate-400; }
.post-content .ProseMirror .auto-link-preview__spinner { @apply absolute inset-0 flex items-center justify-center bg-background/40; }
.post-content .ProseMirror .spinner { @apply w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin; }
.post-content .ProseMirror .auto-link-preview__meta { @apply flex-1 flex flex-col justify-center min-w-0; }
.post-content .ProseMirror .auto-link-preview__title { @apply text-lg font-semibold truncate mt-0 mb-0; font-family: var(--site-font-body); line-height: 1.35; }
.post-content .ProseMirror .auto-link-preview__description { @apply text-base; color: var(--site-color-text); margin: 8px 0 0; line-height: 1.5; }
.post-content .ProseMirror .auto-link-preview__title-input { @apply w-full font-title text-lg font-semibold px-2 py-1 rounded mb-1 bg-background; }
.post-content .ProseMirror .auto-link-preview__desc-input { @apply w-full text-xs px-2 py-1 rounded bg-background; }
.post-content .ProseMirror .auto-link-preview__revert-btn { @apply absolute top-1 right-1 text-xs px-2 py-1 rounded-md bg-background/90 border border-border shadow-sm; }
.post-content .ProseMirror .auto-link-preview__media.is-clickable { cursor: pointer; }
.post-content .ProseMirror .auto-link-preview__meta.is-clickable { cursor: pointer; }
}
</style>
