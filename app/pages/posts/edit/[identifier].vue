<template>
  <div v-if="post" class="min-h-screen site-post site-dynamic-post site-post-editor site-post-editor--post">
    <!-- Floating action bar -->
    <PostEditorToolbar
      :post-slug="post.slug"
      :status="status"
      :language-options="languageOptions"
      :post-language="postLanguage"
      :has-cover="Boolean(post.image?.src)"
      :uploading-cover="uploadingCover"
      :exporting-zip="exportingZip"
      :saving="saving"
      :can-save="Boolean(name && slug)"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undoEditor"
      @redo="redoEditor"
      @save="saveAll"
      @change-status="status = $event"
      @change-language="updatePostLanguage"
      @open-translations="translationsDialogOpen = true"
      @edit-slug="openSlugDialog"
      @delete-post="openDeleteDialog"
      @export-zip="exportPostZipFile"
      @export-json="exportPost"
      @replace-cover="triggerFileInput"
      @delete-cover="openDeleteCoverDialog"
    >
      <EditSlugDialog
        v-model="isSlugDialogOpen"
        v-model:slugCandidate="slugCandidate"
        :slug="slug"
        :slugCheckLoading="slugCheckLoading"
        :slugTaken="slugTaken"
        :slugCheckMessage="slugCheckMessage"
        :error="error"
        @save="saveSlug"
      />
    </PostEditorToolbar>

    <!-- Hero / Title / Meta extracted to component -->
    <PostMetadataEditor
      :name="name"
      :description="description"
      :post-id="post?.id || null"
      :tags="postTags"
      @update:name="name = $event"
      @update:description="description = $event"
      @update:tags="onTagsUpdated"
    />

    <!-- Featured Image (preview / placeholder) -->
    <div v-if="previewSrc || post.image?.src" class="site-preview-cover site-editor-cover group">
      <div class="post-cover site-preview-cover-trigger">
        <img v-if="previewSrc" :src="previewSrc" :alt="post.image?.alt || post.name" class="site-preview-cover-image" />
        <NuxtImg v-else provider="hubblob" :src="post.image.src" :alt="post.image.alt || post.name" class="site-preview-cover-image" />
      </div>

      <div v-if="uploadingCover" class="site-editor-cover-progress">
        <div class="h-full bg-primary transition-all duration-300" :style="{ width: uploadProgress + '%' }" />
      </div>

      <!-- Overlay actions -->
      <div class="site-editor-cover-actions">
        <NButton @click="triggerFileInput" btn="solid-white" size="xs" :disabled="uploadingCover" leading="i-ph-image">
          <span v-if="!uploadingCover">{{ $t('pages.postEditor.replace') }}</span>
          <span v-else>{{ uploadProgress }}%</span>
        </NButton>
        <NButton v-if="post.image?.src" @click="openDeleteCoverDialog" btn="solid-white" size="xs" leading="i-ph-trash" class="text-red-500" :disabled="uploadingCover">
          {{ $t('pages.postEditor.delete') }}
        </NButton>
        <NButton v-else-if="previewSrc && !uploadingCover" @click="clearPreview" btn="solid-white" size="xs" leading="i-ph-x">
          {{ $t('pages.postEditor.cancel') }}
        </NButton>
      </div>
    </div>

    <!-- Editable content follows the same reading column as the public post. -->
    <article class="site-post-content site-editor-body">
      <div class="container">
        <div class="site-post-reading-column site-editor-canvas">
          <PostContent
            :content="articleContent"
            :editable="true"
            :ai-enabled="aiEnabled"
            :ai-loading="aiLoading"
            :on-ai-command="startAI"
            :on-configure-models="openAiProviderDialog"
            @update:content="onEditorUpdate"
            @editor-ready="onEditorReady"
          />
          <div class="site-editor-save-status">
            <span v-if="savingArticle" class="i-lucide-loader animate-spin text-sm" aria-hidden />
            <span v-if="savingArticle">{{ $t('pages.postEditor.autosaving') }}</span>
            <span v-else-if="lastArticleSavedAt">{{ $t('pages.postEditor.saved', { timeAgo }) }}</span>
          </div>
        </div>
      </div>
    </article>

    <section class="site-post-end site-editor-end">
      <div class="container">
        <div class="site-post-author-card site-editor-byline">
          <div class="site-editor-byline-author">
            <div v-if="post.user" class="site-editor-author">
              <NuxtImg
                v-if="post.user.avatar"
                provider="hubblob"
                :src="post.user.avatar"
                :alt="post.user.name || 'User'"
                fit="cover"
                class="site-editor-byline-avatar"
              />
              <div v-if="post.user.name" class="site-editor-byline-name">
                {{ post.user.name }}
              </div>
            </div>
            <div class="site-editor-autosave-status">
              {{ $t('pages.postEditor.autosaveEnabled') }}
            </div>
          </div>
        </div>
        <div class="site-editor-end-meta">
          <time>{{ formatPostDate(post.publishedAt || post.createdAt) }}</time>
          <span aria-hidden="true">·</span>
          <span>{{ enhancedPost.readingTime }}</span>
        </div>
      </div>
    </section>

    <transition name="fade">
      <div v-if="aiSession" class="site-editor-ai-session">
        <div class="flex items-center justify-between px-4 pt-3">
          <div class="flex items-center gap-2 font-semibold text-sm">
            <span class="i-lucide-sparkles text-primary" />
            <span>{{ aiStatus === 'streaming' ? $t('pages.postEditor.aiWriting') : $t('pages.postEditor.aiSuggestionReady') }}</span>
          </div>
          <NBadge badge="soft" color="primary">{{ aiStatus === 'streaming' ? $t('pages.postEditor.streaming') : $t('common.preview') }}</NBadge>
        </div>
        <div class="flex justify-end gap-2 px-4 py-3">
          <NButton btn="ghost-gray" size="xs" :disabled="aiLoading" @click="retryAI">{{ $t('pages.postEditor.retry') }}</NButton>
          <NButton btn="ghost-gray" size="xs" :disabled="aiLoading" @click="revertAI">{{ $t('pages.postEditor.revert') }}</NButton>
          <NButton btn="primary" size="xs" :disabled="aiLoading || aiStatus === 'streaming'" @click="commitAiDraft">{{ $t('pages.postEditor.applyChanges') }}</NButton>
        </div>
      </div>
    </transition>

    <AiProviderDialog
      v-model:open="aiProviderDialogOpen"
      v-model:provider="aiProvider"
    />

    <PostEditorDialogs
      v-if="post"
      v-model:translations-open="translationsDialogOpen"
      v-model:translate-open="translateDialogOpen"
      v-model:translate-target-language="translateTargetLanguage"
      v-model:delete-post-open="confirmDeleteDialogOpen"
      v-model:delete-cover-open="confirmDeleteCoverOpen"
      :post-id="post.id"
      :current-language="post.language"
      :language-options="languageOptions"
      :source-language="sourceLanguage"
      :source-language-label="sourceLanguageLabel"
      :ai-loading="aiLoading"
      :delete-post-loading="deletePostLoading"
      :delete-cover-loading="deleteCoverLoading"
      @translation-created="onTranslationCreated"
      @confirm-translate="confirmTranslate"
      @cancel-translate="cancelTranslateDialog"
      @confirm-delete-post="performDeletePost"
      @confirm-delete-cover="confirmDeleteCover"
    />

    <!-- Hidden file input for cover image -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      :disabled="uploadingCover"
      @change="onCoverFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import type { ApiTag } from '~~/shared/types/tags'
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn, useTimeAgo } from '@vueuse/core'
import type { AILength, AICommand } from '~/composables/useAIWriter'
import PostContent from '~/components/PostContent.vue'
import PostMetadataEditor from '~/components/PostMetadataEditor.vue'
import { usePost } from '~/composables/usePost'
import { usePostsApi } from '~/composables/usePostsApi'
import { usePostImages } from '~/composables/usePostImages'
import { useSlugValidation } from '~/composables/useSlugValidation'
import { usePostAI } from '~/composables/usePostAI'
import { useAISettings } from '~/composables/useAISettings'
import { deriveSlugFromName } from '~/utils/slug'
import { useTagStore } from '~/stores/tags'
import { useAIWriter } from '~/composables/useAIWriter'
import AiProviderDialog from '~/components/editor/AiProviderDialog.vue'
import PostEditorDialogs from '~/components/editor/PostEditorDialogs.vue'
import PostEditorToolbar from '~/components/editor/PostEditorToolbar.vue'

