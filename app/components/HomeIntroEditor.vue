<template>
  <Teleport to="body">
    <section
      v-if="open"
      ref="panel"
      class="home-intro-editor"
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-intro-editor-title"
      :class="panelClasses"
      :style="positionStyle"
    >
      <header class="home-intro-editor__header" @pointerdown="startDrag">
        <h2 id="home-intro-editor-title">{{ labels.title }}</h2>
        <div class="home-intro-editor__header-actions">
          <NButton btn="ghost-gray" size="xs" icon :label="isMaximized ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" :aria-label="isMaximized ? labels.restore : labels.maximize" :title="isMaximized ? labels.restore : labels.maximize" @click="toggleMaximize" />
          <NButton btn="ghost-gray" size="xs" icon label="i-lucide-x" :aria-label="labels.close" @click="close" />
        </div>
      </header>

      <div class="home-intro-editor__body">
        <div class="home-intro-editor__tabs" role="group" :aria-label="labels.languages">
          <button
            v-for="language in languages"
            :key="language.code"
            type="button"
            :aria-pressed="activeLanguage === language.code"
            @click="activeLanguage = language.code"
          >{{ language.label }}</button>
        </div>

        <label>
          <span>{{ labels.name }}</span>
          <input ref="nameInput" v-model="draft[activeLanguage].name" maxlength="100" autocomplete="off">
        </label>
        <label>
          <span>{{ labels.description }}</span>
          <textarea v-model="draft[activeLanguage].description" rows="7" maxlength="4000" />
        </label>
        <div class="home-intro-editor__avatar-field">
          <span class="home-intro-editor__field-label">{{ labels.avatar }}</span>
          <div
            class="home-intro-editor__avatar-control"
            :class="{ 'home-intro-editor__avatar-control--drag-over': isAvatarDragOver }"
            @dragover="onAvatarDragOver"
            @dragleave="onAvatarDragLeave"
            @drop.prevent="onAvatarDrop"
          >
            <button
              type="button"
              class="home-intro-editor__preview-trigger"
              :aria-label="labels.changeImage"
              :disabled="uploading || saving"
              @click="avatarFileInput?.click()"
            >
              <img v-if="avatarPreview" class="home-intro-editor__preview" :src="avatarPreview" alt="">
              <span v-else class="home-intro-editor__preview home-intro-editor__preview--empty" aria-hidden="true">
                <NIcon name="i-ph-user-circle" />
              </span>
            </button>
            <div class="home-intro-editor__avatar-details">
              <span class="home-intro-editor__filename" :title="selectedFileName || labels.currentImage">
                {{ selectedFileName || labels.currentImage }}
              </span>
              <NButton btn="outline-gray" size="sm" leading="i-ph-upload-simple" :disabled="uploading || saving" @click="avatarFileInput?.click()">
                {{ uploading ? labels.uploading : selectedFileName ? labels.replaceImage : labels.changeImage }}
              </NButton>
            </div>
            <input
              ref="avatarFileInput"
              class="home-intro-editor__file-input"
              type="file"
              :aria-label="labels.changeImage"
              accept="image/jpeg,image/png,image/webp"
              tabindex="-1"
              :disabled="uploading || saving"
              @change="uploadAvatar"
            >
          </div>
        </div>
        <p v-if="error" class="home-intro-editor__message home-intro-editor__message--error" role="alert">{{ error }}</p>
        <p v-if="success" class="home-intro-editor__message" role="status">{{ success }}</p>
      </div>

      <footer class="home-intro-editor__footer">
        <NButton btn="ghost-gray" size="sm" :disabled="saving || uploading" @click="close">{{ labels.cancel }}</NButton>
        <NButton btn="solid-black" size="sm" :loading="saving || uploading" :disabled="saving || uploading" @click="save">
          {{ saving ? labels.saving : uploading ? labels.uploading : labels.save }}
        </NButton>
      </footer>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { HomeIdentity } from '~~/shared/types/home-identity'
