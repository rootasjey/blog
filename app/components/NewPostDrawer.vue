<template>
  <!-- Render a bottom drawer on small screens, and a centered dialog on desktop -->
  <template v-if="!isDesktop">
    <NDrawer v-model:open="open" placement="bottom" class="site-new-content-drawer">
      <template #header>
        <div class="site-new-content-mobile-header">
          <h3 class="site-new-content-title">{{ creationTitle }}</h3>
          <NDrawerClose />
        </div>
      </template>

      <template #body>
        <div class="site-new-content-body">
          <div class="site-new-content-form">
            <label class="site-new-content-field">
              <span>{{ $t('components.editPostDialog.titleLabel') }}</span>
              <NInput v-model="name" :placeholder="$t('components.newPostDrawer.titlePlaceholder')" input="outline" />
            </label>

            <label class="site-new-content-field">
              <span>{{ $t('components.editPostDialog.descriptionLabel') }}</span>
              <NInput
                v-model="description"
                type="textarea"
                :rows="4"
                :placeholder="$t('components.newPostDrawer.descriptionPlaceholder')"
                input="outline"
              />
            </label>

            <label class="site-new-content-field">
              <span>{{ $t('common.tags') }}</span>
              <NInput v-model="tagsText" :placeholder="$t('components.newPostDrawer.tagsPlaceholder')" input="outline" />
            </label>

            <div v-if="assignedTag" class="site-new-content-assigned">
              <span>{{ $t('components.newPostDrawer.assignedTag') }}</span>
              <span class="site-new-content-assigned-tag">{{ assignedTag }}</span>
            </div>

            <div class="site-new-content-footer">
              <span class="site-new-content-shortcut">⌘↵</span>
              <NButton @click="close" btn="ghost-gray" class="site-new-content-cancel">{{ $t('common.cancel') }}</NButton>
              <NButton :disabled="!name || creating" @click="create" btn="primary" class="site-new-content-submit" title="Cmd/Ctrl + Enter">
                <NIcon :name="creating ? 'i-lucide-loader' : 'i-lucide-plus'" :class="{ 'animate-spin': creating }" />
                <span>{{ $t('common.create') }}</span>
              </NButton>
            </div>
          </div>
        </div>
      </template>
    </NDrawer>
  </template>

  <template v-else>
    <NDialog v-model:open="open">
      <NDialogContent class="site-new-content-dialog max-w-xl">
        <NDialogHeader>
          <NDialogTitle class="site-new-content-title">{{ creationTitle }}</NDialogTitle>
        </NDialogHeader>

        <div class="site-new-content-form">
          <label class="site-new-content-field">
            <span>{{ $t('components.editPostDialog.titleLabel') }}</span>
            <NInput v-model="name" :placeholder="$t('components.newPostDrawer.titlePlaceholder')" input="outline" autofocus />
          </label>

          <label class="site-new-content-field">
            <span>{{ $t('components.editPostDialog.descriptionLabel') }}</span>
            <NInput
              v-model="description"
              type="textarea"
              :rows="4"
              :placeholder="$t('components.newPostDrawer.descriptionPlaceholder')"
              input="outline"
            />
          </label>

          <label class="site-new-content-field">
            <span>{{ $t('common.tags') }}</span>
            <NInput v-model="tagsText" :placeholder="$t('components.newPostDrawer.tagsPlaceholder')" input="outline" />
          </label>

          <div v-if="assignedTag" class="site-new-content-assigned">
            <span>{{ $t('components.newPostDrawer.assignedTag') }}</span>
            <span class="site-new-content-assigned-tag">{{ assignedTag }}</span>
          </div>

          <NDialogFooter class="site-new-content-footer">
            <span class="site-new-content-shortcut">⌘↵</span>
            <NButton @click="close" btn="ghost-gray" class="site-new-content-cancel">{{ $t('common.cancel') }}</NButton>
            <NButton :disabled="!name || creating" @click="create" btn="primary" class="site-new-content-submit" title="Cmd/Ctrl + Enter">
              <NIcon :name="creating ? 'i-lucide-loader' : 'i-lucide-plus'" :class="{ 'animate-spin': creating }" />
              <span>{{ $t('common.create') }}</span>
            </NButton>
          </NDialogFooter>
        </div>
      </NDialogContent>
    </NDialog>
  </template>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const { $t } = useI18n()
const props = defineProps({ modelValue: { type: Boolean, default: false }, defaultTag: { type: String, required: false } })
const emit = defineEmits(['update:modelValue', 'created'])

const open = ref(props.modelValue)
watch(() => props.modelValue, (v) => (open.value = v))
watch(open, (v) => emit('update:modelValue', v))

const name = ref('')
const description = ref('')
const tagsText = ref('')
const creating = ref(false)