const route = useRoute()
const router = useRouter()
const identifier = computed(() => route.params.identifier as string)

const { user } = useUserSession()
const { enhancePost, formatPostDate } = usePost()
const tagStore = useTagStore()
const { fetchPost: fetchPostApi, updatePost, updateArticle, deletePost: deletePostApi, exportPostZip } = usePostsApi()
const { streamSuggestion, cancel } = useAIWriter()

const post = ref<Post | null>(null)
const postTags = ref<ApiTag[]>([])
const loading = ref(true)
const saving = ref(false)
const savingArticle = ref(false)
const lastArticleSavedAt = ref<number | null>(null)
const rawTimeAgo = useTimeAgo(computed(() => lastArticleSavedAt.value ?? 0))
const timeAgo = computed(() => (lastArticleSavedAt.value ? rawTimeAgo.value : ''))
let articleSpinnerTimer: ReturnType<typeof setTimeout> | null = null
const error = ref('')
const successMessage = ref('')
const exportingZip = ref(false)

// Delete confirmations (use Una UI dialogs instead of window.confirm)
const confirmDeleteDialogOpen = ref(false)
const deletePostLoading = ref(false)
const confirmDeleteCoverOpen = ref(false)
const deleteCoverLoading = ref(false)

const name = ref('')
const description = ref('')
const slug = ref('')
const status = ref<'draft' | 'published' | 'archived'>('draft')
const articleContent = ref({})

