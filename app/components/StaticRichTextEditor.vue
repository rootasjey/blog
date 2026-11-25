<template>
  <div class="static-rich-text-editor">
    <EditorContent v-if="editor" :editor="editor" />
    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :options="{ placement: 'top' }"
      :should-show="shouldShowMenu"
      class="static-rich-text-editor__bubble"
      @pointerdown="preserveSelection"
    >
      <div class="static-rich-text-editor__tools" role="toolbar" :aria-label="labels.toolbar">
        <button type="button" :class="{ 'is-active': editor.isActive('bold') }" :aria-label="labels.bold" :title="labels.bold" @click="runToolbarAction($event, toggleBold)"><strong>B</strong></button>
        <button type="button" :class="{ 'is-active': editor.isActive('italic') }" :aria-label="labels.italic" :title="labels.italic" @click="runToolbarAction($event, toggleItalic)"><em>I</em></button>
        <button type="button" :class="{ 'is-active': editor.isActive('strike') }" :aria-label="labels.strike" :title="labels.strike" @click="runToolbarAction($event, toggleStrike)"><s>S</s></button>
        <button type="button" :class="{ 'is-active': editor.isActive('bulletList') }" :aria-label="labels.bullets" :title="labels.bullets" @click="runToolbarAction($event, toggleBulletList)">
          <NIcon name="i-lucide-list" aria-hidden="true" />
        </button>
        <button type="button" :class="{ 'is-active': editor.isActive('orderedList') }" :aria-label="labels.orderedList" :title="labels.orderedList" @click="runToolbarAction($event, toggleOrderedList)">
          <NIcon name="i-lucide-list-ordered" aria-hidden="true" />
        </button>
        <button
          type="button"
          :aria-label="editor.isActive('link') ? labels.removeLink : labels.link"
          :title="editor.isActive('link') ? labels.removeLink : labels.link"
          @click="runToolbarAction($event, handleLinkAction)"
        >
          <NIcon :name="editor.isActive('link') ? 'i-tabler-link-minus' : 'i-tabler-link-plus'" aria-hidden="true" />
        </button>
        <form v-if="linkFormOpen" class="static-rich-text-editor__link-form" @submit.prevent="applyLink">
          <input v-model="linkHref" type="url" :aria-label="labels.linkUrl" placeholder="https://…" @keydown.esc="linkFormOpen = false">
          <button type="submit">{{ labels.apply }}</button>
        </form>
      </div>
    </BubbleMenu>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { isSafeStaticRichTextHref, normalizeStaticRichText, type StaticRichTextValue } from '~~/shared/types/static-rich-text'

const props = defineProps<{ modelValue: StaticRichTextValue; label: string; maxLength?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: StaticRichTextValue] }>()
const { $getLocale } = useI18n()
const labels = computed(() => $getLocale() === 'en'
  ? { toolbar: 'Text formatting', bold: 'Bold', italic: 'Italic', strike: 'Strikethrough', bullets: 'Bulleted list', orderedList: 'Ordered list', link: 'Add link', removeLink: 'Remove link', linkUrl: 'Link URL', apply: 'Apply' }
  : { toolbar: 'Mise en forme du texte', bold: 'Gras', italic: 'Italique', strike: 'Barré', bullets: 'Liste à puces', orderedList: 'Liste ordonnée', link: 'Ajouter un lien', removeLink: 'Retirer le lien', linkUrl: 'Adresse du lien', apply: 'Appliquer' })
const linkFormOpen = ref(false)
const linkHref = ref('')
const editor = useEditor({
  content: normalizeStaticRichText(props.modelValue),
  extensions: [
    StarterKit.configure({ heading: false, blockquote: false, code: false, codeBlock: false, horizontalRule: false, link: false }),
    Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false, isAllowedUri: isSafeStaticRichTextHref }),
  ],
  editorProps: {
    attributes: {
      class: 'static-rich-text-editor__input',
      'aria-label': props.label,
      ...(props.maxLength ? { maxlength: String(props.maxLength) } : {}),
    },
    handleTextInput: (view, from, to, text) => exceedsLimit(view.state.doc.textContent.length - (to - from) + text.length),
    handlePaste: (view, event) => {
      const pastedText = event.clipboardData?.getData('text/plain') || ''
      return pastedText ? exceedsLimit(view.state.doc.textContent.length - (view.state.selection.to - view.state.selection.from) + pastedText.length) : false
    },
  },
  onUpdate: ({ editor: current }) => emit('update:modelValue', current.getJSON() as StaticRichTextValue),
})

