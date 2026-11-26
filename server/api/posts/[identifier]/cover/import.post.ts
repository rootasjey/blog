import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { MAX_COVER_FILE_BYTES } from '~~/shared/utils/cover-media'
import { fetchRemoteCover, getSameSiteImageBlobSource, inspectRemoteCover } from '~~/server/utils/fetchRemoteCover'
import { assertPostPermission } from '~~/server/utils/postPermissions'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const body = await readBody<{ url?: string; alt?: string; loop?: boolean }>(event)
  const url = body?.url?.trim()

  if (!identifier || !url || url.length > 2048) {
    throw createError({ statusCode: 400, statusMessage: 'A valid cover URL is required.' })
  }

  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found.' })
  await assertPostPermission({ id: session.user.id, role: session.user.role }, post, 'edit')

  let remoteCover
  try {
    const sameSiteSource = getSameSiteImageBlobSource(url, useRuntimeConfig().public.siteUrl)
    if (sameSiteSource) {
      const source = await blob.get(sameSiteSource.blobPath)
      if (!source) throw new Error('The cover URL could not be downloaded.')
      if (source.size > MAX_COVER_FILE_BYTES) throw new Error('The cover file exceeds the 25 MB limit.')

      const bytes = new Uint8Array(await source.arrayBuffer())
      remoteCover = inspectRemoteCover(bytes, source.type, sameSiteSource.fileName)
    } else {
      remoteCover = await fetchRemoteCover(url)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The cover URL could not be imported.'
    const statusCode = message.includes('25 MB') ? 413 : 400
    throw createError({ statusCode, statusMessage: message })
  }

  if (remoteCover.bytes.byteLength > MAX_COVER_FILE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'The cover file exceeds the 25 MB limit.' })
  }

  const imageAlt = body.alt?.trim().slice(0, 500) || remoteCover.fileName
  const loop = body.loop !== false
  const extension = remoteCover.media.extension
  const pathname = `posts/${post.id}/cover/original.${extension}`

  try {
    const stored = await blob.put(pathname, new Blob([remoteCover.bytes], { type: remoteCover.contentType }), {
      addRandomSuffix: false,
    })
    const imagePath = `/${stored.pathname.replace(/^\/+/, '')}`
    await db.update(schema.posts)
      .set({
        image_src: imagePath,
        image_alt: imageAlt,
        image_ext: extension,
        image_loop: loop,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.posts.id, post.id))
      .run()

    try {
      const baseUrl = useRuntimeConfig().public.siteUrl
      await $fetch(`${baseUrl}/og/post/${encodeURIComponent(post.slug)}.png`)
    } catch (error) {
      console.warn('[cover.import] Failed to regenerate OG image for post:', post.id, error)
    }

    return {
      image: { alt: imageAlt, ext: extension, loop, src: imagePath },
      success: true,
    }
  } catch (error) {
    console.error('[cover.import] Import failed', {
      postId: post.id,
      error: error instanceof Error ? error.message : String(error),
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to import cover image.',
      cause: error,
    })
  }
})
