import { zip } from 'fflate'
import { blob } from 'hub:blob'
import { db } from 'hub:db'

const collectImageUrls = (obj: any, out = new Set<string>()) => {
  if (!obj || typeof obj !== 'object') return out
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key]
    if (typeof val === 'string') {
      if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(val) || val.startsWith('/') || val.startsWith('http')) out.add(val)
    } else if (Array.isArray(val)) { for (const v of val) collectImageUrls(v, out) }
    else if (typeof val === 'object') collectImageUrls(val, out)
  }
  return out
}

const sanitizePath = (p: string) => p.replace(/^[\\/]+/, '').split('/').filter(Boolean).filter(s => s !== '..').join('/') || 'asset'

const guessContentType = (urlOrName: string, fetchedType?: string | null) => {
  if (fetchedType) return fetchedType
  const ext = urlOrName.split('?')[0]?.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', mp4: 'video/mp4' }
  return map[ext] ?? 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  try {
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const session = await getUserSession(event).catch(() => null)
    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')

    if (apiPost.status !== 'published' && (!session || session.user?.id !== apiPost.user_id)) {
      return apiError(event, 403, 'FORBIDDEN', 'Not authorized to export this post')
    }

    const articleBlob = await blob.get(apiPost.blob_path as string)
    const article = await (articleBlob?.text?.() ?? '')

    const post = convertApiToPost(apiPost, { article: article || '{}' })

    const filenameSlug = post.slug || `post-${post.id}`
    const res = event.node.res
    setResponseHeader(event, 'content-type', 'application/zip')
    setResponseHeader(event, 'content-disposition', `attachment; filename="${filenameSlug}.zip"`)

    const files: Record<string, Uint8Array | string> = {}
    files['post.json'] = JSON.stringify({ exportedAt: new Date().toISOString(), post }, null, 2)

    const assetBuffers: Record<string, Uint8Array> = {}
    const encoder = new TextEncoder()

    const urls = new Set<string>()
    if (post.image?.src) urls.add(post.image.src)
    const imgs = collectImageUrls(post.article)
    for (const u of imgs) urls.add(u)

    const manifest: Record<string, { path: string; size: number; contentType: string }> = {}
    const existingPaths = new Set<string>()

    for (const u of urls) {
      if (!u || u.startsWith('data:')) continue
      try {
        let blobPath = ''
        if (u.startsWith('/')) {
          const parsed = new URL(u, useRuntimeConfig().public.siteUrl)
          const pathname = parsed.pathname
          const search = parsed.searchParams
          if (pathname.startsWith('/images/')) {
            const filename = pathname.split('/').pop() || ''
            blobPath = `${search.get('relatedTo') || ''}/${search.get('slug') || ''}/${filename}`
          } else if (pathname.startsWith('/posts/') || pathname.startsWith('/projects/')) {
            const parts = pathname.split('/').filter(Boolean)
            blobPath = `${parts[0]}/${parts.slice(1, -1).join('/')}/${parts[parts.length - 1]}`
          }
        } else {
          const parsed = new URL(u)
          const pathname = parsed.pathname
          const search = parsed.searchParams
          if (pathname.startsWith('/images/')) {
            const filename = pathname.split('/').pop() || ''
            blobPath = `${search.get('relatedTo') || ''}/${search.get('slug') || ''}/${filename}`
          } else if (pathname.startsWith('/posts/') || pathname.startsWith('/projects/')) {
            const parts = pathname.split('/').filter(Boolean)
            blobPath = `${parts[0]}/${parts.slice(1, -1).join('/')}/${parts[parts.length - 1]}`
          }
        }

        let buffer: Uint8Array | null = null
        let contentType = ''
        if (blobPath) {
          try {
            const b = await blob.get(blobPath)
            const arr = await (b?.arrayBuffer?.() ? b.arrayBuffer() : Promise.resolve(null))
            if (arr) buffer = new Uint8Array(arr)
            contentType = guessContentType(blobPath)
          } catch {}
        }

        if (!buffer) {
          try {
            const fetched = await fetch(u)
            if (!fetched.ok) continue
            buffer = new Uint8Array(await fetched.arrayBuffer())
            contentType = fetched.headers.get('content-type') ?? ''
          } catch { continue }
        }

        if (!buffer) continue

        const base = sanitizePath(blobPath || new URL(u, useRuntimeConfig().public.siteUrl).pathname)
        let uniquePath = `assets/${base}`
        let counter = 1
        while (existingPaths.has(uniquePath)) {
          const extIdx = uniquePath.lastIndexOf('.')
          uniquePath = extIdx > -1 ? `${uniquePath.substring(0, extIdx)}-${counter}${uniquePath.substring(extIdx)}` : `${uniquePath}-${counter}`
          counter++
        }
        existingPaths.add(uniquePath)
        assetBuffers[uniquePath] = buffer
        manifest[u] = { path: uniquePath, size: buffer.length, contentType: guessContentType(base, contentType) }
      } catch { continue }
    }

    files['manifest.json'] = JSON.stringify({ files: manifest, meta: { id: post.id, title: post.name, slug: post.slug, exportedAt: new Date().toISOString() } }, null, 2)

    for (const [p, u8] of Object.entries(assetBuffers)) files[p] = u8

    const finalFiles: Record<string, Uint8Array> = {}
    for (const k of Object.keys(files)) {
      const v = (files as any)[k]
      if (typeof v === 'string') finalFiles[k] = encoder.encode(v)
      else if (v instanceof Uint8Array) finalFiles[k] = v
    }

    zip(finalFiles as any, { level: 6 }, (err: any, data: Uint8Array) => {
      if (err) {
        console.error('[API v1] export zip error:', err)
        try { res.statusCode = 500 } catch {}
        res.end()
        return
      }
      res.end(Buffer.from(data))
    })
  } catch (err: any) {
    console.error('[API v1] GET /posts/:id/export error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to export post')
  }
})