const runtimeConfig = useRuntimeConfig()
const aiEnabled = computed(() => runtimeConfig.public?.features?.aiWriter === true)
const aiLength = ref<AILength>('medium')
const { provider: aiProvider, getModelForAction } = useAISettings()
const aiProviderDialogOpen = ref(false)

const editor = ref<any | null>(null)

async function saveArticle(content: object) {
  if (!post.value) return

  articleSpinnerTimer = setTimeout(() => {
    savingArticle.value = true
  }, 300)

  error.value = ''
  successMessage.value = ''

  try {
    await updateArticle(identifier.value, content)
    lastArticleSavedAt.value = Date.now()
    successMessage.value = 'Article content saved successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to save article content'
    console.error('Failed to save article:', e)
  } finally {
    if (articleSpinnerTimer) {
      clearTimeout(articleSpinnerTimer)
      articleSpinnerTimer = null
    }
    setTimeout(() => (savingArticle.value = false), 120)
  }
}

const debouncedSaveArticle = useDebounceFn(saveArticle, 700)

const { fileInput, uploadingCover, uploadProgress, previewSrc, clearPreview, triggerFileInput, handleFileChange, deleteCoverImage } = usePostImages(
  () => identifier.value,
  () => post.value,
)

const enhancedPost = computed(() => (post.value ? enhancePost(post.value) : ({ readingTime: '—' } as any)))
const isNumericIdentifier = computed(() => /^\d+$/.test(String(identifier.value)))

const { $t, $getLocale } = useI18n()
const languageOptions = [
  { value: 'en', label: $t('pages.postEditor.en') },
  { value: 'fr', label: $t('pages.postEditor.fr') },
  { value: 'es', label: $t('pages.postEditor.es') },
  { value: 'de', label: $t('pages.postEditor.de') },
  { value: 'it', label: $t('pages.postEditor.it') },
]
const sourceLanguage = computed(() => post.value?.language || 'en')
const sourceLanguageLabel = computed(() => languageOptions.find(o => o.value === sourceLanguage.value)?.label || sourceLanguage.value)
const postLanguage = computed(() => post.value?.language || 'en')
const translateDialogOpen = ref(false)
const translationsDialogOpen = ref(false)
const translateTargetLanguage = ref('en')
const pendingAICommand = ref<AICommand | null>(null)

const {
  aiLoading,
  aiError,
  aiSession,
  aiStatus,
  startAI: startAIInternal,
  commitAiDraft,
  retryAI,
  revertAI,
  cancelAI,
} = usePostAI({
  editor,
  identifier,
  aiEnabled,
  aiLength,
  aiProvider,
  getModelForAction,
  sourceLanguage,
  streamSuggestion,
  cancelStream: cancel,
  articleContent,
  onAutosave: (content) => debouncedSaveArticle(content as object),
})

const { 
  slugCandidate, 
  slugCheckLoading, 
  slugTaken, 
  slugCheckMessage, 
  setSlugCandidate, 
  reset: resetSlugValidation
} = useSlugValidation({
  currentSlug: () => slug.value,
  postId: () => post.value?.id,
})

const isSlugDialogOpen = ref(false)

const onEditorReady = (ed: any) => {
  editor.value = ed
}