import { PUBLIC_PAGE_EDIT_REQUEST_EVENT } from '~/utils/publicPageEditRequests'
import { useEditorPanelMaximize } from '~/composables/useEditorPanelMaximize'

const props = defineProps<{ identity: HomeIdentity; isAdmin: boolean; isEditMode: boolean }>()
const emit = defineEmits<{ saved: [identity: HomeIdentity] }>()
const acceptedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxAvatarBytes = 8 * 1024 * 1024

const { $getLocale } = useI18n()
const locale = computed(() => $getLocale() === 'en' ? 'en' : 'fr')
const labels = computed(() => locale.value === 'en' ? {
  title: 'Edit introduction', languages: 'Content language', close: 'Close', maximize: 'Maximize', restore: 'Restore',
  name: 'Name', description: 'Description', avatar: 'Profile image', currentImage: 'Current profile photo', changeImage: 'Change image', replaceImage: 'Replace image', cancel: 'Cancel', save: 'Save',
  saving: 'Saving…', uploading: 'Uploading…', saved: 'Changes saved', uploadError: 'Image upload failed',
  dropImage: 'Drop an image to replace the current photo', invalidImageType: 'Choose a JPEG, PNG, or WebP image.', imageTooLarge: 'Image must be 8 MB or smaller.',
  saveError: 'Could not save changes',
} : {
  title: 'Modifier l’introduction', languages: 'Langue du contenu', close: 'Fermer', maximize: 'Agrandir', restore: 'Restaurer',
  name: 'Nom', description: 'Description', avatar: 'Photo de profil', currentImage: 'Photo actuelle', changeImage: 'Changer l’image', replaceImage: 'Remplacer l’image', cancel: 'Annuler', save: 'Enregistrer',
  saving: 'Enregistrement…', uploading: 'Envoi…', saved: 'Modifications enregistrées', uploadError: 'Envoi de la photo impossible',
  dropImage: 'Dépose l’image pour remplacer la photo actuelle', invalidImageType: 'Choisis une image JPEG, PNG ou WebP.', imageTooLarge: 'L’image doit faire 8 Mo ou moins.',
  saveError: 'Enregistrement impossible',
})
const languages = [{ code: 'fr' as const, label: 'FR' }, { code: 'en' as const, label: 'EN' }]
const open = ref(false)
const panel = ref<HTMLElement | null>(null)
const activeLanguage = ref<'fr' | 'en'>('fr')
const draft = ref<HomeIdentity>(structuredClone(props.identity))
const localAvatarPreview = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const avatarFileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const saving = ref(false)
const uploading = ref(false)
const success = ref('')
const error = ref('')
const isAvatarDragOver = ref(false)
const x = ref(0)
const y = ref(0)
let dragOffsetX = 0
let dragOffsetY = 0

const { isMaximized, panelStyle: positionStyle, panelClasses, prepareForOpen, captureNormalHeight, toggleMaximize } = useEditorPanelMaximize(panel, x, y, open)
const avatarPreview = computed(() => localAvatarPreview.value || draft.value.avatar)

function openEditor() {
  prepareForOpen()
  draft.value = structuredClone(props.identity)
  activeLanguage.value = locale.value
  success.value = ''
  error.value = ''
  selectedFileName.value = ''
  open.value = true
}

function close() {
  if (saving.value || uploading.value) return
  stopDrag()
  open.value = false
}

