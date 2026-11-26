// POST /api/posts/[slug]/cover
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { MAX_COVER_FILE_BYTES, detectCoverMedia } from '~~/shared/utils/cover-media'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const database = db
  const hb = blob

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > MAX_COVER_FILE_BYTES + 64 * 1024) {
    throw createError({ statusCode: 413, message: 'Cover file exceeds the 25 MB limit' })
  }

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find(item => item.name === 'file')
  const file = filePart?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString() || filePart?.filename
  const type = formData?.find(item => item.name === 'type')?.data.toString() || filePart?.type
  const loopValue = formData?.find(item => item.name === 'loop')?.data.toString()
  const loop = loopValue === 'false' ? false : true

  if (!identifier || !file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  const bytes = new Uint8Array(file)
  if (bytes.byteLength > MAX_COVER_FILE_BYTES) {
    throw createError({ statusCode: 413, message: 'Cover file exceeds the 25 MB limit' })
  }

  const media = detectCoverMedia(type, bytes, fileName)
  if (!media) {
    throw createError({
      statusCode: 400,
      message: 'Choose a supported image or MP4/WebM video file',
    })
  }

  const post: ApiPost | null = await getPostByIdentifier(database, identifier)

  if (!post) {
    throw createError({
      statusCode: 404,
      message: 'Post not found',
    })
  }

  await assertPostPermission({ id: session.user.id, role: session.user.role }, post, 'edit')

  const extension = media.extension
  const coverFolder = `posts/${post.id}/cover`
  let stage = 'store-original'
  let originalPath: string

  try {
    const fileBlob = new Blob([bytes], { type: media.contentType })
    const originalBlob = await hb.put(`${coverFolder}/original.${extension}`, fileBlob, {
      addRandomSuffix: false,
    })
    originalPath = `/${originalBlob.pathname.replace(/^\/+/, '')}`

    stage = 'save-post-metadata'
    await database.update(schema.posts)
      .set({
        image_src: originalPath,
        image_alt: fileName,
        image_ext: extension,
        image_loop: loop,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.posts.id, post.id))
      .run()
  } catch (error) {
    console.error('[cover.post] Upload failed', {
      postId: post.id,
      stage,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload cover image',
      message: 'Failed to upload cover image',
      cause: error,
    })
  }

  // Invalidate any legacy OG blobs for this post, then trigger immediate regeneration
  try {
    const { blobs } = await hb.list({ prefix: 'og/', limit: 1000 })
    for (const blobItem of blobs) {
      if (blobItem.pathname.includes(`/post/${post.slug}`) || blobItem.pathname.includes(`/post/${post.id}`)) {
        await hb.delete(blobItem.pathname)
      }
    }
  } catch (err) {
    console.warn('[cover.post] Failed to invalidate OG cache for post:', post.id, err)
  }

  // Trigger synchronous OG regeneration to avoid first-request latency
  try {
    const baseUrl = useRuntimeConfig().public.siteUrl
    if (media.kind !== 'video') {
      await $fetch(`${baseUrl}/og/post/${encodeURIComponent(post.slug)}.png`)
    }
  } catch (err) {
    console.warn('[cover.post] Failed to regenerate OG image for post:', post.id, err)
  }

  return { 
    image: {
      alt: fileName,
      ext: extension,
      loop,
      src: originalPath,
    },
    success: true, 
  }
})
