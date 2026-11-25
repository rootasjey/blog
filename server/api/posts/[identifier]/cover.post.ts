// POST /api/posts/[slug]/cover
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const database = db
  const hb = blob

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const formData = await readMultipartFormData(event)
  
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()

  if (!identifier || !file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  // Check if the file is an image
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/bmp' 
    && type !== 'image/tiff' && type !== 'image/x-ms-bmp' && type !== 'image/gif') {
    throw createError({
      statusCode: 400,
      message: 'File must be an image',
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

  const extension = type.split('/')[1]
  const coverFolder = `posts/${post.id}/cover`
  let stage = 'store-original'
  let originalPath: string

  try {
    const fileBlob = new Blob([new Uint8Array(file)], { type })
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
    await $fetch(`${baseUrl}/og/post/${encodeURIComponent(post.slug)}.png`)
  } catch (err) {
    console.warn('[cover.post] Failed to regenerate OG image for post:', post.id, err)
  }

  return { 
    image: {
      alt: fileName,
      src: originalPath,
    },
    success: true, 
  }
})
