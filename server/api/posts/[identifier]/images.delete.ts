// DELETE /api/posts/[identifier]/images
// Accepts query ?id=<imageRowId> or ?filename=<filename> to remove a single inline image
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { assertPostPermission } from '~~/server/utils/postPermissions'
import { isPostMediaReferencedInArticleHistory } from '~~/server/utils/postRevisions'
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const database = db
  const hb = blob

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const post: ApiPost | null = await getPostByIdentifier(database, identifier)
  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  await assertPostPermission({ id: session.user.id, role: session.user.role }, post, 'edit')

  const query = getQuery(event)
  const id = query.id ? Number(query.id) : null
  const filename = typeof query.filename === 'string' ? query.filename : null

  if (!id && !filename) {
    throw createError({ statusCode: 400, message: 'Provide id or filename' })
  }

  try {
    let record: any = null

    if (id) {
      record = await database.query.post_images.findFirst({ where: eq(schema.post_images.id, id) })
    } else if (filename) {
      record = await database.query.post_images.findFirst({
        where: and(eq(schema.post_images.filename, filename), eq(schema.post_images.post_id, post.id)),
      })
    }

    if (!record) {
      throw createError({ statusCode: 404, message: 'Image not found' })
    }

    // Ensure record belongs to this post
    if (record.post_id !== post.id) {
      throw createError({ statusCode: 403, message: 'Image belongs to a different post' })
    }

    const pathname = record.pathname.replace(/^\/+/, '')
    const referencedByArticle = await isPostMediaReferencedInArticleHistory(post.id, pathname, post.blob_path)
    if (!referencedByArticle) {
      try {
        await hb.del(pathname)
      } catch (err) {
        console.warn('Failed to delete blob for inline image', err)
      }
    }

    // Delete DB record
    await database.delete(schema.post_images).where(eq(schema.post_images.id, record.id)).run()

    return { success: true }
  } catch (err: any) {
    console.error('Failed to delete inline image', err)
    throw createError({ statusCode: 500, message: err?.message || 'Failed to delete image' })
  }
})
