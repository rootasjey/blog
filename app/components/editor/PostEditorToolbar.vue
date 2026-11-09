<template>
  <div class="site-editor-toolbar">
    <div class="site-editor-toolbar-inner">
      <div class="flex items-center justify-between gap-2">
        <NButton
          @click="$emit('view-post')"
          icon
          label="i-ph-eye"
          btn="ghost-gray"
          size="xs"
          class="site-editor-toolbar-back site-editor-tool-button site-editor-tooltip-control"
          :aria-label="$ts('common.preview')"
          :data-tooltip="$ts('common.preview')"
        >
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

          <div class="hidden sm:flex items-center gap-2">
            <NDropdownMenu :items="exportMenuItems" :_dropdownMenuContent="{ side: 'top', align: 'end', sideOffset: 8 }">
              <NButton btn="~" size="xs" class="site-editor-tool-button site-editor-tooltip-control" :aria-label="$ts('pages.postEditor.exportOptions')" :data-tooltip="$ts('pages.postEditor.exportOptions')">
                <NIcon :name="exportingZip ? 'i-lucide-loader' : 'i-ph-download-simple'" :class="{ 'animate-spin': exportingZip }" />
              </NButton>
            </NDropdownMenu>
          </div>

          <NDropdownMenu :items="menuItems" class="menu-items" :_dropdownMenuContent="{ side: 'top', align: 'end', sideOffset: 8 }">
            <NButton icon label="i-ph-dots-three-vertical" btn="~" size="xs" class="site-editor-tool-button site-editor-tooltip-control" :aria-label="$ts('pages.postEditor.moreActions')" :data-tooltip="$ts('pages.postEditor.moreActions')" />
          </NDropdownMenu>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PostStatus = 'draft' | 'published' | 'archived'

interface EditorMenuItem {
  label: string
  leading?: string
  trailing?: string
  onSelect?: () => void
  items?: EditorMenuItem[]
}

const props = defineProps<{
  status: PostStatus
  languageOptions: { value: string; label: string }[]
  postLanguage: string
  hasCover: boolean
  uploadingCover: boolean
  exportingZip: boolean
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  'view-post': []
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

const { $ts } = useI18n()

const undoTooltip = computed(() => $ts(props.canUndo ? 'pages.postEditor.undo' : 'pages.postEditor.undoEmpty'))
const redoTooltip = computed(() => $ts(props.canRedo ? 'pages.postEditor.redo' : 'pages.postEditor.redoEmpty'))

const menuItems = computed<EditorMenuItem[]>(() => [
  {
    label: $ts('pages.posts.status'),
    items: (['draft', 'published', 'archived'] as const).map(status => ({
      label: $ts(`pages.posts.${status}`),
      trailing: props.status === status ? 'i-ph-check' : undefined,
      onSelect: () => emit('change-status', status),
    })),
  },
  {
    label: $ts('common.language'),
    items: props.languageOptions.map(language => ({
      label: language.label,
      trailing: props.postLanguage === language.value ? 'i-ph-check' : undefined,
      onSelect: () => emit('change-language', language.value),
    })),
  },
  { label: $ts('editor.translationsManager.title'), onSelect: () => emit('open-translations'), leading: 'i-ph-translate' },
  { label: $ts('pages.postEditor.editSlug'), onSelect: () => emit('edit-slug') },
  { label: $ts('common.deletePost'), onSelect: () => emit('delete-post') },
  {
    label: $ts('pages.postEditor.exportZip'),
    onSelect: () => emit('export-zip'),
    leading: props.exportingZip ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-download-simple',
  },
  {
    label: $ts('pages.posts.cover'),
    items: props.hasCover
      ? [
          { label: $ts('pages.posts.replaceCover'), onSelect: () => emit('replace-cover'), leading: props.uploadingCover ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-image' },
          { label: $ts('pages.posts.removeCover'), onSelect: () => emit('delete-cover'), leading: 'i-ph-trash' },
        ]
      : [{ label: $ts('pages.posts.addCover'), onSelect: () => emit('replace-cover'), leading: 'i-ph-image' }],
  },
])

const exportMenuItems = computed<EditorMenuItem[]>(() => [
  { label: $ts('pages.postEditor.exportJson'), onSelect: () => emit('export-json'), leading: 'i-ph-file-json' },
  {
    label: $ts('pages.postEditor.exportZipAssets'),
    onSelect: () => emit('export-zip'),
    leading: props.exportingZip ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-download-simple',
  },
])
</script>