const undoEditor = () => {
  if (!editor.value) return
  try {
    editor.value.chain().focus().undo().run()
  } catch (e) {
    console.warn('Undo not available', e)
  }
}

const redoEditor = () => {
  if (!editor.value) return
  try {
    editor.value.chain().focus().redo().run()
  } catch (e) {
    console.warn('Redo not available', e)
  }
}

const guessTargetLanguage = () => {
  const alt = languageOptions.find(o => o.value !== sourceLanguage.value)
  return alt?.value || 'en'
}

const startAI = async (command: AICommand) => {
  if (typeof command !== 'string' && command.action === 'translate' && !command.targetLanguage) {
    pendingAICommand.value = command
    translateTargetLanguage.value = guessTargetLanguage()
    translateDialogOpen.value = true
    return
  }

  await startAIInternal(command)
}

function openAiProviderDialog() {
  aiProviderDialogOpen.value = true
}

watch(aiError, (msg) => {
  if (!msg) return
  useToast().toast({ title: $t('pages.postEditor.aiError'), description: msg, toast: 'danger' })
})

const confirmTranslate = async () => {
  const cmd = pendingAICommand.value

  // Ensure we have an object command (not a string literal) and it's a translate action
  if (!cmd || typeof cmd === 'string' || cmd.action !== 'translate') {
    translateDialogOpen.value = false
    pendingAICommand.value = null
    return
  }

  const payload: AICommand = {
    action: 'translate',
    targetLanguage: translateTargetLanguage.value,
    sourceLanguage: cmd.sourceLanguage || sourceLanguage.value,
  }

  translateDialogOpen.value = false
  pendingAICommand.value = null
  await startAIInternal(payload)
}

const cancelTranslateDialog = () => {
  translateDialogOpen.value = false
  pendingAICommand.value = null
}

const canUndo = computed(() => Boolean(editor.value?.can().undo()))
const canRedo = computed(() => Boolean(editor.value?.can().redo()))

const openSlugDialog = () => {
  setSlugCandidate(slug.value || '')
  isSlugDialogOpen.value = true
}

watch(isSlugDialogOpen, (open) => {
  if (!open) {
    resetSlugValidation()
    error.value = ''
  }
})

const saveSlug = async () => {
  if (!post.value || !slugCandidate.value) return

  saving.value = true
  error.value = ''
  try {
    const res = await updatePost(identifier.value, { slug: slugCandidate.value })

    if (res?.post) {
      post.value = res.post
      slug.value = res.post.slug
      postTags.value = res.post.tags ?? postTags.value
    } else {
      slug.value = slugCandidate.value
    }

    successMessage.value = 'Slug updated successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
    isSlugDialogOpen.value = false

    if (!isNumericIdentifier.value && post.value?.slug) {
      await router.replace(`/posts/${post.value.slug}`)
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to update slug'
    console.error('Failed to update slug:', e)
  } finally {
    saving.value = false
  }
}

const fetchPost = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await fetchPostApi(identifier.value)
    post.value = data

    if (data.user?.id !== user.value?.id) {
      error.value = 'You are not authorized to edit this post'
      router.push('/posts')
      return
    }

    name.value = data.name
    description.value = data.description || ''
    slug.value = data.slug
    status.value = data.status
    articleContent.value = data.article || {}
    postTags.value = data.tags ?? []
    tagStore.fetchTags().catch(() => {})
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to load post'
    console.error('Failed to load post:', e)
  } finally {
    loading.value = false
  }
}

const onTagsUpdated = (tags: ApiTag[]) => {
  postTags.value = tags
  if (post.value) post.value.tags = tags
}

const saveMetadata = async () => {
  if (!post.value) return

  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const res = await updatePost(identifier.value, {
      name: name.value,
      description: description.value,
      slug: slug.value,
      status: status.value,
    })

    if (res?.post) {
      post.value = res.post
      slug.value = res.post.slug
      postTags.value = res.post.tags ?? postTags.value
      if (!isNumericIdentifier.value && post.value?.slug) {
        await router.replace(`/posts/${post.value.slug}`)
      }
    }

    successMessage.value = 'Post metadata updated successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to update post metadata'
    console.error('Failed to update post:', e)
  } finally {
    saving.value = false
  }
}

