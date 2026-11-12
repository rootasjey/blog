import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { upsertPostTags } from '~~/server/utils/tags'
import { generateUniqueSlug } from '~~/server/utils/post'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    if (user.authMethod === 'api_key') {
      return apiError(event, 403, 'FORBIDDEN', 'API keys cannot create posts by duplicating articles')
    }
    if (user.role !== 'writer' && user.role !== 'admin') {
      return apiError(event, 403, 'FORBIDDEN', 'Writer or administrator access required')
    }
    const database = db

    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) {
      return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')
    }

    const source = await getPostByIdentifier(database, identifier) as any
    if (!source) return apiError(event, 404, 'NOT_FOUND', 'Source post not found')

    if (user.role !== 'admin' && source.user_id !== user.id) {
      return apiError(event, 403, 'FORBIDDEN', 'You are not authorized to duplicate this post')
    }

    const newName = `${source.name} (Copy)`
    const newSlug = await generateUniqueSlug(database, `${source.slug}-copy`)

    const insertData: any = {
      name: newName,
      description: source.description ?? '',
      image_src: '',
      image_alt: source.image_alt ?? '',
      image_ext: source.image_ext ?? '',
      language: source.language ?? 'en',
      links: source.links ?? JSON.stringify([]),
      metrics_comments: 0,
      metrics_likes: 0,
      metrics_views: 0,
      slug: newSlug,
      status: 'draft',
      user_id: user.id,
    }

    const result = await database.insert(schema.posts).values(insertData).run()
    const newId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

    if (!newId) return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create duplicate post')

    const sourceTagRows = await database
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, source.id))
      .orderBy(sql`post_tags.rowid ASC`)
    const sourceTags = sourceTagRows.map((r: any) => r.tag)

    try {
      const prefix = `posts/${source.id}/`
      const listResult = await blob.list({ prefix })
      for (const item of listResult.blobs) {
        const srcPath = item.pathname
        const newPath = srcPath.replace(`posts/${source.id}/`, `posts/${newId}/`)
        const blobData = await blob.get(srcPath)
        if (!blobData) continue
        const bytes = await blobData.arrayBuffer()
        await blob.put(newPath, bytes)

        if (source.image_src && typeof source.image_src === 'string' && srcPath === source.image_src) {
          await database.update(schema.posts).set({ image_src: newPath, image_alt: source.image_alt, image_ext: source.image_ext }).where(eq(schema.posts.id, newId)).run()
        }
      }

      if (source.blob_path) {
        const articlePath = source.blob_path
        const articleBlob = await blob.get(articlePath)
        if (articleBlob) {
          const articleText = await articleBlob.text()
          let articleJSON: any
          try {
            articleJSON = JSON.parse(articleText)
          } catch {
            const newArticlePath = `posts/${newId}/article.json`
            const articleBytes = await articleBlob.arrayBuffer()
            await blob.put(newArticlePath, articleBytes)
            await database.update(schema.posts).set({ blob_path: newArticlePath }).where(eq(schema.posts.id, newId)).run()
            articleJSON = null
          }

          if (articleJSON) {
            const oldPrefix = `posts/${source.id}/`
            const newPrefix = `posts/${newId}/`

            const walkAndRewrite = (node: any) => {
              if (!node || typeof node !== 'object') return
              if (node.attrs && typeof node.attrs.src === 'string' && node.attrs.src.includes(oldPrefix)) {
                node.attrs.src = node.attrs.src.replace(oldPrefix, newPrefix)
              }
              if (node.attrs && typeof node.attrs.srcset === 'string' && node.attrs.srcset.includes(oldPrefix)) {
                node.attrs.srcset = node.attrs.srcset.split(oldPrefix).join(newPrefix)
              }
              if (Array.isArray(node.content)) {
                for (const child of node.content) walkAndRewrite(child)
              }
            }

            walkAndRewrite(articleJSON)

            const rewritten = JSON.stringify(articleJSON)
            const newArticlePath = `posts/${newId}/article.json`
            await blob.put(newArticlePath, rewritten)
            await database.update(schema.posts).set({ blob_path: newArticlePath }).where(eq(schema.posts.id, newId)).run()
          }
        }
      }
    } catch {
      try {
        await database.delete(schema.posts).where(eq(schema.posts.id, newId)).run()
        const prefixToDelete = `posts/${newId}/`
        const listAfter = await blob.list({ prefix: prefixToDelete })
        for (const b of listAfter.blobs) {
          await blob.del(b.pathname)
        }
      } catch {}
      return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to duplicate post resources')
    }

    const tagsToCopy = sourceTags || []
    if (Array.isArray(tagsToCopy) && tagsToCopy.length > 0) {
      await upsertPostTags(database, newId, tagsToCopy.map(t => ({ name: t.name, category: (t as any).category })))
    }

    const createdApiPost = await database.query.posts.findFirst({ where: eq(schema.posts.id, newId) })
    if (!createdApiPost) return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch created duplicate post')

    const tagRows = await database
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, newId))
      .orderBy(sql`post_tags.rowid ASC`)

    const post = convertApiToPost(createdApiPost as any, {
      tags: tagRows.map((r: any) => r.tag),
      userName: user.name,
    })

    return apiCreated(event, post)
  } catch (err: any) {
    console.error('[API v1] POST /posts/:identifier/duplicate error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to duplicate post')
  }
})