function startDrag(event: PointerEvent) {
  if (isMaximized.value || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
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
  window.removeEventListener('pointermove', drag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

function onPublicPageEditRequest(event: Event) {
  if (!props.isAdmin || !props.isEditMode) return
  if ((event as CustomEvent).detail !== 'home-intro') return
  openEditor()
}

function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  void uploadAvatarFile(file)
}

function onAvatarDragOver(event: DragEvent) {
  if (!event.dataTransfer || !Array.from(event.dataTransfer.types).includes('Files')) return
  event.preventDefault()
  if (uploading.value || saving.value) return
  event.dataTransfer.dropEffect = 'copy'
  isAvatarDragOver.value = true
}

function onAvatarDragLeave(event: DragEvent) {
  const dropZone = event.currentTarget
  const nextTarget = event.relatedTarget
  if (dropZone instanceof HTMLElement && nextTarget instanceof Node && dropZone.contains(nextTarget)) return
  isAvatarDragOver.value = false
}

function onAvatarDrop(event: DragEvent) {
  isAvatarDragOver.value = false
  if (uploading.value || saving.value) return

  const files = Array.from(event.dataTransfer?.files ?? [])
  const file = files.find(candidate => acceptedAvatarTypes.includes(candidate.type))
  if (!file) {
    error.value = labels.value.invalidImageType
    return
  }

  void uploadAvatarFile(file)
}

async function uploadAvatarFile(file: File) {
  if (uploading.value || saving.value) return
  if (!acceptedAvatarTypes.includes(file.type)) {
    error.value = labels.value.invalidImageType
    return
  }
  if (file.size > maxAvatarBytes) {
    error.value = labels.value.imageTooLarge
    return
  }

  const previousFileName = selectedFileName.value
  clearLocalAvatarPreview()
  localAvatarPreview.value = URL.createObjectURL(file)
  selectedFileName.value = file.name
  uploading.value = true
  error.value = ''
  success.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const result = await $fetch<{ data?: { src?: string } }>('/api/admin/site-settings/home-avatar', { method: 'POST', body })
    const src = result.data?.src
    if (!src) throw new Error(labels.value.uploadError)
    draft.value.avatar = src
    clearLocalAvatarPreview()
  } catch {
    clearLocalAvatarPreview()
    selectedFileName.value = previousFileName
    error.value = labels.value.uploadError
  } finally {
    uploading.value = false
  }
}

function clearLocalAvatarPreview() {
  if (!localAvatarPreview.value) return
  URL.revokeObjectURL(localAvatarPreview.value)
  localAvatarPreview.value = ''
}

async function save() {
  saving.value = true
  success.value = ''
  error.value = ''
  try {
    await $fetch('/api/admin/site-settings', { method: 'PUT', body: { homeIdentity: draft.value } })
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
  x.value = Math.max(16, window.innerWidth - 368)
  y.value = 88
  await nextTick()
  const element = panel.value
  if (element) {
    x.value = Math.max(8, Math.min(window.innerWidth - element.offsetWidth - 8, x.value))
    y.value = Math.max(8, Math.min(window.innerHeight - element.offsetHeight - 8, y.value))
  }
  captureNormalHeight()
  nameInput.value?.focus()
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
  clearLocalAvatarPreview()
  stopDrag()
})
</script>

<style scoped>
@layer components {
.home-intro-editor :deep(button:focus-visible),
.home-intro-editor input:focus-visible,
.home-intro-editor textarea:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 3px;
}

.home-intro-editor {
  position: fixed;
  z-index: 100;
  display: flex;
  width: min(22rem, calc(100vw - 2rem));
  max-height: min(42rem, calc(100dvh - 7rem));
  flex-direction: column;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-card);
  background: var(--site-color-surface);
  color: var(--site-color-text);
  height: var(--editor-panel-normal-height, auto);
}

.home-intro-editor.editor-panel--transition-ready {
  transition: left 520ms cubic-bezier(.2, .75, .25, 1), top 520ms cubic-bezier(.2, .75, .25, 1), width 520ms cubic-bezier(.2, .75, .25, 1), height 520ms cubic-bezier(.2, .75, .25, 1), max-height 520ms cubic-bezier(.2, .75, .25, 1), border-radius 300ms ease;
}

.home-intro-editor.editor-panel--spring-expanding { animation: editor-panel-spring-expand 620ms cubic-bezier(.2, .75, .25, 1) both; }
.home-intro-editor.editor-panel--spring-restoring { animation: editor-panel-spring-restore 620ms cubic-bezier(.2, .75, .25, 1) both; }

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

.home-intro-editor.editor-panel--maximized {
  border-radius: var(--site-radius-card);
}

.home-intro-editor.editor-panel--maximized .home-intro-editor__body {
  min-height: 0;
  flex: 1 1 auto;
}

