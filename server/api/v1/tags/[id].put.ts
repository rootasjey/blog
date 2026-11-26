import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { isTablerTagIcon, isTagIconName, sanitizeTagIconBody } from '~~/shared/constants/tag-icons'
import { isTagColor } from '~~/shared/constants/tag-colors'
import { requireAdminSession } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isFinite(id)) return apiError(event, 400, 'BAD_REQUEST', 'Invalid tag ID')

    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    if (!name) return apiError(event, 400, 'VALIDATION_ERROR', 'Tag name is required')

    const category = String(body?.category || 'general').trim()
    const description = String(body?.description || '').trim()
    const title_fr = typeof body?.title_fr === 'string' ? body.title_fr.trim() : undefined
    const title_en = typeof body?.title_en === 'string' ? body.title_en.trim() : undefined
    const description_fr = typeof body?.description_fr === 'string' ? body.description_fr.trim() : undefined
    const description_en = typeof body?.description_en === 'string' ? body.description_en.trim() : undefined
    if (body?.icon != null && body.icon !== '' && !isTagIconName(body.icon)) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid tag icon')
    }
    if (body?.color != null && body.color !== '' && !isTagColor(body.color)) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid tag color')
    }
    const iconSvg = isTablerTagIcon(body?.icon) ? sanitizeTagIconBody(body.icon_svg) : null
    if (isTablerTagIcon(body?.icon) && !iconSvg) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid Tabler icon data')
    }
    const iconUpdate = body?.icon === undefined ? {} : {
      icon: isTagIconName(body.icon) ? body.icon : null,
      icon_svg: iconSvg,
    }
    const colorUpdate = body?.color === undefined ? {} : { color: isTagColor(body.color) ? body.color : null }

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
    const rowsWritten = Number((result as any)?.rowsAffected ?? 0)
    if (!rowsWritten) return apiError(event, 404, 'NOT_FOUND', 'Tag not found')

    const tag = await db.query.tags.findFirst({ where: eq(schema.tags.id, id) })
    return apiSuccess(event, tag)
  } catch (err: any) {
    console.error('[API v1] PUT /tags/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to update tag')
  }
})
