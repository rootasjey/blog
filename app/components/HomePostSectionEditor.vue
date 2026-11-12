<template>
  <Teleport to="body">
    <section
      v-if="open"
      ref="panel"
      class="home-post-section-editor"
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-post-section-editor-title"
      :class="panelClasses"
      :style="positionStyle"
    >
      <header class="home-post-section-editor__header" @pointerdown="startDrag">
        <div>
          <p>{{ sectionLabel }}</p>
          <h2 id="home-post-section-editor-title">{{ labels.title }}</h2>
        </div>
        <div class="home-post-section-editor__header-actions">
          <NButton btn="ghost-gray" size="xs" icon :label="isMaximized ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" :aria-label="isMaximized ? labels.restore : labels.maximize" :title="isMaximized ? labels.restore : labels.maximize" @click="toggleMaximize" />
          <NButton btn="ghost-gray" size="xs" icon label="i-lucide-x" :aria-label="labels.close" @click="close" />
        </div>
      </header>

      <div class="home-post-section-editor__body">
        <div class="home-post-section-editor__tabs" role="group" :aria-label="labels.languages">
          <button v-for="language in languages" :key="language.code" type="button" :aria-pressed="activeLanguage === language.code" @click="activeLanguage = language.code">
            {{ language.label }}
          </button>
        </div>

        <label class="home-post-section-editor__field">
          <span>{{ labels.sectionTitle }}</span>
          <input ref="titleInput" v-model="draft.title[activeLanguage]" maxlength="100">
        </label>

        <fieldset class="home-post-section-editor__filters">
          <legend>{{ labels.includeTags }} <span>({{ draft.includeTags.length }})</span></legend>
          <div class="home-post-section-editor__selected-tags">
            <span v-for="tag in draft.includeTags" :key="`included-${tag}`" class="home-post-section-editor__tag-chip">
              <span :title="tag">{{ tag }}</span>
              <button type="button" :aria-label="labels.removeIncludedTag(tag)" @click="removeTag('include', tag)">
                <NIcon name="i-ph-x" aria-hidden="true" />
              </button>
            </span>
          </div>
          <div class="home-post-section-editor__tag-filter">
            <input
              v-model="tagSearch.include"
              type="search"
              :placeholder="labels.searchTags"
              :aria-label="labels.searchIncludedTags"
              :aria-expanded="activePicker === 'include' && Boolean(tagSearch.include.trim() || activeOptionIndex >= 0)"
              :aria-activedescendant="activePicker === 'include' ? activeOptionId : undefined"
              aria-controls="home-section-include-tag-options"
              @focus="activateTagPicker('include')"
              @input="activeOptionIndex = -1"
              @keydown="onTagSearchKeydown($event, 'include')"
            >
            <ul v-if="activePicker === 'include' && (tagSearch.include.trim() || activeOptionIndex >= 0)" id="home-section-include-tag-options" class="home-post-section-editor__tag-options" role="listbox" :aria-label="labels.includeTags">
              <li v-for="(tag, index) in filteredTagOptions" :key="tag.id">
                <button :id="`home-section-include-tag-option-${index}`" type="button" role="option" :tabindex="-1" :aria-selected="activeOptionIndex === index" :class="{ 'is-active': activeOptionIndex === index }" @mousedown.prevent @click="selectTag('include', tag.name)">{{ tag.name }}</button>
              </li>
              <li v-if="!filteredTagOptions.length" class="home-post-section-editor__tag-empty" role="presentation">{{ labels.noMatchingTag }}</li>
            </ul>
          </div>
          <p>{{ labels.includeHint }}</p>
        </fieldset>

        <fieldset class="home-post-section-editor__filters">
          <legend>{{ labels.excludeTags }} <span>({{ draft.excludeTags.length }})</span></legend>
          <div class="home-post-section-editor__selected-tags">
            <span v-for="tag in draft.excludeTags" :key="`excluded-${tag}`" class="home-post-section-editor__tag-chip">
              <span :title="tag">{{ tag }}</span>
              <button type="button" :aria-label="labels.removeExcludedTag(tag)" @click="removeTag('exclude', tag)">
                <NIcon name="i-ph-x" aria-hidden="true" />
              </button>
            </span>
          </div>
          <div class="home-post-section-editor__tag-filter">
            <input
              v-model="tagSearch.exclude"
              type="search"
              :placeholder="labels.searchTags"
              :aria-label="labels.searchExcludedTags"
              :aria-expanded="activePicker === 'exclude' && Boolean(tagSearch.exclude.trim() || activeOptionIndex >= 0)"
              :aria-activedescendant="activePicker === 'exclude' ? activeOptionId : undefined"
              aria-controls="home-section-exclude-tag-options"
              @focus="activateTagPicker('exclude')"
              @input="activeOptionIndex = -1"
              @keydown="onTagSearchKeydown($event, 'exclude')"
            >
            <ul v-if="activePicker === 'exclude' && (tagSearch.exclude.trim() || activeOptionIndex >= 0)" id="home-section-exclude-tag-options" class="home-post-section-editor__tag-options" role="listbox" :aria-label="labels.excludeTags">
              <li v-for="(tag, index) in filteredTagOptions" :key="tag.id">
                <button :id="`home-section-exclude-tag-option-${index}`" type="button" role="option" :tabindex="-1" :aria-selected="activeOptionIndex === index" :class="{ 'is-active': activeOptionIndex === index }" @mousedown.prevent @click="selectTag('exclude', tag.name)">{{ tag.name }}</button>
              </li>
              <li v-if="!filteredTagOptions.length" class="home-post-section-editor__tag-empty" role="presentation">{{ labels.noMatchingTag }}</li>
            </ul>
          </div>
        </fieldset>

        <fieldset v-if="draft.includeTags.length > 1" class="home-post-section-editor__match">
          <legend>{{ labels.match }}</legend>
          <label><input v-model="draft.tagMatch" type="radio" value="any"> {{ labels.matchAny }}</label>
          <label><input v-model="draft.tagMatch" type="radio" value="all"> {{ labels.matchAll }}</label>
        </fieldset>

        <p v-if="tagStore.error" class="home-post-section-editor__message" role="status">{{ labels.tagsUnavailable }}</p>
        <p v-if="error" class="home-post-section-editor__message home-post-section-editor__message--error" role="alert">{{ error }}</p>
        <p v-if="success" class="home-post-section-editor__message" role="status">{{ success }}</p>
      </div>

      <footer class="home-post-section-editor__footer">
        <NButton btn="ghost-gray" size="sm" :disabled="saving" @click="close">{{ labels.cancel }}</NButton>
        <NButton btn="solid-black" size="sm" :loading="saving" :disabled="saving" @click="save">{{ saving ? labels.saving : labels.save }}</NButton>
      </footer>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditorPanelMaximize } from '~/composables/useEditorPanelMaximize'
