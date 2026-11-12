<template>
  <Teleport to="body">
    <section
      v-if="open"
      ref="panel"
      class="home-post-section-editor"
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-post-section-editor-title"
      :style="positionStyle"
    >
      <header class="home-post-section-editor__header" @pointerdown="startDrag">
        <div>
          <p>{{ sectionLabel }}</p>
          <h2 id="home-post-section-editor-title">{{ labels.title }}</h2>
        </div>
        <NButton btn="ghost-gray" size="xs" icon label="i-lucide-x" :aria-label="labels.close" @click="close" />
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
          <legend>{{ labels.includeTags }}</legend>
          <div class="home-post-section-editor__choices">
            <label v-for="tag in availableTags" :key="`include-${tag.id}`">
              <input v-model="draft.includeTags" type="checkbox" :value="tag.name" :disabled="draft.excludeTags.includes(tag.name)">
              <span>{{ tag.name }}</span>
            </label>
          </div>
          <p>{{ labels.includeHint }}</p>
        </fieldset>

        <fieldset class="home-post-section-editor__filters">
          <legend>{{ labels.excludeTags }}</legend>
          <div class="home-post-section-editor__choices">
            <label v-for="tag in availableTags" :key="`exclude-${tag.id}`">
              <input v-model="draft.excludeTags" type="checkbox" :value="tag.name" :disabled="draft.includeTags.includes(tag.name)">
              <span>{{ tag.name }}</span>
            </label>
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
  title: 'Modifier la section', close: 'Fermer', languages: 'Langue du contenu', sectionTitle: 'Titre',
  includeTags: 'Inclure les tags', excludeTags: 'Exclure les tags', includeHint: 'Laisser vide pour afficher tous les articles admissibles.',
  match: 'Correspondance', matchAny: 'Au moins un tag', matchAll: 'Tous les tags', tagsUnavailable: 'Impossible de charger les tags.',
  cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement…', saved: 'Modifications enregistrées', saveError: 'Enregistrement impossible',
} : {
  section: props.section === 'featuredPosts' ? 'Featured posts' : 'The Journal',
  title: 'Edit section', close: 'Close', languages: 'Content language', sectionTitle: 'Title',
  includeTags: 'Include tags', excludeTags: 'Exclude tags', includeHint: 'Leave empty to show all otherwise eligible posts.',
  match: 'Match tags', matchAny: 'Any selected tag', matchAll: 'All selected tags', tagsUnavailable: 'Could not load tags.',
  cancel: 'Cancel', save: 'Save', saving: 'Saving…', saved: 'Changes saved', saveError: 'Could not save changes',
})
const sectionLabel = computed(() => labels.value.section)
const languages = [{ code: 'fr' as const, label: 'FR' }, { code: 'en' as const, label: 'EN' }]
const tagStore = useTagStore()
const availableTags = computed(() => [...tagStore.allTags].sort((a, b) => a.name.localeCompare(b.name)))
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
const positionStyle = computed(() => ({ left: `${x.value}px`, top: `${y.value}px` }))

function openEditor() {
  draft.value = structuredClone(props.content[props.section])
  activeLanguage.value = locale.value
  error.value = ''
  success.value = ''
  open.value = true
  if (!tagStore.allTags.length) void tagStore.fetchTags().catch(() => {})
}

function close() {
  if (!saving.value) open.value = false
}

function startDrag(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('button')) return
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
  if (event.key === 'Escape' && open.value) close()
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
  titleInput.value?.focus()
})

watch(() => props.isEditMode, isEnabled => { if (!isEnabled) close() })
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
}
.home-post-section-editor :deep(button:focus-visible),
.home-post-section-editor input:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
.home-post-section-editor__header,
.home-post-section-editor__footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.home-post-section-editor__header { border-bottom: 1px solid var(--site-color-border); cursor: move; }
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
.home-post-section-editor__choices { display: flex; max-height: 148px; flex-wrap: wrap; gap: 6px; overflow: auto; }
.home-post-section-editor__choices label { display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px; border: 1px solid var(--site-color-border); border-radius: 999px; color: var(--site-color-text); font-size: 12px; }
.home-post-section-editor__choices input,
.home-post-section-editor__match input { accent-color: var(--site-color-accent); }
.home-post-section-editor__filters p { margin: 7px 0 0; color: var(--site-color-muted); font-size: 11px; }
.home-post-section-editor__match { display: flex; flex-wrap: wrap; gap: 12px; margin: 0; padding: 0; border: 0; }
.home-post-section-editor__match legend { width: 100%; }
.home-post-section-editor__match label { display: inline-flex; align-items: center; gap: 5px; color: var(--site-color-text); font-size: 12px; }
.home-post-section-editor__message { margin: 0; color: var(--site-color-muted); font-size: 12px; }
.home-post-section-editor__message--error { color: var(--site-color-danger); }
.home-post-section-editor__footer { border-top: 1px solid var(--site-color-border); }
@media (max-width: 540px) {
  .home-post-section-editor { left: 8px !important; width: calc(100vw - 16px); max-height: calc(100vh - 16px); }
}
}
</style>
