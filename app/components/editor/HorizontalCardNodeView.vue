<template>
  <NodeViewWrapper :class="['horizontal-card', positionClass, selected ? 'is-selected' : '']" :data-image-position="imagePosition" :data-image-square="isSquare ? 'true' : 'false'">
    <div class="horizontal-card__media" @click="triggerFilePicker" :role="isEditable ? 'button' : undefined" :title="isEditable ? 'Replace image' : undefined">
      <img v-if="imageSrc" :src="imageSrc" :alt="imageAlt" :class="['horizontal-card__image', { 'is-square': isSquare }]" />
      <div v-else class="horizontal-card__placeholder">Add image</div>

      <div class="horizontal-card__media-controls">
        <button v-if="isEditable" type="button" class="horizontal-card__replace-btn" @click.stop.prevent="triggerFilePicker">Replace</button>
        <button v-if="isEditable && href" type="button" class="horizontal-card__revert-btn" @click.stop.prevent="revertToLink" title="Revert to link"><span class="i-lucide-link-2" /></button>
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFilePicked" />
    </div>

    <div class="horizontal-card__body">
      <NodeViewContent class="horizontal-card__content" />

      <p v-if="!isEditable && !hasContent" class="horizontal-card__text">Add text…</p>
    </div>  
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { useEditorImages } from '~/composables/useEditorImages'
import { useRoute } from '#imports'
import { editorIsEditable } from './editorUtils'

const props = defineProps(nodeViewProps)
const fileInput = ref<HTMLInputElement | null>(null)

const isEditable = computed(() => editorIsEditable(props.editor))
const selected = computed(() => !!props.selected)
const imageSrc = computed(() => props.node.attrs?.imageSrc ?? '')
const imageAlt = computed(() => props.node.attrs?.imageAlt ?? '')
const imagePosition = computed(() => (props.node.attrs?.imagePosition === 'right' ? 'right' : 'left'))
const isSquare = computed(() => props.node.attrs?.square !== false)
const href = computed(() => props.node.attrs?.href ?? null)

const hasContent = computed(() => !!props.node.content && props.node.content.size > 0)

const positionClass = computed(() => `horizontal-card--image-${imagePosition.value}`)

const { addUploading, updateUploading, removeUploading, uploadFileWithProgress } = useEditorImages()
const route = useRoute()

function triggerFilePicker() {
  if (!isEditable.value) return
  fileInput.value?.click()
}

async function uploadImage(file: File): Promise<string | null> {
  const identifier = String(route.params.identifier ?? '')
  const uploadId = addUploading(file.name)
  try {
    if (identifier) {
      const json = await uploadFileWithProgress(identifier, file, (p: number) => updateUploading(uploadId, p), uploadId)
      const src = json?.image?.src
      if (src) return src
    }

    const fr = new FileReader()
    return await new Promise<string>((resolve) => {
      fr.onload = () => resolve(String(fr.result || ''))
      fr.readAsDataURL(file)
    })
  } catch {
    const fr = new FileReader()
    return await new Promise<string>((resolve) => {
      fr.onload = () => resolve(String(fr.result || ''))
      fr.readAsDataURL(file)
    })
  } finally {
    removeUploading(uploadId)
  }
}

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const src = await uploadImage(file)
  if (src) props.updateAttributes({ imageSrc: src })
  input.value = ''
}



async function revertToLink() {
  const href = props.node.attrs?.href as string | null
  if (!href) return
  const pos = props.getPos?.()
  if (typeof pos !== 'number') return

  // Build a paragraph with a link mark if available
  const schema = props.editor?.schema
  const hasLinkMark = !!schema?.marks?.link
  const nodeToInsert = hasLinkMark
    ? { type: 'paragraph', content: [{ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }] }
    : { type: 'paragraph', content: [{ type: 'text', text: href }] }

  // Replace the entire card node with a paragraph containing the link
  props.editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + props.node.nodeSize })
    .insertContentAt(pos, nodeToInsert)
    .run()
}
</script>

<style>
@layer components {

/* Tiptap styles for this component. */
.light .post-content .ProseMirror.ProseMirror-hideselection p.horizontal-card__text::selection { @apply bg-black; }
.dark .post-content .ProseMirror.ProseMirror-hideselection p.horizontal-card__text::selection { @apply bg-white; }
.horizontal-card {
  @apply relative flex items-stretch my-2;
  box-sizing: border-box;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--site-color-card-border);
  border-radius: var(--site-radius-card);
  background: transparent;
  transition: border-color 200ms ease, background-color 200ms ease, transform 220ms var(--site-ease-standard);
}
.horizontal-card:hover,
.horizontal-card:focus-within {
  border-color: var(--site-color-hover-background);
  background: var(--site-color-hover-background);
}
.horizontal-card:hover { transform: translateY(-2px); }
.horizontal-card:focus-within { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.horizontal-card--image-right { @apply flex-row-reverse; }
.horizontal-card--image-left { @apply flex-row; }
.post-content .horizontal-card__media {
  @apply relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center;
  border-radius: var(--site-radius-inline-media);
}
.post-content .horizontal-card__image { @apply w-full h-full object-cover; }
.post-content .horizontal-card__image.is-square { @apply aspect-square; }
.post-content .horizontal-card__placeholder { @apply text-xs text-slate-500 dark:text-slate-400 text-center px-2; }
.horizontal-card__replace-btn {
  @apply absolute bottom-1 right-1 text-xs px-2 py-1 rounded-md bg-background/90 border border-border shadow-sm hover:bg-muted transition-colors;
}
.horizontal-card__revert-btn {
  @apply absolute top-1 right-1 text-xs px-2 py-1 rounded-md bg-background/90 border border-border shadow-sm hover:bg-muted transition-colors;
}
.post-content .horizontal-card__body { @apply flex-1 min-w-0; }
.post-content .horizontal-card__text { @apply text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap; }
.post-content .horizontal-card__body h3 {
  @apply m-0;
  color: var(--site-color-heading);
  font-family: var(--site-font-body);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
}
.post-content .horizontal-card__body p {
  @apply mb-0;
  margin-top: 12px;
  color: var(--site-color-text);
  font-family: var(--site-font-body);
  font-size: 16px;
  line-height: 1.5;
}
.post-content .horizontal-card__content { @apply focus:outline-none; }

@media (max-width: 640px) {
  .horizontal-card { gap: 16px; padding: 16px; }
  .post-content .horizontal-card__media { @apply w-20 h-20; }
}

@media (prefers-reduced-motion: reduce) {
  .horizontal-card { transition: none; }
  .horizontal-card:hover { transform: none; }
}
}
</style>
