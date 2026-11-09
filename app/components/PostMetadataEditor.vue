<template>
  <header class="site-post-header site-editor-metadata">
    <div class="container">
      <div>
        <nav class="site-preview-topic-nav site-editor-tags-wrap" :aria-label="$t('common.tags')">
          <span class="site-post-nav-spacer" aria-hidden="true" />
          <div class="site-editor-tags">
            <NBadge v-for="tag in localTags" :key="tag.id" badge="~" rounded="full" class="site-editor-tag" :style="{ '--editor-tag-color': postTagColor(tag.name, tag.color) }">
              <NLink :to="tagPath(tag.name)" class="site-editor-tag-link">{{ tag.name }}</NLink>
              <NTooltip>
                <template #content>
                  <span class="font-600 text-gray-300 dark:text-gray-600">{{ $t('common.removeTag') }}</span>
                </template>
                <button :aria-label="$t('common.removeTag')" @click="removeTag(tag.id)" :disabled="isAssigningTags" class="site-editor-tag-remove">
                  <NIcon name="i-ph-x-bold" size="3" />
                </button>
              </NTooltip>
            </NBadge>

            <NCombobox
              v-if="editingTagActive"
              v-model="selectedTag"
              :items="comboboxItems"
              by="id"
              value-key="id"
              label-key="name"
              v-model:open="comboboxOpen"
              :_combobox-input="{
                id: 'post-tag-search-input',
                placeholder: $t('editor.postMetadataEditor.searchTagPlaceholder'),
                modelValue: editingTagName,
                'onUpdate:modelValue': (v: string) => editingTagName = v,
                onKeydown: handleComboboxInputKeydown,
                autofocus: true,
              }"
              :_combobox-empty="{ class: 'py-2' }"
              size="xs"
              class="site-editor-tag-combobox"
            >
              <template #trigger>
                <span class="site-editor-add-tag">
                  <span>{{ selectedTag?.name || $t('editor.postMetadataEditor.addTag') }}</span>
                </span>
              </template>

              <template #label="{ item }">
                <div class="flex items-center gap-2">
                  <NIcon v-if="item.id === -1" name="i-ph-plus-circle" class="text-xs" />
                  <span class="uppercase font-semibold text-xs">{{ item.name }}</span>
                </div>
              </template>

              <template #empty>
                <div class="px-2">
                  <div v-if="isCreateActionAvailable" class="flex items-center">
                    <NButton
                      size="xs"
                      btn="ghost-gray"
                      class="w-full justify-start text-left focus:outline-none focus:bg-gray-300 dark:focus:bg-gray-800 focus:ring-0 focus:border-none"
                      :class="{ 'bg-gray-200 dark:bg-gray-800': isCreateActionHighlighted }"
                      tabindex="0"
                      @keydown="handleCreateButtonKeydown"
                      @click="addTagByName(trimmedEditingTagName)"
                    >
                      <NIcon name="i-ph-plus-circle" class="mr-2" />
                      <span class="uppercase font-semibold text-xs">{{ $t('editor.postMetadataEditor.createTag', { name: trimmedEditingTagName }) }}</span>
                    </NButton>
                  </div>
                  <div v-else class="px-3 text-sm text-slate-500">{{ $t('editor.postMetadataEditor.alreadyAdded') }}</div>
                </div>
              </template>
            </NCombobox>

            <template v-else>
              <NButton
                :icon="localTags.length > 0"
                rounded="full"
                size="xs"
                btn="ghost-gray"
                class="site-editor-add-tag-button"
                :class="{ 'h-6 w-6': localTags.length > 0 }"
                @click="startNewTag"
                :aria-label="$t('editor.postMetadataEditor.addTag')"
              >
                <NIcon name="i-ph-plus-bold" />
                <span v-if="localTags.length === 0">{{ $t('editor.postMetadataEditor.addTag') }}</span>
              </NButton>
            </template>
          </div>
          <span class="site-post-nav-spacer" aria-hidden="true" />
        </nav>

        <textarea
          ref="nameInput"
          v-model="nameProxy"
          rows="1"
          class="site-editor-title w-full resize-none overflow-hidden bg-transparent outline-none focus:outline-none focus:ring-0"
          :placeholder="$t('editor.postMetadataEditor.untitled')"
          @input="autoResize"
        />

        <NInput
          v-model="descriptionProxy"
          type="textarea"
          input="~"
          :placeholder="$t('editor.postMetadataEditor.descriptionPlaceholder')"
          class="site-editor-description post-summary max-w-3xl description-input"
          :rows="1"
          ref="descriptionInput"
          @input="autoResizeDescription"
          @focus="autoResizeDescription"
        />

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTagStore } from '~/stores/tags'
import type { ApiTag } from '~~/shared/types/tags'
import { postTagColor } from '~/utils/postTagColor'
import { localizedPath } from '~/utils/presentationPosts'
const { $t, $getLocale } = useI18n()
const tagPath = (name: string) => `${localizedPath('/tags', $getLocale())}?tag=${encodeURIComponent(name)}`

