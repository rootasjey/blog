import type { Post } from '~~/shared/types/post'

interface UploadCoverResult {
  success?: boolean
  image?: { src?: string; alt?: string; ext?: string; loop?: boolean }
  [key: string]: any
}

interface UpdatePostPayload {
  name?: string
  description?: string
  slug?: string
  status?: Post['status']
}

export function usePostsApi() {
  const fetchPost = (identifier: string | number) => {
    return $fetch<Post>(`/api/posts/${encodeURIComponent(String(identifier))}`)
  }

  const updatePost = (identifier: string | number, body: UpdatePostPayload) => {
    return $fetch<{ post: Post }>(`/api/posts/${encodeURIComponent(String(identifier))}`, {
      method: 'PUT',
      body,
    })
  }

  const updateArticle = (identifier: string | number, article: object, expectedRevision: number) => {
    return $fetch<{ revision: number }>(`/api/posts/${encodeURIComponent(String(identifier))}/article`, {
      method: 'PUT',
      body: { article, expectedRevision, source: 'editor' },
    })
  }

  const deletePost = (identifier: string | number) => {
    return $fetch(`/api/posts/${encodeURIComponent(String(identifier))}`, { method: 'DELETE' })
  }

  const checkSlugUnique = (slug: string, excludeId?: number, signal?: AbortSignal) => {
    const params: any = { slug }
    if (excludeId) params.excludeId = excludeId
    return $fetch<{ exists: boolean }>('/api/posts/slug/check', { params, signal })
  }

  const uploadCoverFile = (identifier: string | number, file: File, loop = true, onProgress?: (percent: number) => void) => {
    return new Promise<UploadCoverResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/posts/${encodeURIComponent(String(identifier))}/cover`)

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(json)
        } catch (err) {
          reject(err)
        }
      }

      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable || !onProgress) return
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }

      xhr.onerror = () => reject(new Error('Network error'))

      const form = new FormData()
      form.append('file', file)
      form.append('fileName', file.name)
      form.append('type', file.type)
      form.append('loop', String(loop))

      xhr.send(form)
    })
  }

  const deleteCover = (identifier: string | number) => {
    return $fetch(`/api/posts/${encodeURIComponent(String(identifier))}/cover`, { method: 'DELETE' })
  }

  const updateCoverLoop = (identifier: string | number, loop: boolean) => {
    return $fetch<{ success: boolean; loop: boolean }>(`/api/posts/${encodeURIComponent(String(identifier))}/cover/loop`, {
      method: 'PUT',
      body: { loop },
    })
  }

  const importCoverFromUrl = (identifier: string | number, url: string, alt: string, loop: boolean) =>
    $fetch<{ image: { alt: string; ext: string; loop: boolean; src: string }; success: boolean }>(`/api/posts/${encodeURIComponent(String(identifier))}/cover/import`, {
      method: 'POST',
      body: { url, alt, loop },
    })

  const exportPostZip = async (identifier: string | number) => {
    const res = await fetch(`/api/posts/${encodeURIComponent(String(identifier))}/export`, { credentials: 'include' })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Failed to export post (server error)')
    }
    return res.blob()
  }

  return {
    fetchPost,
    updatePost,
    updateArticle,
    deletePost,
    checkSlugUnique,
    uploadCoverFile,
    deleteCover,
    updateCoverLoop,
    importCoverFromUrl,
    exportPostZip,
  }
}
