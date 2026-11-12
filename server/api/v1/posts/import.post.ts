import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { upsertPostTags } from '~~/server/utils/tags'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    if (user.authMethod === 'api_key' || (user.role !== 'writer' && user.role !== 'admin')) {
      return apiError(event, 403, 'FORBIDDEN', 'Import requires an administrator or writer session')
    }
    const body = await readBody(event)

    const postsInput = Array.isArray(body) ? body : (body?.posts || [body])
    if (!postsInput.length) return apiError(event, 400, 'VALIDATION_ERROR', 'No posts to import')

    const created: any[] = []

    for (const raw of postsInput) {
      const p = raw.post || raw
      const name = String(p?.name || '').trim()
      if (!name) continue
      if (p.status !== undefined && p.status !== 'draft' && p.status !== 'published') {
        return apiError(event, 400, 'VALIDATION_ERROR', 'Imported posts must be draft or published')
      }

      const postData = createPostData(p, user.id)
      postData.slug = await generateUniqueSlug(db, postData.slug)
      if (p.language) postData.language = p.language
      if (p.status) postData.status = p.status
      if (p.image?.src) { postData.image_src = p.image.src; postData.image_alt = p.image?.alt || '' }

      const result = await db.insert(schema.posts).values({
        description: postData.description, image_src: postData.image_src, image_alt: postData.image_alt,
        language: postData.language, links: postData.links, name: postData.name,
        slug: postData.slug, user_id: postData.user_id, status: postData.status,
      }).run()

      const insertedId = Number((result as any)?.lastInsertRowid ?? 0)
      if (!insertedId) continue

      const article = p.article || createArticle()
      const blobPath = `posts/${insertedId}/article.json`
      await blob.put(blobPath, typeof article === 'string' ? article : JSON.stringify(article))
      await db.update(schema.posts).set({ blob_path: blobPath }).where(eq(schema.posts.id, insertedId)).run()

      let tags: any[] = []
      if (Array.isArray(p.tags)) tags = await upsertPostTags(db, insertedId, p.tags)

      const post = convertApiToPost({ ...postData, id: insertedId, blob_path: blobPath, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any, {
        tags, article: JSON.stringify(article), userName: user.name,
      })

      created.push(post)
    }

    return apiSuccess(event, { count: created.length, posts: created })
  } catch (err: any) {
    console.error('[API v1] POST /posts/import error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to import posts')
  }
})
