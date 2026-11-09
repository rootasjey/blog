<template>
  <NodeViewWrapper :class="['auto-link-preview', selected ? 'is-selected' : '']" :data-loading="loading ? 'true' : 'false'" :data-image-position="imagePosition">
    <div class="auto-link-preview__media" :class="{ 'is-clickable': isClickable }">
      <NuxtImg v-if="imageSrc" :src="imageSrc" :alt="imageAlt" fit="cover" class="auto-link-preview__image" />
      <div v-else class="auto-link-preview__placeholder">Preview</div>

      <div v-if="loading" class="auto-link-preview__spinner">
        <span class="spinner" />
      </div>

      <button v-if="isEditable && href" type="button" class="auto-link-preview__revert-btn" @click.stop.prevent="revertToLink" title="Revert to link" aria-label="Revert to link"><span class="i-lucide-link-2" /></button>
    </div>

    <div class="auto-link-preview__meta" :class="{ 'is-clickable': isClickable }" @click="onMetaClick">
      <template v-if="isEditable">
        <input v-model="localTitle" @blur="commitTitle" @keydown.enter.prevent="commitTitle" placeholder="Title" class="auto-link-preview__title auto-link-preview__title-input" />
        <textarea ref="descriptionInput" v-model="localDescription" @blur="commitDescription" rows="1" placeholder="Description" class="auto-link-preview__description auto-link-preview__desc-input" />
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const descriptionInput = ref<HTMLTextAreaElement | null>(null)
let titleTimer: ReturnType<typeof setTimeout> | null = null
let descTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.node.attrs?.title, (v) => { localTitle.value = v ?? '' })
watch(() => props.node.attrs?.description, async (v) => {
  localDescription.value = v ?? ''
  await nextTick()
  resizeDescription()
})

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

watch(localDescription, async (v) => {
  if (descTimer) clearTimeout(descTimer)
  descTimer = setTimeout(() => props.updateAttributes({ description: v }), 700)
  await nextTick()
  resizeDescription()
})

function resizeDescription() {
  const textarea = descriptionInput.value
  if (!textarea) return

  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

onMounted(async () => {
  await nextTick()
  resizeDescription()
  requestAnimationFrame(resizeDescription)
})
onBeforeUnmount(() => {
  if (titleTimer) clearTimeout(titleTimer)
  if (descTimer) clearTimeout(descTimer)
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
.post-content .ProseMirror .auto-link-preview {
  @apply relative flex items-center my-2;
  box-sizing: border-box;
  gap: 20px;
  padding: 20px;
  border: 1px solid color-mix(in srgb, var(--site-color-text) 8%, var(--site-color-background));
  border-radius: var(--site-radius-card);
  background: transparent;
  transition: border-color 200ms ease, background-color 200ms ease, transform 220ms var(--site-ease-standard);
}
.post-content .ProseMirror .auto-link-preview:hover,
.post-content .ProseMirror .auto-link-preview:focus-within {
  border-color: color-mix(in srgb, var(--site-color-text) 14%, var(--site-color-background));
  background: var(--site-color-hover-background);
}
.post-content .ProseMirror .auto-link-preview:hover { transform: translateY(-2px); }
.post-content .ProseMirror .auto-link-preview:focus-within { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.post-content .ProseMirror .auto-link-preview[data-image-position="right"] { flex-direction: row-reverse; }
.dark .post-content .ProseMirror .auto-link-preview ::selection { @apply bg-transparent color-white; }
.post-content .ProseMirror .auto-link-preview__link,
.post-content .ProseMirror .auto-link-preview__link:hover { display: block; width: 100%; color: inherit; text-decoration: none; }
.post-content .ProseMirror .auto-link-preview__media {
  @apply relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center;
  border-radius: var(--site-radius-inline-media);
}
.post-content .ProseMirror .auto-link-preview__image { @apply w-full h-full object-cover; }
.post-content .ProseMirror .auto-link-preview__placeholder { @apply text-xs text-slate-500 dark:text-slate-400; }
.post-content .ProseMirror .auto-link-preview__spinner { @apply absolute inset-0 flex items-center justify-center bg-background/40; }
.post-content .ProseMirror .spinner { @apply w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin; }
.post-content .ProseMirror .auto-link-preview__meta { @apply flex-1 flex flex-col justify-center min-w-0; }
.post-content .ProseMirror .auto-link-preview__title { @apply text-lg font-semibold mt-0 mb-0; font-family: var(--site-font-body); line-height: 1.35; }
.post-content .ProseMirror .auto-link-preview__link .auto-link-preview__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.post-content .ProseMirror .auto-link-preview__description { @apply text-base; color: var(--site-color-text); margin: 12px 0 0; line-height: 1.5; }
.post-content .ProseMirror .auto-link-preview__title-input {
  @apply w-full p-0 bg-transparent;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  outline: none;
  color: var(--site-color-heading);
  font-family: var(--site-font-body);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  transition: border-color 160ms ease;
}
.post-content .ProseMirror .auto-link-preview__desc-input {
  @apply block w-full p-0 bg-transparent;
  min-height: 1.5em;
  overflow: hidden;
  resize: none;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  outline: none;
  color: var(--site-color-text);
  font-family: var(--site-font-body);
  font-size: 16px;
  line-height: 1.5;
  transition: border-color 160ms ease;
}
.post-content .ProseMirror .auto-link-preview__title-input:focus,
.post-content .ProseMirror .auto-link-preview__desc-input:focus { border-bottom-color: var(--site-color-accent); }
.post-content .ProseMirror .auto-link-preview__revert-btn {
  @apply absolute top-1 right-1 text-xs px-2 py-1 rounded-md bg-background/90 border border-border shadow-sm;
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms ease;
}
.post-content .ProseMirror .auto-link-preview:hover .auto-link-preview__revert-btn,
.post-content .ProseMirror .auto-link-preview:focus-within .auto-link-preview__revert-btn,
.post-content .ProseMirror .auto-link-preview.is-selected .auto-link-preview__revert-btn { opacity: 1; pointer-events: auto; }
.post-content .ProseMirror .auto-link-preview__media.is-clickable { cursor: pointer; }
.post-content .ProseMirror .auto-link-preview__meta.is-clickable { cursor: pointer; }

@media (max-width: 640px) {
  .post-content .ProseMirror .auto-link-preview { gap: 16px; padding: 16px; }
  .post-content .ProseMirror .auto-link-preview__media { @apply w-20 h-20; }
}

@media (prefers-reduced-motion: reduce) {
  .post-content .ProseMirror .auto-link-preview { transition: none; }
  .post-content .ProseMirror .auto-link-preview:hover { transform: none; }
}
}
</style>
