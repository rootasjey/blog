<template>
  <Teleport to="body">
    <section
      v-if="open"
      class="recommendations-editor"
      ref="editorPanel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="recommendations-editor-title"
      :class="panelClasses"
      :style="positionStyle"
    >
      <header class="recommendations-editor__header" @pointerdown="startDrag">
        <h2 id="recommendations-editor-title">{{ labels.title }}</h2>
        <div class="recommendations-editor__header-actions">
          <NButton btn="ghost-gray" size="xs" icon :label="isMaximized ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" :aria-label="isMaximized ? labels.restore : labels.maximize" :title="isMaximized ? labels.restore : labels.maximize" @click="toggleMaximize" />
          <NButton btn="ghost-gray" size="xs" icon label="i-lucide-x" :aria-label="labels.close" @click="close" />
        </div>
      </header>

      <div class="recommendations-editor__body">
        <div class="recommendations-editor__tabs" role="group" :aria-label="labels.languages">
          <button v-for="language in languages" :key="language.code" type="button" :aria-pressed="activeLanguage === language.code" @click="activeLanguage = language.code">
            {{ language.label }}
          </button>
        </div>

        <label>
          <span>{{ labels.pageTitle }}</span>
          <input ref="pageTitleInput" v-model="draft[activeLanguage].title" maxlength="100">
        </label>
        <label>
          <span>{{ labels.pageDescription }}</span>
          <textarea v-model="draft[activeLanguage].description" rows="4" maxlength="2000" />
        </label>

        <div class="recommendations-editor__list-heading">
          <h3>{{ labels.cards }}</h3>
          <NButton btn="outline-gray" size="xs" leading="i-ph-plus" :disabled="draft.items.length >= 12" @click="addItem">{{ labels.addCard }}</NButton>
        </div>

        <fieldset v-for="(item, index) in draft.items" :key="item.id" class="recommendations-editor__item">
          <legend>{{ item.name[activeLanguage] || labels.untitled }}</legend>
          <div class="recommendations-editor__item-actions">
            <NButton btn="ghost-gray" size="xs" icon label="i-ph-arrow-up" :aria-label="labels.moveUp" :disabled="index === 0" @click="moveItem(index, -1)" />
            <NButton btn="ghost-gray" size="xs" icon label="i-ph-arrow-down" :aria-label="labels.moveDown" :disabled="index === draft.items.length - 1" @click="moveItem(index, 1)" />
            <NButton btn="ghost-gray" size="xs" icon label="i-ph-trash" :aria-label="labels.removeCard" @click="removeItem(index)" />
          </div>
          <label>
            <span>{{ labels.name }}</span>
            <input v-model="item.name[activeLanguage]" maxlength="100">
          </label>
          <label>
            <span>{{ labels.description }}</span>
            <input v-model="item.description[activeLanguage]" maxlength="300">
          </label>
          <label>
            <span>{{ labels.url }}</span>
            <input v-model="item.href" type="url" maxlength="500" placeholder="https://…">
          </label>
          <label>
            <span>{{ labels.icon }}</span>
            <input v-model="item.icon" maxlength="500" placeholder="https://… or /images/…">
          </label>
          <img v-if="item.icon" class="recommendations-editor__icon-preview" :src="item.icon" alt="" width="32" height="32" loading="lazy">
        </fieldset>

        <p v-if="error" class="recommendations-editor__message recommendations-editor__message--error" role="alert">{{ error }}</p>
        <p v-if="success" class="recommendations-editor__message" role="status">{{ success }}</p>
      </div>

      <footer class="recommendations-editor__footer">
        <NButton btn="ghost-gray" size="sm" :disabled="saving" @click="close">{{ labels.cancel }}</NButton>
        <NButton btn="solid-black" size="sm" :loading="saving" :disabled="saving" @click="save">{{ saving ? labels.saving : labels.save }}</NButton>
      </footer>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditorPanelMaximize } from '~/composables/useEditorPanelMaximize'
import type { RecommendationsContent, SupportedContentLocale } from '~~/shared/types/public-page-content'
import { PUBLIC_PAGE_EDIT_REQUEST_EVENT } from '~/utils/publicPageEditRequests'

