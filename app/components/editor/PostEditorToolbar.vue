<template>
  <div class="site-editor-toolbar">
    <div class="site-editor-toolbar-inner">
      <div class="flex items-center justify-between gap-2">
        <NButton link :to="localizedPath('/posts', $getLocale())" btn="ghost-gray" size="xs" class="site-editor-toolbar-back" :aria-label="$t('pages.postEditor.allPosts')">
          <span class="i-ph-arrow-bend-down-left-bold" /> <span class="hidden sm:inline">{{ $t('pages.postEditor.allPosts') }}</span>
        </NButton>
        <div class="flex items-center gap-1 md:gap-2">
          <NTooltip :content="undoTooltip">
            <span class="site-editor-tooltip-trigger">
              <NButton
                @click="$emit('undo')"
                :disabled="!canUndo"
                :aria-label="undoTooltip"
                icon
                label="i-ph-arrow-u-up-left-bold"
                btn="ghost-gray"
                size="xs"
                class="site-editor-tool-button"
              />
            </span>
          </NTooltip>
          <NTooltip :content="redoTooltip">
            <span class="site-editor-tooltip-trigger">
              <NButton
                @click="$emit('redo')"
                :disabled="!canRedo"
                :aria-label="redoTooltip"
                icon
                label="i-ph-arrow-u-up-right-bold"
                btn="ghost-gray"
                size="xs"
                class="site-editor-tool-button"
              />
            </span>
          </NTooltip>

          <NButton
            :to="localizedPath(`/posts/${postSlug}`, $getLocale())"
            btn="~"
            size="xs"
            class="site-editor-action site-editor-preview-button"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="$t('common.preview')"
          >
            <span class="i-lucide-external-link site-editor-preview-icon" aria-hidden="true" />
            <span class="site-editor-preview-label hidden sm:inline">{{ $t('common.preview') }}</span>
          </NButton>

          <div class="hidden sm:flex items-center gap-2">
            <NDropdownMenu :items="exportMenuItems" :_dropdownMenuContent="{ side: 'top', align: 'end', sideOffset: 8 }">
              <NButton btn="~" size="xs" class="site-editor-tool-button site-editor-tooltip-control" :aria-label="$t('pages.postEditor.exportOptions')" :data-tooltip="$t('pages.postEditor.exportOptions')">
                <NIcon :name="exportingZip ? 'i-lucide-loader' : 'i-ph-download-simple'" :class="{ 'animate-spin': exportingZip }" />
              </NButton>
            </NDropdownMenu>
          </div>

          <NButton @click="$emit('save')" btn="~" size="xs" :disabled="saving || !canSave" class="site-editor-save-button" :aria-label="$t(saving ? 'common.saving' : 'common.save')">
            <NIcon :name="saving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': saving }" />
            <span class="hidden sm:inline">{{ $t(saving ? 'common.saving' : 'common.save') }}</span>
          </NButton>
          <NDropdownMenu :items="menuItems" class="menu-items" :_dropdownMenuContent="{ side: 'top', align: 'end', sideOffset: 8 }">
            <NButton icon label="i-ph-dots-three-vertical" btn="~" size="xs" class="site-editor-tool-button site-editor-tooltip-control" :aria-label="$t('pages.postEditor.moreActions')" :data-tooltip="$t('pages.postEditor.moreActions')" />
          </NDropdownMenu>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { localizedPath } from '~/utils/presentationPosts'

type PostStatus = 'draft' | 'published' | 'archived'

interface EditorMenuItem {
  label: string
  leading?: string
  trailing?: string
  onSelect?: () => void
  items?: EditorMenuItem[]
}

const props = defineProps<{
  postSlug: string
  status: PostStatus
  languageOptions: { value: string; label: string }[]
  postLanguage: string
  hasCover: boolean
  uploadingCover: boolean
  exportingZip: boolean
  saving: boolean
  canSave: boolean
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  save: []
  'change-status': [status: PostStatus]
  'change-language': [language: string]
  'open-translations': []
  'edit-slug': []
  'delete-post': []
  'export-zip': []
  'export-json': []
  'replace-cover': []
  'delete-cover': []
}>()

const { $t, $getLocale } = useI18n()

const undoTooltip = computed(() => $t(props.canUndo ? 'pages.postEditor.undo' : 'pages.postEditor.undoEmpty'))
const redoTooltip = computed(() => $t(props.canRedo ? 'pages.postEditor.redo' : 'pages.postEditor.redoEmpty'))

const menuItems = computed<EditorMenuItem[]>(() => [
  {
    label: $t('pages.posts.status'),
    items: (['draft', 'published', 'archived'] as const).map(status => ({
      label: $t(`pages.posts.${status}`),
      trailing: props.status === status ? 'i-ph-check' : undefined,
      onSelect: () => emit('change-status', status),
    })),
  },
  {
    label: $t('common.language'),
    items: props.languageOptions.map(language => ({
      label: language.label,
      trailing: props.postLanguage === language.value ? 'i-ph-check' : undefined,
      onSelect: () => emit('change-language', language.value),
    })),
  },
  { label: $t('editor.translationsManager.title'), onSelect: () => emit('open-translations'), leading: 'i-ph-translate' },
  { label: $t('pages.postEditor.editSlug'), onSelect: () => emit('edit-slug') },
  { label: $t('common.deletePost'), onSelect: () => emit('delete-post') },
  {
    label: $t('pages.postEditor.exportZip'),
    onSelect: () => emit('export-zip'),
    leading: props.exportingZip ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-download-simple',
  },
  {
    label: $t('pages.posts.cover'),
    items: props.hasCover
      ? [
          { label: $t('pages.posts.replaceCover'), onSelect: () => emit('replace-cover'), leading: props.uploadingCover ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-image' },
          { label: $t('pages.posts.removeCover'), onSelect: () => emit('delete-cover'), leading: 'i-ph-trash' },
        ]
      : [{ label: $t('pages.posts.addCover'), onSelect: () => emit('replace-cover'), leading: 'i-ph-image' }],
  },
])

const exportMenuItems = computed<EditorMenuItem[]>(() => [
  { label: $t('pages.postEditor.exportJson'), onSelect: () => emit('export-json'), leading: 'i-ph-file-json' },
  {
    label: $t('pages.postEditor.exportZipAssets'),
    onSelect: () => emit('export-zip'),
    leading: props.exportingZip ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-download-simple',
  },
])
</script>
