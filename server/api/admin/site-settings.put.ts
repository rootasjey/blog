import { eventHandler, readBody, createError } from 'h3'
import { homeIdentitySchema, setHomeIdentity, socialsSchema, setSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  let updatedSocials: unknown[] | undefined
  if (body?.socials !== undefined) {
    const parsed = socialsSchema.safeParse(body.socials)
    if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid socials', data: parsed.error.flatten() })
    await setSocials(parsed.data)
    updatedSocials = parsed.data
  }
  if (body?.homeIdentity !== undefined) {
    const parsed = homeIdentitySchema.safeParse(body.homeIdentity)
    if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid home identity', data: parsed.error.flatten() })
    await setHomeIdentity(parsed.data)
  }
  if (body?.socials === undefined && body?.homeIdentity === undefined) throw createError({ statusCode: 400, statusMessage: 'No supported setting provided' })

  return { message: 'Site settings updated', ...(updatedSocials ? { socials: updatedSocials } : {}) }
})
