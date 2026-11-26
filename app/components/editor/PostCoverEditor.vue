<template>
  <div v-if="previewSrc || post.image?.src" class="site-preview-cover site-editor-cover group">
    <div class="post-cover site-preview-cover-trigger">
      <PostImage
        :src="displaySrc"
        :alt="post.image?.alt || post.name"
        :ext="displayExt"
        :loop="loop"
        :controls="isVideoCover"
        class="site-preview-cover-image"
      />
    </div>

    <div v-if="uploadingCover" class="site-editor-cover-progress">
      <div class="h-full bg-[var(--site-color-accent)] transition-all duration-300" :style="{ width: `${uploadProgress}%` }" />
    </div>

    <div class="site-editor-cover-actions">
      <NButton @click="triggerFileInput" btn="solid-white" size="xs" :disabled="uploadingCover" leading="i-ph-image">
        <span v-if="!uploadingCover">{{ $ts('pages.postEditor.replace') }}</span>
        <span v-else>{{ uploadProgress }}%</span>
      </NButton>
      <NButton v-if="post.image?.src" @click="$emit('delete-request')" btn="solid-white" size="xs" leading="i-ph-trash" class="text-red-500" :disabled="uploadingCover">
        {{ $ts('pages.postEditor.delete') }}
      </NButton>
      <NButton v-else-if="previewSrc && !uploadingCover" @click="clearPreview" btn="solid-white" size="xs" leading="i-ph-x">
        {{ $ts('pages.postEditor.cancel') }}
      </NButton>
    </div>

    <div v-if="isVideoCover" class="site-editor-cover-loop">
      <NCheckbox :model-value="loop" :disabled="loopSaving || uploadingCover" @update:model-value="saveLoop">
        {{ $ts('pages.postEditor.loopVideo') }}
      </NCheckbox>
    </div>
  </div>

  <input
    ref="fileInput"
    type="file"
    accept="image/jpeg,image/png,image/apng,image/gif,image/bmp,image/tiff,image/webp,image/avif,video/mp4,video/webm"
    class="hidden"
    :disabled="uploadingCover"
    @change="onFileChange"
  />

</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Post } from '~~/shared/types/post'
import { usePostImages } from '~/composables/usePostImages'

const props = defineProps<{ post: Post; identifier: string | number }>()
const emit = defineEmits<{
  'delete-request': []
  feedback: [kind: 'success' | 'error', message: string]
  uploading: [value: boolean]
}>()

const { $ts } = useI18n()
const { fileInput, uploadingCover, uploadProgress, previewSrc, previewExt, clearPreview, triggerFileInput, handleFileChange } = usePostImages(
  () => props.identifier,
  () => props.post,
)
const { updateCoverLoop } = usePostsApi()
const loop = ref(props.post.image?.loop !== false)
const loopSaving = ref(false)
const displaySrc = computed(() => previewSrc.value || props.post.image?.src || '')
const displayExt = computed(() => previewExt.value || props.post.image?.ext || '')
const isVideoCover = computed(() => ['mp4', 'webm'].includes(String(props.post.image?.ext || '').toLowerCase()))

watch(() => props.post.image?.loop, (value) => {
  loop.value = value !== false
})

watch(uploadingCover, value => emit('uploading', value))

function onFileChange(event: Event) {
  void handleFileChange(event).then(() => {
    if (props.post.image?.src) emit('feedback', 'success', $ts('pages.postEditor.coverUploaded'))
  }).catch((error: unknown) => {
    emit('feedback', 'error', error instanceof Error ? error.message : $ts('pages.postEditor.coverUploadFailed'))
  })
}

async function saveLoop(value: boolean | 'indeterminate') {
  if (typeof value !== 'boolean' || value === loop.value) return

  const previous = loop.value
  loop.value = value
  loopSaving.value = true
  try {
    const result = await updateCoverLoop(props.identifier, value)
    props.post.image.loop = result.loop
  } catch (error) {
    loop.value = previous
    emit('feedback', 'error', $ts('pages.postEditor.coverLoopFailed'))
  } finally {
    loopSaving.value = false
  }
}

defineExpose({ triggerFileInput })
</script>
