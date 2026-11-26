import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { isTablerTagIcon, isTagIconName, sanitizeTagIconBody } from '~~/shared/constants/tag-icons'
import { isTagColor } from '~~/shared/constants/tag-colors'
import { getInsertedRowId, requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  try {
    const body = await readBody(event)

    const name = String(body?.name || body?.title_en || body?.title_fr || '').trim()
    if (!name) return apiError(event, 400, 'VALIDATION_ERROR', 'Tag name is required')

    const category = String(body?.category || 'general').trim()
    const title_fr = typeof body?.title_fr === 'string' ? body.title_fr.trim() : name
    const title_en = typeof body?.title_en === 'string' ? body.title_en.trim() : name
    const description_fr = String(body?.description_fr || '').trim()
    const description_en = String(body?.description_en || '').trim()
    const description = String(body?.description ?? (description_en || description_fr)).trim()
    if (body?.icon != null && body.icon !== '' && !isTagIconName(body.icon)) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid tag icon')
    }
    const icon_svg = isTablerTagIcon(body?.icon) ? sanitizeTagIconBody(body.icon_svg) : null
    if (isTablerTagIcon(body?.icon) && !icon_svg) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid Tabler icon data')
    }
    if (body?.color != null && body.color !== '' && !isTagColor(body.color)) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid tag color')
    }
    const icon = isTagIconName(body?.icon) ? body.icon : null
    const color = isTagColor(body?.color) ? body.color : null

    const exists = await db.query.tags.findFirst({
      where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)),
    })
    if (exists) return apiError(event, 409, 'CONFLICT', 'Tag already exists')

    const result = await db.insert(schema.tags).values({ name, title_fr, title_en, category, description, description_fr, description_en, icon, icon_svg, color }).run()
    const insertedId = getInsertedRowId(result)

    const tag = insertedId
      ? await db.query.tags.findFirst({ where: eq(schema.tags.id, insertedId) })
      : await db.query.tags.findFirst({ where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)) })

    return apiCreated(event, tag)
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) return apiError(event, 409, 'CONFLICT', 'Tag already exists')
    console.error('[API v1] POST /tags error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create tag')
  }
})
