import { apiErrorFromException } from '~~/server/utils/api'
import { blob } from 'hub:blob'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { db, schema } from 'hub:db'
import { cleanUpFailedPostUpload } from '~~/server/utils/postMediaGc'

const ALLOWED = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac']

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
    if (!filePart?.data || !filePart?.filename || !filePart?.type) return apiError(event, 400, 'VALIDATION_ERROR', 'Missing audio file')

    const type = filePart.type.toString()
    if (!ALLOWED.includes(type)) return apiError(event, 400, 'VALIDATION_ERROR', 'Unsupported audio format')

    const safeName = filePart.filename.toString().replace(/[^a-zA-Z0-9._-]/g, '-')
    const timestamp = Date.now()
    const folder = `posts/${apiPost.id}/audios`

    const buffer = filePart.data as ArrayBuffer | Uint8Array | Buffer
    const blobFile = new Blob([new Uint8Array(buffer as any)], { type })
    const stored = await blob.put(`${folder}/${timestamp}-${safeName}`, blobFile, { addRandomSuffix: true })
    const storedPath = stored.pathname.replace(/^\/+/, '')
    uploadedPaths.push(storedPath)
    const filename = storedPath.split('/').pop()!
    const servingUrl = `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(`${apiPost.id}/audios`)}`

    const size = (buffer as any)?.byteLength ?? null
    await db.insert(schema.post_audios).values({
      post_id: apiPost.id, pathname: `/${storedPath}`, filename,
      content_type: type, size, in_use: false,
    }).run()
    metadataPersisted = true

    return apiCreated(event, { src: servingUrl, storedPath: `/${storedPath}` })
  } catch (err: any) {
    if (postIdForCleanup !== null && uploadedPaths.length && !metadataPersisted) {
      try {
        await cleanUpFailedPostUpload(postIdForCleanup, uploadedPaths)
      } catch (cleanupError) {
        console.error('[API v1] Failed to queue audio cleanup after upload failure:', cleanupError)
      }
    }
    console.error('[API v1] POST /posts/:id/audios error:', err?.message || err)
    return apiErrorFromException(event, err, 'Failed to upload audio')
  }
})
