<template>
  <NButton
    v-if="isAdmin"
    btn="outline-gray"
    size="xs"
    leading="i-ph-pencil-simple"
    class="home-intro-edit-trigger"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="openEditor"
  >
    {{ labels.edit }}
  </NButton>

  <Teleport to="body">
    <section
      v-if="open"
      class="home-intro-editor"
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-intro-editor-title"
      :style="positionStyle"
    >
      <header class="home-intro-editor__header" @pointerdown="startDrag">
        <h2 id="home-intro-editor-title">{{ labels.title }}</h2>
        <NButton btn="ghost-gray" size="xs" icon label="i-lucide-x" :aria-label="labels.close" @click="close" />
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
        <label>
          <span>{{ labels.avatar }}</span>
          <span class="home-intro-editor__upload-row">
            <NButton btn="outline-gray" size="sm" leading="i-ph-upload-simple" :disabled="uploading || saving" @click="avatarFileInput?.click()">
              {{ uploading ? labels.uploading : labels.chooseImage }}
            </NButton>
            <span v-if="selectedFileName" class="home-intro-editor__filename">{{ selectedFileName }}</span>
          </span>
          <input ref="avatarFileInput" class="home-intro-editor__file-input" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" :disabled="uploading || saving" @change="uploadAvatar">
        </label>
        <img v-if="draft.avatar" class="home-intro-editor__preview" :src="draft.avatar" :alt="draft[activeLanguage].name">
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

const props = defineProps<{ identity: HomeIdentity; isAdmin: boolean }>()
const emit = defineEmits<{ saved: [identity: HomeIdentity] }>()

const { $getLocale } = useI18n()
const locale = computed(() => $getLocale() === 'en' ? 'en' : 'fr')
const labels = computed(() => locale.value === 'en' ? {
  edit: 'Edit introduction', title: 'Edit introduction', languages: 'Content language', close: 'Close',
  name: 'Name', description: 'Description', avatar: 'Profile image', chooseImage: 'Choose image', cancel: 'Cancel', save: 'Save',
  saving: 'Saving…', uploading: 'Uploading…', saved: 'Changes saved', uploadError: 'Image upload failed',
  saveError: 'Could not save changes',
} : {
  edit: 'Modifier l’introduction', title: 'Modifier l’introduction', languages: 'Langue du contenu', close: 'Fermer',
  name: 'Nom', description: 'Description', avatar: 'Photo de profil', chooseImage: 'Choisir une image', cancel: 'Annuler', save: 'Enregistrer',
  saving: 'Enregistrement…', uploading: 'Envoi…', saved: 'Modifications enregistrées', uploadError: 'Envoi de la photo impossible',
  saveError: 'Enregistrement impossible',
})
const languages = [{ code: 'fr' as const, label: 'FR' }, { code: 'en' as const, label: 'EN' }]
const open = ref(false)
const activeLanguage = ref<'fr' | 'en'>('fr')
const draft = ref<HomeIdentity>(structuredClone(props.identity))
const nameInput = ref<HTMLInputElement | null>(null)
const avatarFileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const saving = ref(false)
const uploading = ref(false)
const success = ref('')
const error = ref('')
const x = ref(0)
const y = ref(0)
let dragOffsetX = 0
let dragOffsetY = 0

const positionStyle = computed(() => ({ left: `${x.value}px`, top: `${y.value}px` }))

function openEditor() {
  draft.value = structuredClone(props.identity)
  activeLanguage.value = locale.value
  success.value = ''
  error.value = ''
  selectedFileName.value = ''
  open.value = true
}

function close() {
  if (saving.value || uploading.value) return
  open.value = false
}

function onContextMenu(event: Event) {
  if (!props.isAdmin) return
  event.preventDefault()
  openEditor()
}

function startDrag(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('button')) return
  dragOffsetX = event.clientX - x.value
  dragOffsetY = event.clientY - y.value
  window.addEventListener('pointermove', drag)
  window.addEventListener('pointerup', stopDrag, { once: true })
}

function drag(event: PointerEvent) {
  x.value = Math.max(8, Math.min(window.innerWidth - 360, event.clientX - dragOffsetX))
  y.value = Math.max(8, Math.min(window.innerHeight - 120, event.clientY - dragOffsetY))
}

function stopDrag() {
  window.removeEventListener('pointermove', drag)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
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
    selectedFileName.value = file.name
  } catch {
    error.value = labels.value.uploadError
  } finally {
    uploading.value = false
  }
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
  nameInput.value?.focus()
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.querySelector('.site-intro')?.addEventListener('contextmenu', onContextMenu)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.querySelector('.site-intro')?.removeEventListener('contextmenu', onContextMenu)
  stopDrag()
})
</script>

<style scoped>
@layer components {
.home-intro-edit-trigger {
  margin-block-end: var(--site-space-4);
}

.home-intro-edit-trigger:focus-visible,
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

.home-intro-editor__upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--site-space-3);
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
  max-width: 12rem;
  color: var(--site-color-muted);
  font-size: .8125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-intro-editor__preview {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: var(--site-radius-pill);
  object-fit: cover;
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
  .home-intro-editor {
    top: auto !important;
    right: 0;
    bottom: 0;
    left: 0 !important;
    width: 100%;
    max-height: 68dvh;
    border-radius: var(--site-radius-panel) var(--site-radius-panel) 0 0;
  }
}
}
</style>
