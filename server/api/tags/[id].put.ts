// PUT /api/tags/:id
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { isTablerTagIcon, isTagIconName, sanitizeTagIconBody } from '~~/shared/constants/tag-icons'
import { isTagColor } from '~~/shared/constants/tag-colors'
import { requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const idParam = event.context.params?.id
  const body = await readBody(event)
  if (!idParam || !body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Tag id and name are required' })
  }
  const id = Number(idParam)
  const name = body.name.trim()
  const category = body.category?.trim() || 'general'
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const title_fr = typeof body.title_fr === 'string' ? body.title_fr.trim() : undefined
  const title_en = typeof body.title_en === 'string' ? body.title_en.trim() : undefined
  const description_fr = typeof body.description_fr === 'string' ? body.description_fr.trim() : undefined
  const description_en = typeof body.description_en === 'string' ? body.description_en.trim() : undefined
  if (body.icon != null && body.icon !== '' && !isTagIconName(body.icon)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag icon' })
  }
  if (body.color != null && body.color !== '' && !isTagColor(body.color)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag color' })
  }
  const iconSvg = isTablerTagIcon(body.icon) ? sanitizeTagIconBody(body.icon_svg) : null
  if (isTablerTagIcon(body.icon) && !iconSvg) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Tabler icon data' })
  }
  const iconUpdate = body.icon === undefined ? {} : {
    icon: isTagIconName(body.icon) ? body.icon : null,
    icon_svg: iconSvg,
  }
  const colorUpdate = body.color === undefined ? {} : { color: isTagColor(body.color) ? body.color : null }

  const result = await db.update(schema.tags).set({
    name,
    category,
    description,
    ...(title_fr === undefined ? {} : { title_fr }),
    ...(title_en === undefined ? {} : { title_en }),
    ...(description_fr === undefined ? {} : { description_fr }),
    ...(description_en === undefined ? {} : { description_en }),
    ...iconUpdate,
    ...colorUpdate,
  }).where(eq(schema.tags.id, id)).run()
  const rowsWritten = Number((result as any)?.rowsAffected ?? (result as any)?.meta?.changes ?? (result as any)?.meta?.rows_written ?? 0)

  if (!rowsWritten) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const tag = await db.query.tags.findFirst({ where: eq(schema.tags.id, id) })
  return tag
})