const saveAll = async () => {
  if (!post.value) return

  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const res = await updatePost(identifier.value, {
      name: name.value,
      description: description.value,
      slug: slug.value,
      status: status.value,
    })

    if (res?.post) {
      post.value = res.post
      slug.value = res.post.slug

      if (!isNumericIdentifier.value && post.value?.slug) {
        await router.replace(`/posts/${post.value.slug}`)
      }
    }

    await updateArticle(identifier.value, articleContent.value)

    successMessage.value = 'Post saved successfully!'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to save post'
    console.error('Failed to save:', e)
  } finally {
    saving.value = false
  }
}

const onTranslationCreated = (newPostId: number) => {
  useToast().toast({
    title: $t('editor.translationsManager.createSuccess'),
    toast: 'success',
  })
}

async function updatePostLanguage(lang: string) {
  if (!post.value) return
  try {
    await $fetch(`/api/posts/${identifier.value}`, {
      method: 'PUT',
      body: { language: lang },
    })
    if (post.value) post.value.language = lang
    useToast().toast({
      title: `Language changed to ${lang.toUpperCase()}`,
      toast: 'success',
    })
  } catch (e: any) {
    useToast().toast({
      title: 'Failed to update language',
      description: e?.data?.message || '',
      toast: 'danger',
    })
  }
}

// Open the delete-post confirmation dialog
const openDeleteDialog = () => {
  confirmDeleteDialogOpen.value = true
}

// Perform the deletion after the user confirms
const performDeletePost = async () => {
  if (!post.value) return
  deletePostLoading.value = true
  error.value = ''

  try {
    await deletePostApi(identifier.value)
    confirmDeleteDialogOpen.value = false
    router.push('/posts')
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to delete post'
    console.error('Failed to delete post:', e)
  } finally {
    deletePostLoading.value = false
  }
} 

const exportPost = async () => {
  if (!post.value) return

  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      post: {
        ...post.value,
        article: articleContent.value ?? post.value.article ?? {},
      },
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filenameSlug = slug.value || post.value.slug || `post-${post.value.id || 'export'}`
    a.download = `${filenameSlug}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    successMessage.value = 'Post exported'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.message || 'Failed to export post'
    console.error('Failed to export post:', e)
  }
}

const exportPostZipFile = async () => {
  if (!post.value) return
  exportingZip.value = true
  try {
    const blobRes = await exportPostZip(identifier.value)
    const url = URL.createObjectURL(blobRes)
    const a = document.createElement('a')
    a.href = url
    const filenameSlug = slug.value || post.value.slug || `post-${post.value.id || 'export'}`
    a.download = `${filenameSlug}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    successMessage.value = 'Post exported (ZIP)'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.message || 'Failed to export ZIP'
    console.error('Failed to export ZIP:', e)
  } finally {
    exportingZip.value = false
  }
}

watch(name, (newName) => {
  if (!slug.value || slug.value === post.value?.slug) {
    slug.value = deriveSlugFromName(newName)
  }
})

const onEditorUpdate = (json: object) => {
  articleContent.value = json
  if (aiStatus.value === 'streaming') return
  debouncedSaveArticle(json)
}

const onCoverFileChange = async (event: Event) => {
  error.value = ''
  successMessage.value = ''
  try {
    await handleFileChange(event)
    if (post.value?.image?.src) {
      successMessage.value = 'Cover image uploaded successfully'
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to upload cover image'
  }
}

const openDeleteCoverDialog = () => {
  if (!post.value?.image?.src) return
  confirmDeleteCoverOpen.value = true
}

const confirmDeleteCover = async () => {
  if (!post.value?.image?.src) {
    confirmDeleteCoverOpen.value = false
    return
  }

  deleteCoverLoading.value = true
  error.value = ''
  try {
    await deleteCoverImage()
    successMessage.value = 'Cover image removed'
    setTimeout(() => (successMessage.value = ''), 3000)
    confirmDeleteCoverOpen.value = false
  } catch (e: any) {
    error.value = e?.message || 'Failed to remove cover image'
    console.error('Failed to remove cover image:', e)
  } finally {
    deleteCoverLoading.value = false
  }
} 

onMounted(() => {
  fetchPost()
})
</script>

<style>
@layer components {

.dropdown-menu-group button {
  font-weight: 500;
}
.dropdown-menu-sub-content button {
  font-weight: 500;
}

/* Auto resizing for the post description NInput */
.description-input textarea {
  overflow: hidden; /* prevent scrollbars so we can size by content */
  resize: none; /* disable manual dragging */
}
}
</style>