const props = defineProps<{ content: RecommendationsContent; isAdmin: boolean; isEditMode: boolean }>()
const emit = defineEmits<{ saved: [content: RecommendationsContent] }>()
const { $getLocale } = useI18n()
const locale = computed(() => $getLocale())
const labels = computed(() => locale.value === 'fr' ? {
  title: 'Modifier les recommandations', close: 'Fermer', maximize: 'Agrandir', restore: 'Restaurer', languages: 'Langue du contenu',
  pageTitle: 'Titre de la page', pageDescription: 'Introduction', cards: 'Cartes', addCard: 'Ajouter une carte', untitled: 'Sans titre',
  name: 'Nom', description: 'Description', url: 'Lien', icon: 'Icône (URL d’image)', moveUp: 'Monter', moveDown: 'Descendre', removeCard: 'Supprimer la carte',
  cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement…', saved: 'Modifications enregistrées', saveError: 'Enregistrement impossible',
} : {
  title: 'Edit recommendations', close: 'Close', maximize: 'Maximize', restore: 'Restore', languages: 'Content language',
  pageTitle: 'Page title', pageDescription: 'Introduction', cards: 'Cards', addCard: 'Add card', untitled: 'Untitled',
  name: 'Name', description: 'Description', url: 'Link', icon: 'Icon (image URL)', moveUp: 'Move up', moveDown: 'Move down', removeCard: 'Remove card',
  cancel: 'Cancel', save: 'Save', saving: 'Saving…', saved: 'Changes saved', saveError: 'Could not save changes',
})
const languages: { code: SupportedContentLocale; label: string }[] = [{ code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }]
const activeLanguage = ref<SupportedContentLocale>('fr')
const open = ref(false)
const draft = ref<RecommendationsContent>(structuredClone(props.content))
const editorPanel = ref<HTMLElement | null>(null)
const pageTitleInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const success = ref('')
const error = ref('')
const x = ref(0)
const y = ref(0)
let dragOffsetX = 0
let dragOffsetY = 0
const { isMaximized, panelStyle: positionStyle, panelClasses, prepareForOpen, captureNormalHeight, toggleMaximize } = useEditorPanelMaximize(editorPanel, x, y, open)

function openEditor() {
  prepareForOpen()
  draft.value = structuredClone(props.content)
  activeLanguage.value = locale.value === 'en' ? 'en' : 'fr'
  success.value = ''
  error.value = ''
  open.value = true
}

function close() {
  if (!saving.value) open.value = false
}

