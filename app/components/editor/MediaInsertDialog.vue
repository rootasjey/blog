<template>
  <NDialog v-model:open="dialogOpen" placement="center">
    <template #content>
      <div class="media-insert-dialog">
        <h2 class="text-lg font-semibold mb-4">Insert {{ mediaType === 'audio' ? 'Audio' : 'Video' }}</h2>
        
        <!-- Tab selection -->
        <div class="tabs mb-4 flex gap-2 border-b border-border pb-2">
          <button 
            :class="['tab', activeTab === 'upload' && 'active']" 
            @click="activeTab = 'upload'"
          >
            <span class="i-lucide-upload mr-1" />Upload
          </button>
          <button 
            :class="['tab', activeTab === 'link' && 'active']" 
            @click="activeTab = 'link'"
          >
            <span class="i-lucide-link mr-1" />Link
          </button>
        </div>

        <!-- Upload tab -->
        <div v-if="activeTab === 'upload'" class="upload-section">
          <button
            type="button"
            :class="['drop-zone', isDragging && 'dragging']"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @click="triggerFileInput"
          >
            <span class="i-lucide-file-audio text-4xl mb-2" v-if="mediaType === 'audio'" />
            <span class="i-lucide-film text-4xl mb-2" v-else />
            <span class="text-sm">Drag & drop {{ mediaType === 'audio' ? 'audio' : 'video' }} file here</span>
            <span class="text-xs text-muted mt-1">or click to browse</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            :accept="mediaType === 'audio' ? 'audio/*' : 'video/*'"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            @change="handleFileSelected"
          />
        </div>

        <!-- Link tab -->
        <div v-if="activeTab === 'link'" class="link-section">
          <NInput 
            v-model="linkUrl" 
            input="outline"
            placeholder="https://example.com/media.mp3" 
            class="mb-3"
            @keyup.enter="insertLink"
          />
          <div class="flex gap-2 justify-end">
            <NButton btn="soft-gray" @click="dialogOpen = false">Cancel</NButton>
            <NButton btn="solid-gray" @click="insertLink" class="min-w-100px" :disabled="!linkUrl.trim()">Insert</NButton>
          </div>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  open: boolean
  mediaType: 'audio' | 'video'
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'update:open': [value: boolean]
  'insert': [files: File[]]
  'insertLink': [url: string]
}>()

const dialogOpen = ref(props.open)
const activeTab = ref<'upload' | 'link'>('upload')
const isDragging = ref(false)
const linkUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.open, (v) => { 
  dialogOpen.value = v
  if (v) {
    activeTab.value = 'upload'
    linkUrl.value = ''
  }
})

watch(dialogOpen, (v) => emits('update:open', v))

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) {
    emits('insert', files)
    dialogOpen.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length > 0) {
    emits('insert', files)
    dialogOpen.value = false
  }
}

function insertLink() {
  const url = linkUrl.value.trim()
  if (url) {
    emits('insertLink', url)
    dialogOpen.value = false
  }
}
</script>

<style scoped>
@layer components {

.media-insert-dialog {
  min-width: 400px;
  padding: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--site-color-muted);
  transition: color 160ms ease, border-color 160ms ease;
}

.tab.active {
  color: var(--site-color-accent);
  border-bottom-color: var(--site-color-accent);
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed var(--site-color-border);
  border-radius: var(--site-radius-control);
  background: var(--site-color-background);
  color: var(--site-color-text);
  font: inherit;
  text-align: center;
  width: 100%;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.drop-zone:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 3px;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--site-color-accent);
  background: color-mix(in srgb, var(--site-color-accent) 8%, var(--site-color-background));
}

.link-section {
  padding: 1rem 0;
}
}
</style>
