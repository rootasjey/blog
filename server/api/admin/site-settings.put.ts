import { eventHandler, readBody, createError } from 'h3'
import {
  aboutPageContentSchema,
  homeIdentitySchema,
  recommendationsContentSchema,
  setAboutPageContent,
  setHomeIdentity,
  setRecommendationsContent,
  setSocials,
  socialsSchema,
} from '~~/server/utils/siteSettings'

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
  if (body?.recommendationsContent !== undefined) {
    const parsed = recommendationsContentSchema.safeParse(body.recommendationsContent)
    if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid recommendations content', data: parsed.error.flatten() })
    await setRecommendationsContent(parsed.data)
  }
  if (body?.aboutPageContent !== undefined) {
    const parsed = aboutPageContentSchema.safeParse(body.aboutPageContent)
    if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid about page content', data: parsed.error.flatten() })
    await setAboutPageContent(parsed.data)
  }
  if (body?.socials === undefined && body?.homeIdentity === undefined && body?.recommendationsContent === undefined && body?.aboutPageContent === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'No supported setting provided' })
  }

  return { message: 'Site settings updated', ...(updatedSocials ? { socials: updatedSocials } : {}) }
})