.home-intro-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--site-space-3);
  padding: var(--site-space-4);
  border-bottom: 1px solid var(--site-color-border);
  cursor: move;
  touch-action: none;
}

.home-intro-editor__header-actions {
  display: flex;
  align-items: center;
  gap: var(--site-space-1);
}

.home-intro-editor__header h2 {
  margin: 0;
  color: var(--site-color-heading);
  font-size: 1rem;
  font-weight: 550;
}

.home-intro-editor__body {
  display: grid;
  gap: var(--site-space-4);
  padding: var(--site-space-4);
  overflow-y: auto;
}

.home-intro-editor__tabs {
  display: flex;
  border-bottom: 1px solid var(--site-color-border);
}

.home-intro-editor__tabs button {
  flex: 1;
  min-height: 44px;
  padding: var(--site-space-2);
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--site-color-muted);
  font: inherit;
  cursor: pointer;
}

.home-intro-editor__tabs button[aria-pressed='true'] {
  border-bottom-color: var(--site-color-accent);
  color: var(--site-color-heading);
}

.home-intro-editor__body label {
  display: grid;
  gap: var(--site-space-2);
  color: var(--site-color-text);
  font-size: .875rem;
}

.home-intro-editor__body input:not([type='file']),
.home-intro-editor__body textarea {
  box-sizing: border-box;
  width: 100%;
  padding: var(--site-space-3);
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  background: var(--site-color-background);
  color: var(--site-color-text);
  font: inherit;
}

.home-intro-editor__body textarea {
  resize: vertical;
}

.home-intro-editor__avatar-field {
  display: grid;
  gap: var(--site-space-2);
  color: var(--site-color-text);
  font-size: .875rem;
}

.home-intro-editor__avatar-control {
  display: flex;
  align-items: center;
  gap: var(--site-space-3);
  min-width: 0;
  padding: var(--site-space-3);
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  background: var(--site-color-background);
}

.home-intro-editor__avatar-control--drag-over {
  border-style: dashed;
  border-color: var(--site-color-accent);
  background: var(--site-color-hover-background);
}

.home-intro-editor__preview-trigger {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 3.5rem;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--site-radius-pill);
  background: transparent;
  cursor: pointer;
  transition: transform 150ms ease;
}

.home-intro-editor__preview-trigger:hover:not(:disabled) {
  transform: scale(1.04);
}

.home-intro-editor__preview-trigger:disabled {
  cursor: not-allowed;
}

.home-intro-editor__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.home-intro-editor__filename {
  overflow: hidden;
  max-width: 100%;
  color: var(--site-color-muted);
  font-size: .8125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-intro-editor__avatar-details {
  display: grid;
  min-width: 0;
  gap: var(--site-space-2);
}

.home-intro-editor__preview {
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 3.5rem;
  border-radius: var(--site-radius-pill);
  object-fit: cover;
}

.home-intro-editor__preview--empty {
  display: grid;
  place-items: center;
  background: var(--site-color-hover-background);
  color: var(--site-color-muted);
  font-size: 1.5rem;
}

.home-intro-editor__message {
  margin: 0;
  color: var(--site-color-tag-green);
  font-size: .875rem;
}

.home-intro-editor__message--error {
  color: var(--site-color-danger);
}

.home-intro-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--site-space-2);
  padding: var(--site-space-3) var(--site-space-4);
  border-top: 1px solid var(--site-color-border);
}

@media (max-width: 640px) {
  .home-intro-editor:not(.editor-panel--maximized) {
    top: auto !important;
    right: 0;
    bottom: 0;
    left: 0 !important;
    width: 100%;
    max-height: 68dvh;
    border-radius: var(--site-radius-panel) var(--site-radius-panel) 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-intro-editor.editor-panel--transition-ready { transition-duration: 0.01ms; }
  .home-intro-editor.editor-panel--spring-expanding,
  .home-intro-editor.editor-panel--spring-restoring { animation-duration: 0.01ms; }
}
}
</style>