const onKeydown = (e: KeyboardEvent) => {
  if (!open.value) return
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    if (!creating.value && name.value) create()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const router = useRouter()
const toast = useToast()

// Detect desktop (>= 1024px) to show dialog instead of drawer
const isDesktop = useMediaQuery('(min-width: 1024px)')

const close = () => {
  open.value = false
}

const assignedTag = computed(() => props.defaultTag ? props.defaultTag.trim() : '')
const isProjectCreation = computed(() => assignedTag.value.toLowerCase() === 'project')
const creationTitle = computed(() => $t(isProjectCreation.value ? 'pages.projects.newProject' : 'pages.posts.newPost'))

const create = async () => {
  if (!name.value) return
  creating.value = true
  try {
    let tags = tagsText.value
      ? tagsText.value.split(',').map((t) => ({ name: t.trim() })).filter((t) => t.name)
      : undefined

    // Ensure defaultTag is included (no duplicates), if provided
    if (props.defaultTag) {
      const desired = props.defaultTag.trim()
      if (desired) {
        const currentNames = (tags || []).map((t) => t.name.toLowerCase())
        if (!currentNames.includes(desired.toLowerCase())) {
          tags = tags ? [...tags, { name: desired }] : [{ name: desired }]
        }
      }
    }

    const res: any = await $fetch('/api/posts', {
      method: 'POST',
      body: { name: name.value, description: description.value || undefined, tags },
    })

    emit('created', res)
    
    // Show success toast
    toast.toast({
      title: $t(isProjectCreation.value ? 'components.newPostDrawer.projectCreated' : 'components.newPostDrawer.postCreated'),
      description: $t('components.newPostDrawer.redirecting'),
      toast: 'success'
    })
    
    open.value = false
    // navigate to editor for new post
    await router.push(`/posts/edit/${res.id}`)
  } catch (e: any) {
    console.error('[NewPostDrawer] Create post failed:', {
      error: e,
      statusCode: e?.statusCode,
      message: e?.data?.message || e?.message,
      data: e?.data
    })
    
    // Extract the most helpful error message
    const errorMessage = e?.data?.message || e?.message || 'Failed to create post. Please try again.'
    
    // Show error toast with detailed message
    toast.toast({
      title: $t(isProjectCreation.value ? 'components.newPostDrawer.projectCreateFailed' : 'components.newPostDrawer.createFailed'),
      description: errorMessage,
      toast: 'danger'
    })
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
@layer components {

:global(.site-new-content-dialog) {
  max-height: min(88vh, 720px);
  overflow-y: auto;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-panel);
  background: var(--site-color-background);
  color: var(--site-color-text);
  box-shadow: 0 24px 72px rgb(0 0 0 / 20%);
}

.site-new-content-mobile-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.site-new-content-body {
  padding: 8px 16px 20px;
}

.site-new-content-title {
  margin: 0;
  color: var(--site-color-heading);
  font-size: 20px;
  font-weight: 550;
  line-height: 28px;
}

.site-new-content-form {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.site-new-content-field {
  display: grid;
  gap: 8px;
  color: var(--site-color-text);
  font-size: 13px;
  font-weight: 550;
}

.site-new-content-field :deep(input),
.site-new-content-field :deep(textarea) {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  background: transparent;
  color: var(--site-color-heading);
  font-size: 14px;
  font-weight: 400;
}

.site-new-content-field :deep(input) {
  min-height: 42px;
  padding: 9px 11px;
}

.site-new-content-field :deep(textarea) {
  min-height: 104px;
  padding: 10px 11px;
  resize: vertical;
}

.site-new-content-field :deep(input::placeholder),
.site-new-content-field :deep(textarea::placeholder) {
  color: var(--site-color-muted);
}

.site-new-content-field :deep(input:focus-visible),
.site-new-content-field :deep(textarea:focus-visible) {
  border-width: 2px;
  border-color: var(--site-color-focus-ring);
  outline: none !important;
  box-shadow: none !important;
}

.site-new-content-assigned {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--site-color-muted);
  font-size: 12px;
}

.site-new-content-assigned-tag {
  padding: 3px 8px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-tag);
  color: var(--site-color-text);
  line-height: 18px;
}

.site-new-content-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--site-color-border);
}

.site-new-content-shortcut {
  margin-right: auto;
  color: var(--site-color-muted);
  font-size: 12px;
}

.site-new-content-cancel,
.site-new-content-submit {
  min-height: 36px;
  border-radius: var(--site-radius-control);
  font-size: 13px;
}

.site-new-content-submit {
  border: 1px solid var(--site-color-heading);
  background: var(--site-color-heading);
  color: var(--site-color-background);
  transition: opacity 150ms ease, transform 150ms ease;
}

.site-new-content-submit:hover:not(:disabled) {
  opacity: 0.86;
}

.site-new-content-submit:active:not(:disabled) {
  transform: translateY(1px);
}

@media (max-width: 1023px) {
  .site-new-content-form {
    margin-top: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-new-content-submit {
    transition: none;
  }
}
}
</style>