interface Props {
  name: string
  description: string
  postId?: number | null
  tags: ApiTag[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:tags': [value: ApiTag[]]
}>()

const tagStore = useTagStore()

const nameProxy = computed({
  get: () => props.name,
  set: (val: string) => emit('update:name', val),
})

const descriptionProxy = computed({
  get: () => props.description,
  set: (val: string) => emit('update:description', val),
})

const localTags = ref<ApiTag[]>(props.tags || [])
watch(() => props.tags, (tags) => { localTags.value = tags || [] })

const nameInput = ref<HTMLTextAreaElement | null>(null)
const descriptionInput = ref<any | null>(null)
let editorFieldsResizeObserver: ResizeObserver | null = null
const editingTagActive = ref(false)
const editingTagName = ref('')
const isAssigningTags = ref(false)
const selectedTag = ref<ApiTag | null>(null)
const comboboxOpen = ref(false)

const focusTagSearchInput = () => {
  const input = document.getElementById('post-tag-search-input')
  if (input instanceof HTMLInputElement) input.focus()
}

const filteredTagSuggestions = computed(() => {
  const query = (editingTagName.value || '').trim()
  if (!query) return tagStore.allTags.filter(t => !localTags.value.some(pt => pt.id === t.id))
  return tagStore.searchTags(query).filter(t => !localTags.value.some(pt => pt.id === t.id))
})

const comboboxItems = computed(() => {
  const suggestions = filteredTagSuggestions.value
  const query = (editingTagName.value || '').trim()
  
  // If there's a query and no exact match, add "Create new" option only when suggestions exist
  if (query && !tagStore.findTagByName(query) && suggestions.length > 0) {
    return [
      ...suggestions,
      { id: -1, name: `Create "${query}"` }
    ]
  }
  
  return suggestions
})

const trimmedEditingTagName = computed(() => (editingTagName.value || '').trim())
const isCreateActionAvailable = computed(() => {
  const query = trimmedEditingTagName.value
  return !!query && !tagStore.findTagByName(query) && filteredTagSuggestions.value.length === 0
})

const isCreateActionHighlighted = ref(false)

const handleComboboxInputKeydown = (evt: KeyboardEvent) => {
  if (!isCreateActionAvailable.value) return

  if (evt.key === 'Enter') {
    evt.preventDefault()
    addTagByName(trimmedEditingTagName.value)
    return
  }

  if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
    evt.preventDefault()
    isCreateActionHighlighted.value = !isCreateActionHighlighted.value
  }
}

const handleCreateButtonKeydown = (evt: KeyboardEvent) => {
  if (!isCreateActionAvailable.value) return
  if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
    evt.preventDefault()
    isCreateActionHighlighted.value = false
    const rootEl = (evt.currentTarget as HTMLElement | null)?.closest('[data-slot="combobox"]')
    const inputEl = rootEl?.querySelector('input') as HTMLInputElement | null
    inputEl?.focus()
  }
}

watch(isCreateActionAvailable, (isAvailable) => {
  if (!isAvailable) {
    isCreateActionHighlighted.value = false
  }
})

const addTagByName = async (name: string) => {
  if (!props.postId || !name) return
  isAssigningTags.value = true
  try {
    let tag = tagStore.findTagByName(name)
    if (!tag) {
      const created = await tagStore.createTag(name)
      if (!created) throw new Error('Failed to create tag')
      tag = created
    }
    const tagIds = Array.from(new Set([...localTags.value.map(t => t.id), tag.id]))
    const assigned = await tagStore.assignPostTags(props.postId as number, tagIds)
    localTags.value = assigned
    emit('update:tags', assigned)
    // Keep combobox active so users can add more tags quickly
    editingTagName.value = ''
    selectedTag.value = null
    isCreateActionHighlighted.value = false
    comboboxOpen.value = true
    await nextTick()
    focusTagSearchInput()
  } finally {
    isAssigningTags.value = false
  }
} 