function startDrag(event: PointerEvent) {
  if (isMaximized.value || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  event.preventDefault()
  window.getSelection()?.removeAllRanges()
  dragOffsetX = event.clientX - x.value
  dragOffsetY = event.clientY - y.value
  window.addEventListener('pointermove', drag)
  window.addEventListener('pointerup', stopDrag, { once: true })
  window.addEventListener('pointercancel', stopDrag, { once: true })
}

function drag(event: PointerEvent) {
  const panel = editorPanel.value
  if (!panel) return

  const maxX = window.innerWidth - panel.offsetWidth - 8
  const maxY = window.innerHeight - panel.offsetHeight - 8
  x.value = Math.max(8, Math.min(maxX, event.clientX - dragOffsetX))
  y.value = Math.max(8, Math.min(maxY, event.clientY - dragOffsetY))
}

function stopDrag() {
  window.removeEventListener('pointermove', drag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

function addItem() {
  const id = `recommendation-${Date.now().toString(36)}`
  draft.value.items.push({ id, name: { fr: '', en: '' }, description: { fr: '', en: '' }, href: 'https://', icon: '' })
}

function removeItem(index: number) {
  draft.value.items.splice(index, 1)
}

function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= draft.value.items.length) return
  const [item] = draft.value.items.splice(index, 1)
  if (item) draft.value.items.splice(target, 0, item)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

function onPublicPageEditRequest(event: Event) {
  if (!props.isAdmin || !props.isEditMode) return
  if ((event as CustomEvent).detail !== 'recommendations') return
  openEditor()
}

async function save() {
  saving.value = true
  success.value = ''
  error.value = ''
  try {
    await $fetch('/api/admin/site-settings', { method: 'PUT', body: { recommendationsContent: draft.value } })
    emit('saved', structuredClone(draft.value))
    success.value = labels.value.saved
  } catch {
    error.value = labels.value.saveError
  } finally {
    saving.value = false
  }
}

watch(open, async (isOpen) => {
  if (!isOpen || !import.meta.client) return
  x.value = Math.max(16, window.innerWidth - 392)
  y.value = 88
  await nextTick()
  captureNormalHeight()
  pageTitleInput.value?.focus()
})

watch(() => props.isEditMode, (isEnabled) => {
  if (!isEnabled) close()
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener(PUBLIC_PAGE_EDIT_REQUEST_EVENT, onPublicPageEditRequest)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener(PUBLIC_PAGE_EDIT_REQUEST_EVENT, onPublicPageEditRequest)
  stopDrag()
})
</script>

<style scoped>
@layer components {
.recommendations-editor :deep(button:focus-visible),
.recommendations-editor input:focus-visible,
.recommendations-editor textarea:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 3px;
}
.recommendations-editor {
  position: fixed;
  z-index: 100;
  display: flex;
  width: min(24rem, calc(100vw - 2rem));
  max-height: min(46rem, calc(100dvh - 7rem));
  flex-direction: column;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-card);
  background: var(--site-color-surface);
  color: var(--site-color-text);
  height: var(--editor-panel-normal-height, auto);
}
.recommendations-editor.editor-panel--transition-ready {
  transition: left 520ms cubic-bezier(.2, .75, .25, 1), top 520ms cubic-bezier(.2, .75, .25, 1), width 520ms cubic-bezier(.2, .75, .25, 1), height 520ms cubic-bezier(.2, .75, .25, 1), max-height 520ms cubic-bezier(.2, .75, .25, 1), border-radius 300ms ease;
}
.recommendations-editor.editor-panel--spring-expanding { animation: editor-panel-spring-expand 620ms cubic-bezier(.2, .75, .25, 1) both; }
.recommendations-editor.editor-panel--spring-restoring { animation: editor-panel-spring-restore 620ms cubic-bezier(.2, .75, .25, 1) both; }
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
.recommendations-editor.editor-panel--maximized {
  border-radius: calc(var(--site-radius-card) * 1.2);
}
.recommendations-editor.editor-panel--maximized .recommendations-editor__body {
  min-height: 0;
  flex: 1 1 auto;
}
.recommendations-editor__header,
.recommendations-editor__footer,
.recommendations-editor__list-heading,
.recommendations-editor__item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--site-space-2);
}
.recommendations-editor__header,
.recommendations-editor__footer {
  padding: var(--site-space-4);
}
.recommendations-editor__header {
  border-bottom: 1px solid var(--site-color-border);
  cursor: move;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.recommendations-editor__header-actions {
  display: flex;
  align-items: center;
  gap: var(--site-space-1);
}
.recommendations-editor__footer { border-top: 1px solid var(--site-color-border); }
@media (prefers-reduced-motion: reduce) {
  .recommendations-editor.editor-panel--transition-ready { transition-duration: 0.01ms; }
  .recommendations-editor.editor-panel--spring-expanding,
  .recommendations-editor.editor-panel--spring-restoring { animation-duration: 0.01ms; }
}
.recommendations-editor__header h2,
.recommendations-editor__list-heading h3 {
  margin: 0;
  color: var(--site-color-heading);
  font-size: 1rem;
  font-weight: 550;
}
.recommendations-editor__body {
  display: grid;
  gap: var(--site-space-4);
  padding: var(--site-space-4);
  overflow-y: auto;
}
.recommendations-editor__body > label,
.recommendations-editor__item > label {
  display: grid;
  gap: var(--site-space-1);
  color: var(--site-color-text);
  font-size: 0.875rem;
}
.recommendations-editor input,
.recommendations-editor textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--site-color-border);
  border-radius: 0.625rem;
  background: var(--site-color-background);
  color: var(--site-color-text);
  font: inherit;
}
.recommendations-editor textarea { resize: vertical; }
.recommendations-editor__tabs { display: flex; gap: var(--site-space-2); }
.recommendations-editor__tabs button {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--site-color-border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--site-color-text);
  cursor: pointer;
}
.recommendations-editor__tabs button[aria-pressed="true"] {
  border-color: var(--site-color-heading);
  color: var(--site-color-heading);
}
.recommendations-editor__item {
  display: grid;
  gap: var(--site-space-3);
  padding: var(--site-space-3);
  border: 1px solid var(--site-color-border);
  border-radius: 0.75rem;
}
.recommendations-editor__item legend { padding-inline: 0.25rem; color: var(--site-color-heading); font-size: 0.875rem; }
.recommendations-editor__item-actions { justify-content: flex-end; }
.recommendations-editor__icon-preview { width: 2rem; height: 2rem; border-radius: 0.375rem; object-fit: contain; }
.recommendations-editor__message { margin: 0; color: var(--site-color-heading); font-size: 0.875rem; }
.recommendations-editor__message--error { color: var(--site-color-danger); }
}
</style>