import type { HomePostSectionConfig, HomePostSectionKey, HomePostSectionsContent } from '~~/shared/types/home-post-sections'
import { PUBLIC_PAGE_EDIT_REQUEST_EVENT } from '~/utils/publicPageEditRequests'

const props = defineProps<{
  section: HomePostSectionKey
  content: HomePostSectionsContent
  isAdmin: boolean
  isEditMode: boolean
}>()
const emit = defineEmits<{ saved: [content: HomePostSectionsContent] }>()

const { $getLocale } = useI18n()
const locale = computed(() => $getLocale() === 'en' ? 'en' : 'fr')
const labels = computed(() => locale.value === 'fr' ? {
  section: props.section === 'featuredPosts' ? 'Articles à la une' : 'Le journal',
  title: 'Modifier la section', close: 'Fermer', maximize: 'Agrandir', restore: 'Restaurer', languages: 'Langue du contenu', sectionTitle: 'Titre',
  includeTags: 'Inclure les tags', excludeTags: 'Exclure les tags', includeHint: 'Laisser vide pour afficher tous les articles admissibles.',
  searchTags: 'Rechercher et ajouter un tag…', searchIncludedTags: 'Rechercher un tag à inclure', searchExcludedTags: 'Rechercher un tag à exclure',
  noMatchingTag: 'Aucun tag correspondant', removeIncludedTag: (tag: string) => `Retirer le tag inclus ${tag}`, removeExcludedTag: (tag: string) => `Retirer le tag exclu ${tag}`,
  match: 'Correspondance', matchAny: 'Au moins un tag', matchAll: 'Tous les tags', tagsUnavailable: 'Impossible de charger les tags.',
  cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement…', saved: 'Modifications enregistrées', saveError: 'Enregistrement impossible',
} : {
  section: props.section === 'featuredPosts' ? 'Featured posts' : 'The Journal',
  title: 'Edit section', close: 'Close', maximize: 'Maximize', restore: 'Restore', languages: 'Content language', sectionTitle: 'Title',
  includeTags: 'Include tags', excludeTags: 'Exclude tags', includeHint: 'Leave empty to show all otherwise eligible posts.',
  searchTags: 'Search and add a tag…', searchIncludedTags: 'Search tags to include', searchExcludedTags: 'Search tags to exclude',
  noMatchingTag: 'No matching tags', removeIncludedTag: (tag: string) => `Remove included tag ${tag}`, removeExcludedTag: (tag: string) => `Remove excluded tag ${tag}`,
  match: 'Match tags', matchAny: 'Any selected tag', matchAll: 'All selected tags', tagsUnavailable: 'Could not load tags.',
  cancel: 'Cancel', save: 'Save', saving: 'Saving…', saved: 'Changes saved', saveError: 'Could not save changes',
})
const sectionLabel = computed(() => labels.value.section)
const languages = [{ code: 'fr' as const, label: 'FR' }, { code: 'en' as const, label: 'EN' }]
const tagStore = useTagStore()
const availableTags = computed(() => [...tagStore.allTags].sort((a, b) => a.name.localeCompare(b.name)))
const tagSearch = ref({ include: '', exclude: '' })
const activePicker = ref<'include' | 'exclude' | null>(null)
const filteredTagOptions = computed(() => {
  if (!activePicker.value) return []
  const alreadyUsed = new Set([...draft.value.includeTags, ...draft.value.excludeTags].map(normalizeTag))
  const query = normalizeTag(tagSearch.value[activePicker.value])
  return availableTags.value.filter((tag) => {
    if (alreadyUsed.has(normalizeTag(tag.name))) return false
    return !query || normalizeTag(tag.name).includes(query)
  }).slice(0, 12)
})
const activeOptionIndex = ref(-1)
const activeOptionId = computed(() => {
  if (!activePicker.value || activeOptionIndex.value < 0 || !filteredTagOptions.value[activeOptionIndex.value]) return undefined
  return `home-section-${activePicker.value}-tag-option-${activeOptionIndex.value}`
})
const open = ref(false)
const activeLanguage = ref<'fr' | 'en'>('fr')
const draft = ref<HomePostSectionConfig>(structuredClone(props.content[props.section]))
const panel = ref<HTMLElement | null>(null)
const titleInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const success = ref('')
const error = ref('')
const x = ref(0)
const y = ref(0)
let dragOffsetX = 0
let dragOffsetY = 0
const { isMaximized, panelStyle: positionStyle, panelClasses, prepareForOpen, captureNormalHeight, toggleMaximize } = useEditorPanelMaximize(panel, x, y, open)