function exceedsLimit(nextLength: number) {
  return Boolean(props.maxLength && nextLength > props.maxLength)
}

function shouldShowMenu({ state }: { state: { selection: { empty: boolean } } }) {
  return !state.selection.empty || linkFormOpen.value
}

watch(() => props.modelValue, (value) => {
  const current = editor.value
  if (!current) return
  const normalized = normalizeStaticRichText(value)
  if (JSON.stringify(current.getJSON()) !== JSON.stringify(normalized)) current.commands.setContent(normalized, { emitUpdate: false })
})

function preserveSelection(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('button')) event.preventDefault()
}

function runToolbarAction(event: MouseEvent, action: () => void) {
  const button = event.currentTarget
  if (event.detail > 0 && button instanceof HTMLElement) {
    const bounds = button.getBoundingClientRect()
    const pointerIsInsideButton = event.clientX >= bounds.left
      && event.clientX <= bounds.right
      && event.clientY >= bounds.top
      && event.clientY <= bounds.bottom
    if (!pointerIsInsideButton) return
  }

  action()
}

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}

function toggleStrike() {
  editor.value?.chain().focus().toggleStrike().run()
}

function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}

function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
}

function toggleLinkForm() {
  linkHref.value = editor.value?.getAttributes('link').href || ''
  linkFormOpen.value = !linkFormOpen.value
}

function handleLinkAction() {
  const current = editor.value
  if (!current) return

  if (current.isActive('link')) {
    current.chain().focus().extendMarkRange('link').unsetLink().run()
    linkFormOpen.value = false
    return
  }

  toggleLinkForm()
}

function applyLink() {
  const current = editor.value
  if (!current || !isSafeStaticRichTextHref(linkHref.value)) return
  current.chain().focus().extendMarkRange('link').setLink({ href: linkHref.value.trim() }).run()
  linkFormOpen.value = false
}

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
@layer components {
  .static-rich-text-editor { position: relative; }
  .static-rich-text-editor__input { min-height: 104px; padding: 10px 12px; border: 1px solid var(--site-color-border); border-radius: 10px; background: var(--site-color-background); color: var(--site-color-text); font: inherit; line-height: 1.5; outline: none; }
  .static-rich-text-editor__input:focus { border-color: var(--site-color-focus-ring); box-shadow: 0 0 0 2px color-mix(in srgb, var(--site-color-focus-ring) 20%, transparent); }
  .static-rich-text-editor__input p { margin: 0 0 8px; }
  .static-rich-text-editor__input p:last-child { margin-bottom: 0; }
  .static-rich-text-editor__input ul { margin: 8px 0; padding-left: 24px; }
  .static-rich-text-editor__input a { color: var(--site-color-accent); text-decoration: underline; }
  .static-rich-text-editor__bubble { z-index: 100; padding: 4px; border: 1px solid var(--site-color-border); border-radius: 10px; background: var(--site-color-background); box-shadow: 0 8px 24px rgb(0 0 0 / 16%); }
  .static-rich-text-editor__tools { display: flex; align-items: center; gap: 3px; }
  .static-rich-text-editor__tools > button { display: grid; min-width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: var(--site-color-text); cursor: pointer; }
  .static-rich-text-editor__tools > button:hover, .static-rich-text-editor__tools > button.is-active { background: var(--site-color-hover-background); color: var(--site-color-heading); }
  .static-rich-text-editor__link-form { display: flex; gap: 4px; padding-inline: 4px; }
  .static-rich-text-editor__link-form input { width: 180px; min-width: 0; }
}
</style>
