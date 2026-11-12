import { blob } from 'hub:blob'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { db, schema } from 'hub:db'
import { cleanUpFailedPostUpload } from '~~/server/utils/postMediaGc'

const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/ogg']
const ALLOWED_POSTER = ['image/png', 'image/jpeg', 'image/webp']

export default defineEventHandler(async (event) => {
  const uploadedPaths: string[] = []
  let postIdForCleanup: number | null = null
  let metadataPersisted = false
  try {
    const user = await requireWriteAccess(event)
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    if (!(await hasPostPermission(user, apiPost, 'edit'))) return apiError(event, 403, 'FORBIDDEN', 'Not authorized')
    postIdForCleanup = apiPost.id

    const formData = await readMultipartFormData(event)
    const filePart = formData?.find(i => i.name === 'file')
    const posterPart = formData?.find(i => i.name === 'poster')

    if (!filePart?.data || !filePart?.filename || !filePart?.type) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Missing video file')
    }

    const type = filePart.type.toString()
    if (!ALLOWED_VIDEO.includes(type)) return apiError(event, 400, 'VALIDATION_ERROR', 'Unsupported video format')

    const safeName = filePart.filename.toString().replace(/[^a-zA-Z0-9._-]/g, '-')
    const timestamp = Date.now()
    const videosFolder = `posts/${apiPost.id}/videos`

    const buffer = filePart.data as ArrayBuffer | Uint8Array | Buffer
    const blobFile = new Blob([new Uint8Array(buffer as any)], { type })
    const stored = await blob.put(`${videosFolder}/${timestamp}-${safeName}`, blobFile, { addRandomSuffix: true })
    const storedPath = stored.pathname.replace(/^\/+/, '')
    uploadedPaths.push(storedPath)
    const filename = storedPath.split('/').pop()!
    const servingUrl = `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(`${apiPost.id}/videos`)}`

    let posterStoredPath: string | null = null
    let posterFilename: string | null = null

    if (posterPart?.data && posterPart?.filename && posterPart?.type) {
      const pType = posterPart.type.toString()
      if (ALLOWED_POSTER.includes(pType)) {
        const safePoster = posterPart.filename.toString().replace(/[^a-zA-Z0-9._-]/g, '-')
        const posterBuf = posterPart.data as ArrayBuffer | Uint8Array | Buffer
        const posterBlob = new Blob([new Uint8Array(posterBuf as any)], { type: pType })
        const storedPoster = await blob.put(`${videosFolder}/${timestamp}-${safePoster}`, posterBlob, { addRandomSuffix: true })
        posterStoredPath = storedPoster.pathname.replace(/^\/+/, '')
        uploadedPaths.push(posterStoredPath)
        posterFilename = posterStoredPath.split('/').pop() || null
      }
    }

    const size = (buffer as any)?.byteLength ?? null
    await db.insert(schema.post_videos).values({
      post_id: apiPost.id, pathname: `/${storedPath}`, filename,
      content_type: type, size,
      poster_path: posterStoredPath ? `/${posterStoredPath}` : null,
      poster_filename: posterFilename,
      in_use: false,
    }).run()
    metadataPersisted = true

    return apiCreated(event, {
      src: servingUrl, storedPath: `/${storedPath}`,
      posterSrc: posterStoredPath ? `/images/${encodeURIComponent(posterFilename!)}?relatedTo=posts&slug=${encodeURIComponent(`${apiPost.id}/videos`)}` : null,
    })
  } catch (err: any) {
    if (postIdForCleanup !== null && uploadedPaths.length && !metadataPersisted) {
      try {
        await cleanUpFailedPostUpload(postIdForCleanup, uploadedPaths)
      } catch (cleanupError) {
        console.error('[API v1] Failed to queue video cleanup after upload failure:', cleanupError)
      }
    }
    console.error('[API v1] POST /posts/:id/videos error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to upload video')
  }
})
