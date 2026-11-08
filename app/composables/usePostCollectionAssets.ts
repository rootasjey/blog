import type { Post } from '~~/shared/types/post'
import { usePostsApi } from '~/composables/usePostsApi'

type PostCollectionAssetsOptions = {
  refreshLists: () => Promise<void>
  navigate: (path: string) => unknown
}

export function usePostCollectionAssets({ refreshLists, navigate }: PostCollectionAssetsOptions) {
  const fileInput = ref<HTMLInputElement | null>(null)
  const coverFileInput = ref<HTMLInputElement | null>(null)
  const coverTargetPost = ref<Post | null>(null)
  const coverUploadingPosts = ref(new Set<string | number>())
  const { uploadCoverFile, deleteCover } = usePostsApi()

  function triggerImportFile() {
    fileInput.value?.click()
  }

  function triggerCoverUpload(post: Post) {
    coverTargetPost.value = post
    coverFileInput.value?.click()
  }

  async function onCoverFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]
    const post = coverTargetPost.value
    if (!file || !post) return

    const identifier = post.slug || String(post.id)
    setCoverUploading(identifier, true)

    try {
      const response = await uploadCoverFile(identifier, file)
      if (response?.success && response.image) {
        if (!post.image) post.image = { alt: '', ext: '', src: '' }
        post.image.src = response.image.src ?? post.image.src ?? ''
        post.image.alt = response.image.alt ?? post.image.alt ?? ''
      }
    } catch (error) {
      console.error('Cover upload failed', error)
      alert('Cover upload failed: ' + String(error))
    } finally {
      coverTargetPost.value = null
      if (input) input.value = ''
      setCoverUploading(identifier, false)
    }
  }

  async function removeCover(post: Post) {
    if (!post.image?.src) return

    const identifier = post.slug || String(post.id)
    setCoverUploading(identifier, true)
    try {
      await deleteCover(identifier)
      if (post.image) {
        post.image.src = ''
        post.image.alt = ''
      }
    } catch (error) {
      console.error('Failed to remove cover', error)
      alert('Failed to remove cover: ' + String(error))
    } finally {
      setCoverUploading(identifier, false)
    }
  }

  async function onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) return

    try {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const parsed = JSON.parse(await file.text())
        const created: any = await $fetch('/api/posts/import', { method: 'POST' as any, body: parsed })
        const importedPosts = Array.isArray(created?.posts) ? created.posts : (created ? [created] : [])
        if (importedPosts.length === 1) {
          navigate(`/posts/edit/${importedPosts[0].slug}`)
          return
        }
        await refreshLists()
        alert(`Import completed (${importedPosts.length || 0} posts)`)
      } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/posts/import', { method: 'POST', body: formData })
        if (!response.ok) throw new Error(await response.text())

        const created = await response.json()
        const importedPosts = Array.isArray(created?.posts) ? created.posts : (created ? [created] : [])
        if (importedPosts.length === 1) {
          navigate(`/posts/edit/${importedPosts[0].slug}`)
        } else {
          await refreshLists()
          alert(`Import completed (${importedPosts.length || 0} posts)`)
        }
      } else {
        alert('Unsupported file type: ' + file.type)
      }
    } catch (error) {
      console.error('Failed to process import file', error)
      alert('Import failed: ' + String(error))
    } finally {
      if (fileInput.value) fileInput.value.value = ''
    }
  }

  function setCoverUploading(identifier: string | number, uploading: boolean) {
    const next = new Set(coverUploadingPosts.value)
    if (uploading) next.add(identifier)
    else next.delete(identifier)
    coverUploadingPosts.value = next
  }

  return {
    fileInput,
    coverFileInput,
    coverUploadingPosts,
    triggerImportFile,
    triggerCoverUpload,
    onCoverFileSelected,
    removeCover,
    onImportFileSelected,
  }
}
