import { ref, onUnmounted } from 'vue'
import type { Post } from '~~/shared/types/post'
import { usePostsApi } from '~/composables/usePostsApi'
import { MAX_COVER_FILE_BYTES, MAX_COVER_VIDEO_DURATION_SECONDS, detectCoverMedia } from '~~/shared/utils/cover-media'

export function usePostImages(identifier: () => string | number, post: () => Post | null) {
  const { uploadCoverFile, deleteCover } = usePostsApi()
  const { $ts } = useI18n()

  const fileInput = ref<HTMLInputElement | null>(null)
  const uploadingCover = ref(false)
  const uploadProgress = ref(0)

  // Transient preview URL for optimistic preview before server responds
  const previewSrc = ref<string | null>(null)
  const previewExt = ref('')

  const revokePreview = () => {
    if (previewSrc.value) {
      try {
        URL.revokeObjectURL(previewSrc.value)
      } catch (e) {
        // ignore
      }
      previewSrc.value = null
      previewExt.value = ''
    }
  }

  // Ensure preview URL is revoked if the composable is destroyed
  onUnmounted(() => {
    revokePreview()
  })

  const triggerFileInput = () => fileInput.value?.click()

  const prepareCoverFile = async (file: File): Promise<File> => {
    if (file.size > MAX_COVER_FILE_BYTES) {
      throw new Error($ts('pages.postEditor.coverTooLarge'))
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const media = detectCoverMedia(file.type, bytes, file.name)
    if (!media) throw new Error($ts('pages.postEditor.coverTypeUnsupported'))

    if (media.kind === 'video') {
      await validateVideoDuration(file)
      previewExt.value = media.extension
      return file
    }

    if (media.extension !== 'webp' && media.extension !== 'avif') {
      previewExt.value = media.extension
      return file
    }

    const bitmap = await createImageBitmap(file)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This image could not be prepared for upload.')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('This image could not be prepared for upload.')), 'image/jpeg', 0.92)
      })
      previewExt.value = 'jpg'
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
    } finally {
      bitmap.close()
    }
  }

  const validateVideoDuration = async (file: File): Promise<void> => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    try {
      const duration = await new Promise<number>((resolve, reject) => {
        video.onloadedmetadata = () => resolve(video.duration)
        video.onerror = () => reject(new Error($ts('pages.postEditor.videoDurationUnavailable')))
        video.src = objectUrl
      })

      if (!Number.isFinite(duration) || duration > MAX_COVER_VIDEO_DURATION_SECONDS) {
        throw new Error($ts('pages.postEditor.videoTooLong', { seconds: MAX_COVER_VIDEO_DURATION_SECONDS }))
      }
    } finally {
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleFileChange = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const selectedFile = input.files?.[0]
    if (!selectedFile || !post()) return

    uploadingCover.value = true
    uploadProgress.value = 0

    try {
      const file = await prepareCoverFile(selectedFile)
      revokePreview()
      previewSrc.value = URL.createObjectURL(file)
      const currentLoop = post()?.image?.loop !== false
      const res = await uploadCoverFile(String(identifier()), file, currentLoop, (p) => (uploadProgress.value = p))
      if (res?.success && res.image) {
        const current = post()
        if (current) {
          if (!current.image) current.image = { alt: '', ext: '', src: '' }
          current.image.src = res.image.src ?? ''
          current.image.alt = res.image.alt ?? ''
          current.image.ext = res.image.ext ?? previewExt.value
          current.image.loop = res.image.loop ?? currentLoop
        }
      }

      // On success, revoke local preview (server image will be used)
      revokePreview()
    } catch (e) {
      revokePreview()
      throw e
    } finally {
      uploadingCover.value = false
      input.value = ''
      setTimeout(() => (uploadProgress.value = 0), 800)
    }
  }

  const deleteCoverImage = async (): Promise<void> => {
    const current = post()
    if (!current?.image?.src) return
    await deleteCover(String(identifier()))
    if (current.image) {
      current.image.src = ''
      current.image.alt = ''
    }
  }

  const clearPreview = () => revokePreview()

  return {
    fileInput,
    uploadingCover,
    uploadProgress,
    previewSrc,
    previewExt,
    clearPreview,
    triggerFileInput,
    handleFileChange,
    deleteCoverImage,
  }
}
