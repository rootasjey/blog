// POST /api/tags
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { isTablerTagIcon, isTagIconName, sanitizeTagIconBody } from '~~/shared/constants/tag-icons'
import { isTagColor } from '~~/shared/constants/tag-colors'
import { requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody(event)
  const name = String(body?.name || body?.title_en || body?.title_fr || '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Tag name is required' })
  }
  
  const category = body.category?.trim() || 'general'
  const title_fr = typeof body.title_fr === 'string' ? body.title_fr.trim() : name
  const title_en = typeof body.title_en === 'string' ? body.title_en.trim() : name
  const description_fr = typeof body.description_fr === 'string' ? body.description_fr.trim() : ''
  const description_en = typeof body.description_en === 'string' ? body.description_en.trim() : ''
  const description = typeof body.description === 'string'
    ? body.description.trim()
    : description_en || description_fr
  if (body.icon != null && body.icon !== '' && !isTagIconName(body.icon)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag icon' })
  }
  const icon_svg = isTablerTagIcon(body.icon) ? sanitizeTagIconBody(body.icon_svg) : null
  if (isTablerTagIcon(body.icon) && !icon_svg) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Tabler icon data' })
  }
  if (body.color != null && body.color !== '' && !isTagColor(body.color)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag color' })
  }
  const icon = isTagIconName(body.icon) ? body.icon : null
  const color = isTagColor(body.color) ? body.color : null

  try {
    const exists = await db.query.tags.findFirst({
      where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)),
    })

    if (exists) {
      throw createError({ statusCode: 409, statusMessage: 'Tag already exists' })
    }

    const result = await db.insert(schema.tags).values({ name, title_fr, title_en, category, description, description_fr, description_en, icon, icon_svg, color }).run()
    const insertedId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

    const tag = insertedId
      ? await db.query.tags.findFirst({ where: eq(schema.tags.id, insertedId) })
      : await db.query.tags.findFirst({ where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)) })

    return tag
  } catch (e: any) {
    if (e.statusCode) {
      throw e
    }
    if (e.message && e.message.includes('UNIQUE')) {
      throw createError({ statusCode: 409, statusMessage: 'Tag already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to create tag' })
  }
})