function openEditor() {
  prepareForOpen()
  draft.value = structuredClone(props.content[props.section])
  tagSearch.value = { include: '', exclude: '' }
  activePicker.value = null
  activeOptionIndex.value = -1
  activeLanguage.value = locale.value
  error.value = ''
  success.value = ''
  open.value = true
  if (!tagStore.allTags.length) void tagStore.fetchTags().catch(() => {})
}

function close() {
  if (saving.value) return
  activePicker.value = null
  activeOptionIndex.value = -1
  open.value = false
}

function normalizeTag(tag: string) {
  return tag.trim().toLocaleLowerCase()
}

function selectTag(mode: 'include' | 'exclude', tag: string) {
  const current = mode === 'include' ? draft.value.includeTags : draft.value.excludeTags
  if (current.some(item => normalizeTag(item) === normalizeTag(tag))) return

  if (mode === 'include') draft.value.includeTags = [...draft.value.includeTags, tag]
  else draft.value.excludeTags = [...draft.value.excludeTags, tag]
  tagSearch.value[mode] = ''
  activeOptionIndex.value = -1
}

function activateTagPicker(mode: 'include' | 'exclude') {
  activePicker.value = mode
  activeOptionIndex.value = -1
}

function onTagSearchKeydown(event: KeyboardEvent, mode: 'include' | 'exclude') {
  if (event.key === 'Escape') {
    const hasOpenList = activePicker.value === mode && Boolean(tagSearch.value[mode].trim() || activeOptionIndex.value >= 0)
    activePicker.value = null
    activeOptionIndex.value = -1
    if (hasOpenList) {
      event.preventDefault()
      event.stopPropagation()
    }
    return
  }

  if (activePicker.value !== mode) activateTagPicker(mode)

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const options = filteredTagOptions.value
    if (!options.length) return

    event.preventDefault()
    const lastIndex = options.length - 1
    const movingDown = event.key === 'ArrowDown'
    if (movingDown) {
      activeOptionIndex.value = activeOptionIndex.value < 0 ? 0 : (activeOptionIndex.value + 1) % options.length
    } else {
      activeOptionIndex.value = activeOptionIndex.value < 0 ? lastIndex : (activeOptionIndex.value - 1 + options.length) % options.length
    }

    void nextTick(() => {
      if (activeOptionId.value) document.getElementById(activeOptionId.value)?.scrollIntoView({ block: 'nearest' })
    })
    return
  }

  if (event.key !== 'Enter') return
  const hasOpenList = Boolean(tagSearch.value[mode].trim() || activeOptionIndex.value >= 0)
  if (!hasOpenList) return
  event.preventDefault()
  const tag = filteredTagOptions.value[activeOptionIndex.value] ?? filteredTagOptions.value[0]
  if (tag) selectTag(mode, tag.name)
}

