<template>
  <NDialog v-model:open="dialogOpen">
    <NDialogContent class="max-w-lg">
      <NDialogHeader>
        <NDialogTitle>{{ $ts('pages.postEditor.coverFromUrl') }}</NDialogTitle>
      </NDialogHeader>
      <p class="text-sm text-muted">{{ $ts('pages.postEditor.coverUrlHelp') }}</p>
      <label class="mt-4 block text-sm font-medium" for="cover-url">{{ $ts('pages.postEditor.coverUrlLabel') }}</label>
      <NInput id="cover-url" v-model="coverUrl" input="outline" type="url" :placeholder="$ts('pages.postEditor.coverUrlPlaceholder')" :disabled="importing" />
      <label class="mt-3 block text-sm font-medium" for="cover-alt">{{ $ts('pages.postEditor.coverAltLabel') }}</label>
      <NInput id="cover-alt" v-model="coverAlt" input="outline" :disabled="importing" />
      <p v-if="errorMessage" class="mt-3 text-sm text-red-600" role="alert">{{ errorMessage }}</p>
      <NDialogFooter class="mt-5 flex justify-end gap-2">
        <NButton btn="ghost-gray" size="sm" :disabled="importing" @click="dialogOpen = false">{{ $ts('pages.postEditor.cancel') }}</NButton>
        <NButton btn="solid-black" size="sm" :disabled="importing || !coverUrl.trim()" @click="importFromUrl">
          <span v-if="importing" class="i-lucide-loader animate-spin" aria-hidden />
          {{ $ts('pages.postEditor.importCover') }}
        </NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Post } from '~~/shared/types/post'
import { usePostsApi } from '~/composables/usePostsApi'

const props = defineProps<{ post: Post; identifier: string | number }>()
const emit = defineEmits<{ feedback: [kind: 'success' | 'error', message: string] }>()
const { $ts } = useI18n()
const { importCoverFromUrl } = usePostsApi()
const dialogOpen = ref(false)
const importing = ref(false)
const coverUrl = ref('')
const coverAlt = ref(props.post.image?.alt || props.post.name || '')
const errorMessage = ref('')

function open() {
  errorMessage.value = ''
  coverAlt.value = props.post.image?.alt || props.post.name || ''
  dialogOpen.value = true
}

async function importFromUrl() {
  errorMessage.value = ''
  importing.value = true
  try {
    const result = await importCoverFromUrl(props.identifier, coverUrl.value.trim(), coverAlt.value, props.post.image?.loop !== false)
    if (!props.post.image) props.post.image = { alt: '', ext: '', src: '' }
    Object.assign(props.post.image, result.image)
    coverUrl.value = ''
    dialogOpen.value = false
    emit('feedback', 'success', $ts('pages.postEditor.coverUploaded'))
  } catch (error) {
    const apiMessage = (error as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage
      || (error as { statusMessage?: string })?.statusMessage
    errorMessage.value = apiMessage || $ts('pages.postEditor.coverUploadFailed')
  } finally {
    importing.value = false
  }
}

defineExpose({ open })
</script>
