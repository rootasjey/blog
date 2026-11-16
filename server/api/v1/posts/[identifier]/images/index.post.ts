import { apiErrorFromException } from '~~/server/utils/api'
import { blob } from 'hub:blob'
import { hasPostPermission } from '~~/server/utils/postPermissions'
import { db, schema } from 'hub:db'
import { cleanUpFailedPostUpload } from '~~/server/utils/postMediaGc'

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

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    const formData = await readMultipartFormData(event)
    const filePart = formData?.find(item => item.name === 'file')
    if (!filePart?.data || !filePart?.filename || !filePart?.type) return apiError(event, 400, 'VALIDATION_ERROR', 'Missing file upload')

    const type = filePart.type.toString()
    if (!allowedTypes.includes(type)) return apiError(event, 400, 'VALIDATION_ERROR', 'Unsupported file type')

    const safeName = filePart.filename.toString().replace(/[^a-zA-Z0-9._-]/g, '-')
    const timestamp = Date.now()
    const imagesFolder = `posts/${apiPost.id}/images`

    const blobFile = new Blob([new Uint8Array(filePart.data as any)], { type })
    const stored = await blob.put(`${imagesFolder}/${timestamp}-${safeName}`, blobFile, { addRandomSuffix: true })
    const storedPath = stored.pathname.replace(/^\/+/, '')
    uploadedPaths.push(storedPath)
    const filename = storedPath.split('/').pop()!
    const servingUrl = `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(`${apiPost.id}/images`)}`

    const size = (filePart.data as any)?.byteLength ?? null
    await db.insert(schema.post_images).values({
      post_id: apiPost.id, pathname: `/${storedPath}`, filename,
      content_type: type, size, in_use: false,
    }).run()
    metadataPersisted = true

    return apiCreated(event, { alt: filePart.filename.toString(), src: servingUrl, storedPath: `/${storedPath}` })
  } catch (err: any) {
    if (postIdForCleanup !== null && uploadedPaths.length && !metadataPersisted) {
      try {
        await cleanUpFailedPostUpload(postIdForCleanup, uploadedPaths)
      } catch (cleanupError) {
        console.error('[API v1] Failed to queue image cleanup after upload failure:', cleanupError)
      }
    }
    console.error('[API v1] POST /posts/:id/images error:', err?.message || err)
    return apiErrorFromException(event, err, 'Failed to upload image')
  }
})