function removeTag(mode: 'include' | 'exclude', tag: string) {
  if (mode === 'include') draft.value.includeTags = draft.value.includeTags.filter(item => item !== tag)
  else draft.value.excludeTags = draft.value.excludeTags.filter(item => item !== tag)
}

function onOutsideTagPicker(event: PointerEvent) {
  if (!activePicker.value) return
  const target = event.target
  if (target instanceof Element && target.closest('.home-post-section-editor__tag-filter')) return
  activePicker.value = null
  activeOptionIndex.value = -1
}

function startDrag(event: PointerEvent) {
  if (isMaximized.value || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  event.preventDefault()
  dragOffsetX = event.clientX - x.value
  dragOffsetY = event.clientY - y.value
  window.addEventListener('pointermove', drag)
  window.addEventListener('pointerup', stopDrag, { once: true })
  window.addEventListener('pointercancel', stopDrag, { once: true })
}

function drag(event: PointerEvent) {
  const element = panel.value
  if (!element) return
  x.value = Math.max(8, Math.min(window.innerWidth - element.offsetWidth - 8, event.clientX - dragOffsetX))
  y.value = Math.max(8, Math.min(window.innerHeight - element.offsetHeight - 8, event.clientY - dragOffsetY))
}

function stopDrag() {
  window.removeEventListener('pointermove', drag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

function onPublicPageEditRequest(event: Event) {
  if (!props.isAdmin || !props.isEditMode) return
  if ((event as CustomEvent).detail !== `home-section:${props.section}`) return
  openEditor()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !open.value) return
  if (activePicker.value) {
    activePicker.value = null
    return
  }
  close()
}

async function save() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const content = { ...props.content, [props.section]: structuredClone(draft.value) }
    await $fetch('/api/admin/site-settings', { method: 'PUT', body: { homePostSections: content } })
    emit('saved', content)
    success.value = labels.value.saved
  } catch {
    error.value = labels.value.saveError
  } finally {
    saving.value = false
  }
}