const addTag = async (tag: ApiTag | undefined | null) => {
  if (!props.postId || !tag) return
  isAssigningTags.value = true
  try {
    const tagIds = Array.from(new Set([...localTags.value.map(t => t.id), tag.id]))
    const assigned = await tagStore.assignPostTags(props.postId as number, tagIds)
    localTags.value = assigned
    emit('update:tags', assigned)
    // Keep combobox active to allow adding more tags
    editingTagName.value = ''
    selectedTag.value = null
    isCreateActionHighlighted.value = false
    comboboxOpen.value = true
    await nextTick()
    focusTagSearchInput()
  } finally {
    isAssigningTags.value = false
  }
}

const removeTag = async (tagId: number) => {
  if (!props.postId) return
  isAssigningTags.value = true
  try {
    const tagIds = localTags.value.filter(t => t.id !== tagId).map(t => t.id)
    const assigned = await tagStore.assignPostTags(props.postId as number, tagIds)
    localTags.value = assigned
    emit('update:tags', assigned)
  } finally {
    isAssigningTags.value = false
  }
}

const startNewTag = async () => {
  editingTagActive.value = true
  editingTagName.value = ''
  selectedTag.value = null
  // Ensure tags are loaded so the create option shows even when there are no items yet
  await tagStore.initialize()
  comboboxOpen.value = true
  await nextTick()
}

const cancelNewTag = () => {
  editingTagActive.value = false
  editingTagName.value = ''
  selectedTag.value = null
  comboboxOpen.value = false
}

// Watch for tag selection from combobox
watch(selectedTag, async (tag) => {
  if (!tag) return
  
  if (tag.id === -1) {
    // Create new tag from the typed name
    const query = editingTagName.value.replace(/^Create "/, '').replace(/"$/, '')
    if (query) {
      await addTagByName(query)
    }
  } else {
    // Add existing tag
    await addTag(tag)
  }
})

// Watch for combobox close without selection
watch(comboboxOpen, (isOpen) => {
  if (!isOpen && !selectedTag.value && editingTagActive.value) {
    // Combobox closed without selection - just cancel
    cancelNewTag()
  }
})

const autoResize = (evt?: Event | null) => {
  let el: HTMLTextAreaElement | null = null
  if (evt) el = evt.target as HTMLTextAreaElement
  else el = nameInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const getDescriptionTextarea = (): HTMLTextAreaElement | null => {
  const rootEl: HTMLElement | null = (descriptionInput.value as any)?.$el ?? descriptionInput.value
  if (rootEl instanceof HTMLTextAreaElement) return rootEl
  return rootEl?.querySelector('textarea') ?? null
}

const autoResizeDescription = (evt?: Event | null) => {
  let el: HTMLTextAreaElement | null = null
  if (evt) el = evt.target as HTMLTextAreaElement
  if (!el) el = getDescriptionTextarea()
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(() => props.description, async () => {
  await nextTick()
  autoResizeDescription()
})

watch(() => props.name, async () => {
  await nextTick()
  autoResize()
})

onMounted(async () => {
  await nextTick()
  autoResize()
  autoResizeDescription()

  const fields = [nameInput.value, getDescriptionTextarea()].filter((field): field is HTMLTextAreaElement => !!field)
  const widths = new WeakMap<HTMLTextAreaElement, number>()
  fields.forEach(field => widths.set(field, field.getBoundingClientRect().width))

  editorFieldsResizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const field = entry.target as HTMLTextAreaElement
      const width = entry.contentRect.width
      if (!width || Math.abs(width - (widths.get(field) ?? 0)) < 0.5) continue

      widths.set(field, width)
      if (field === nameInput.value) autoResize()
      if (field === getDescriptionTextarea()) autoResizeDescription()
    }
  })
  fields.forEach(field => editorFieldsResizeObserver?.observe(field))
})

onBeforeUnmount(() => editorFieldsResizeObserver?.disconnect())
</script>
