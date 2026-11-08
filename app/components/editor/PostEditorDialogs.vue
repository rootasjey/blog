<template>
  <NDialog v-model:open="translationsOpen" dialog="md">
    <NDialogContent>
      <NDialogHeader>
        <NDialogTitle>{{ $t('editor.translationsManager.title') }}</NDialogTitle>
      </NDialogHeader>
      <TranslationsManager
        :post-id="postId"
        :current-language="currentLanguage"
        @translation-created="$emit('translation-created', $event)"
      />
    </NDialogContent>
  </NDialog>

  <NDialog v-model:open="translateOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ $t('pages.postEditor.translateSelection') }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ $t('pages.postEditor.translateDescription') }}</p>
      </NDialogDescription>

      <div class="mt-4 space-y-3">
        <div class="text-sm font-semibold flex items-center gap-2">
          <span class="i-lucide-languages" />
          <span>{{ $t('pages.postEditor.sourceLanguage') }}</span>
        </div>
        <div class="text-sm text-slate-600 dark:text-slate-400">{{ sourceLanguageLabel }}</div>

        <label class="text-sm font-semibold flex items-center gap-2" for="translate-target">
          <span class="i-lucide-flag" />
          <span>{{ $t('pages.postEditor.targetLanguage') }}</span>
        </label>
        <select
          id="translate-target"
          v-model="translateTargetLanguage"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--site-color-focus-ring)]"
        >
          <option
            v-for="option in languageOptions"
            :key="option.value"
            :value="option.value"
            :disabled="option.value === sourceLanguage"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-5">
        <NButton btn="ghost-gray" size="sm" :disabled="aiLoading" @click="$emit('cancel-translate')">
          {{ $t('pages.postEditor.cancel') }}
        </NButton>
        <NButton btn="solid-black" size="sm" :disabled="aiLoading" @click="$emit('confirm-translate')">
          {{ $t('pages.postEditor.translate') }}
        </NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>

  <NDialog v-model:open="deletePostOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ $t('common.deletePost') }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('pages.postEditor.deletePostConfirm') }}</p>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="deletePostOpen = false">
          {{ $t('pages.postEditor.cancel') }}
        </NButton>
        <NButton btn="solid-red" size="sm" :loading="deletePostLoading" @click="$emit('confirm-delete-post')">
          {{ $t('pages.postEditor.delete') }}
        </NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>

  <NDialog v-model:open="deleteCoverOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ $t('pages.postEditor.removeCoverTitle') }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('pages.postEditor.removeCoverConfirm') }}</p>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="deleteCoverOpen = false">
          {{ $t('pages.postEditor.cancel') }}
        </NButton>
        <NButton btn="solid-red" size="sm" :loading="deleteCoverLoading" @click="$emit('confirm-delete-cover')">
          {{ $t('pages.postEditor.delete') }}
        </NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
interface LanguageOption {
  value: string
  label: string
}

defineProps<{
  postId: number
  currentLanguage: string
  languageOptions: LanguageOption[]
  sourceLanguage: string
  sourceLanguageLabel: string
  aiLoading: boolean
  deletePostLoading: boolean
  deleteCoverLoading: boolean
}>()

const translationsOpen = defineModel<boolean>('translationsOpen', { required: true })
const translateOpen = defineModel<boolean>('translateOpen', { required: true })
const translateTargetLanguage = defineModel<string>('translateTargetLanguage', { required: true })
const deletePostOpen = defineModel<boolean>('deletePostOpen', { required: true })
const deleteCoverOpen = defineModel<boolean>('deleteCoverOpen', { required: true })

defineEmits<{
  'translation-created': [postId: number]
  'confirm-translate': []
  'cancel-translate': []
  'confirm-delete-post': []
  'confirm-delete-cover': []
}>()
</script>