watch(open, async (isOpen) => {
  if (!isOpen || !import.meta.client) return
  x.value = Math.max(16, window.innerWidth - 410)
  y.value = 88
  await nextTick()
  const panelHeight = panel.value?.offsetHeight ?? 0
  y.value = Math.min(y.value, Math.max(8, window.innerHeight - panelHeight - 8))
  captureNormalHeight()
  titleInput.value?.focus()
})

watch(() => props.isEditMode, isEnabled => { if (!isEnabled) close() })
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onOutsideTagPicker)
  window.addEventListener(PUBLIC_PAGE_EDIT_REQUEST_EVENT, onPublicPageEditRequest)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onOutsideTagPicker)
  window.removeEventListener(PUBLIC_PAGE_EDIT_REQUEST_EVENT, onPublicPageEditRequest)
  stopDrag()
})
</script>

<style scoped>
@layer components {
.home-post-section-editor {
  position: fixed;
  z-index: 110;
  display: flex;
  width: min(392px, calc(100vw - 16px));
  max-height: min(760px, calc(100vh - 16px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--site-color-border);
  border-radius: 14px;
  background: var(--site-color-surface);
  color: var(--site-color-text);
  box-shadow: 0 18px 54px rgb(0 0 0 / 34%);
  height: var(--editor-panel-normal-height, auto);
}
.home-post-section-editor.editor-panel--transition-ready {
  transition: left 520ms cubic-bezier(.2, .75, .25, 1), top 520ms cubic-bezier(.2, .75, .25, 1), width 520ms cubic-bezier(.2, .75, .25, 1), height 520ms cubic-bezier(.2, .75, .25, 1), max-height 520ms cubic-bezier(.2, .75, .25, 1), border-radius 300ms ease;
}
.home-post-section-editor.editor-panel--spring-expanding { animation: editor-panel-spring-expand 620ms cubic-bezier(.2, .75, .25, 1) both; }
.home-post-section-editor.editor-panel--spring-restoring { animation: editor-panel-spring-restore 620ms cubic-bezier(.2, .75, .25, 1) both; }
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
.home-post-section-editor.editor-panel--maximized { border-radius: 16px; }
.home-post-section-editor.editor-panel--maximized .home-post-section-editor__body { min-height: 0; flex: 1 1 auto; }
.home-post-section-editor :deep(button:focus-visible),
.home-post-section-editor input:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
.home-post-section-editor__header,
.home-post-section-editor__footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.home-post-section-editor__header { border-bottom: 1px solid var(--site-color-border); cursor: move; }
.home-post-section-editor__header-actions { display: flex; align-items: center; gap: 4px; }
.home-post-section-editor__header p { margin: 0 0 4px; color: var(--site-color-accent); font-size: 11px; font-weight: 650; letter-spacing: .1em; text-transform: uppercase; }
.home-post-section-editor__header h2 { margin: 0; color: var(--site-color-heading); font-size: 17px; font-weight: 550; }
.home-post-section-editor__body { display: grid; gap: 16px; overflow-y: auto; padding: 16px; }
.home-post-section-editor__tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--site-color-border); }
.home-post-section-editor__tabs button { min-width: 58px; padding: 8px 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--site-color-muted); }
.home-post-section-editor__tabs button[aria-pressed='true'] { border-color: var(--site-color-focus-ring); color: var(--site-color-heading); }
.home-post-section-editor__field { display: grid; gap: 6px; color: var(--site-color-muted); font-size: 13px; }
.home-post-section-editor__field input { min-width: 0; padding: 10px 12px; border: 1px solid var(--site-color-border); border-radius: 8px; background: transparent; color: var(--site-color-text); font: inherit; }
.home-post-section-editor__filters { min-width: 0; margin: 0; padding: 0; border: 0; }
.home-post-section-editor__filters legend,
.home-post-section-editor__match legend { margin-bottom: 8px; color: var(--site-color-heading); font-size: 14px; font-weight: 550; }
.home-post-section-editor__filters legend span { margin-left: 4px; color: var(--site-color-muted); font-size: 12px; font-weight: 450; }
.home-post-section-editor__selected-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.home-post-section-editor__tag-chip {
  display: inline-flex;
  max-width: 100%;
  min-height: 30px;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 10px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-tag);
  background: var(--site-color-hover-background);
  color: var(--site-color-text);
  font-size: 12px;
}
.home-post-section-editor__tag-chip > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-post-section-editor__tag-chip button { display: grid; width: 24px; height: 24px; flex: 0 0 24px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: var(--site-color-muted); cursor: pointer; }
.home-post-section-editor__tag-chip button:hover { background: var(--site-color-surface); color: var(--site-color-heading); }
.home-post-section-editor__tag-filter { position: relative; }
.home-post-section-editor__tag-filter > input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 9px 11px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  background: var(--site-color-background);
  color: var(--site-color-text);
  font: inherit;
  font-size: 13px;
}
.home-post-section-editor__tag-filter > input::placeholder { color: var(--site-color-muted); }
.home-post-section-editor__tag-options {
  position: absolute;
  z-index: 3;
  inset: calc(100% + 4px) 0 auto;
  max-height: 176px;
  margin: 0;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  background: var(--site-color-surface);
  box-shadow: 0 10px 28px rgb(0 0 0 / 24%);
  list-style: none;
  scrollbar-color: var(--site-color-border) transparent;
  scrollbar-width: thin;
}
.home-post-section-editor__tag-options button {
  width: 100%;
  min-height: 36px;
  overflow: hidden;
  padding: 7px 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--site-color-text);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.home-post-section-editor__tag-options button:hover,
