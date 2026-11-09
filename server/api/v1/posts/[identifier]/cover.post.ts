import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const formData = await readMultipartFormData(event)
    const file = formData?.find(item => item.name === 'file')?.data
    const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
    const type = formData?.find(item => item.name === 'type')?.data.toString()
    if (!identifier || !file || !fileName || !type) return apiError(event, 400, 'VALIDATION_ERROR', 'Missing required fields')

    if (!['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/gif', 'image/webp'].includes(type)) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'File must be an image')
    }
    const mimeType = type as 'image/jpeg' | 'image/png' | 'image/bmp' | 'image/tiff' | 'image/gif' | 'image/webp'

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    if (apiPost.user_id !== user.id && user.role !== 'admin') return apiError(event, 403, 'FORBIDDEN', 'Not authorized')

    const extension = type.split('/')[1]
    const coverFolder = `posts/${apiPost.id}/cover`
    const { Jimp } = await import('jimp')
    const originalImage = await Jimp.fromBuffer(file)

    const sizes = [
      { width: 160, suffix: 'xxs' }, { width: 320, suffix: 'xs' },
      { width: 640, suffix: 'sm' }, { width: 1024, suffix: 'md' },
      { width: 1920, suffix: 'lg' },
    ]

    const hb = blob
    const fileBlob = new Blob([new Uint8Array(file)], { type })
    await hb.put(`original.${extension}`, fileBlob, { prefix: coverFolder })
    const resizedMimeType = mimeType === 'image/webp' ? 'image/png' : mimeType
    const resizedExtension = resizedMimeType === 'image/jpeg' ? 'jpg' : resizedMimeType.slice('image/'.length)

    for (const size of sizes) {
      const resized = originalImage.clone().resize({ w: size.width })
      const buffer = await resized.getBuffer(resizedMimeType)
      await hb.put(`${coverFolder}/${size.suffix}.${resizedExtension}`, new Blob([new Uint8Array(buffer)], { type: resizedMimeType }), { addRandomSuffix: false })
    }

    const originalPath = `/${coverFolder}/original.${extension}`
    await db.update(schema.posts).set({
      image_src: originalPath, image_alt: fileName, image_ext: extension, updated_at: new Date().toISOString(),
    }).where(eq(schema.posts.id, apiPost.id)).run()

    try {
      const { blobs } = await hb.list({ prefix: 'og/', limit: 1000 })
      for (const blobItem of blobs) {
        if (blobItem.pathname.includes(`/post/${apiPost.slug}`) || blobItem.pathname.includes(`/post/${apiPost.id}`)) {
          await hb.delete(blobItem.pathname)
        }
      }
    } catch {}

    try {
      const baseUrl = useRuntimeConfig().public.siteUrl
      await $fetch(`${baseUrl}/og/post/${encodeURIComponent(apiPost.slug)}.png`)
    } catch {}

    return apiCreated(event, { alt: fileName, src: originalPath, ext: extension })
  } catch (err: any) {
    console.error('[API v1] POST /posts/:id/cover error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to upload cover')
  }
})