.home-post-section-editor__tag-options button:focus-visible,
.home-post-section-editor__tag-options button.is-active { outline: none; background: var(--site-color-hover-background); color: var(--site-color-heading); }
.home-post-section-editor__tag-empty { padding: 8px 9px; color: var(--site-color-muted); font-size: 12px; }
.home-post-section-editor__match input { width: 16px; height: 16px; flex: 0 0 16px; margin: 0; accent-color: var(--site-color-accent); }
.home-post-section-editor__filters p { margin: 8px 0 0; color: var(--site-color-muted); font-size: 11px; line-height: 1.5; }
.home-post-section-editor__match { display: flex; flex-wrap: wrap; gap: 12px; margin: 0; padding: 0; border: 0; }
.home-post-section-editor__match legend { width: 100%; }
.home-post-section-editor__match label { display: inline-flex; align-items: center; gap: 5px; color: var(--site-color-text); font-size: 12px; }
.home-post-section-editor__message { margin: 0; color: var(--site-color-muted); font-size: 12px; }
.home-post-section-editor__message--error { color: var(--site-color-danger); }
.home-post-section-editor__footer { border-top: 1px solid var(--site-color-border); }
@media (max-width: 540px) {
  .home-post-section-editor:not(.editor-panel--maximized) { left: 8px !important; width: calc(100vw - 16px); max-height: calc(100vh - 16px); }
}
@media (prefers-reduced-motion: reduce) {
  .home-post-section-editor.editor-panel--transition-ready { transition-duration: 0.01ms; }
  .home-post-section-editor.editor-panel--spring-expanding,
  .home-post-section-editor.editor-panel--spring-restoring { animation-duration: 0.01ms; }
}
}
</style>
