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

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (session.user.role !== 'admin') return apiError(event, 403, 'FORBIDDEN', 'Admin access required')

    const body = await readBody(event)
    let updatedSocials: unknown[] | undefined
    if (body?.socials !== undefined) {
      const parsed = socialsSchema.safeParse(body.socials)
      if (!parsed.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid socials format')
      await setSocials(parsed.data)
      updatedSocials = parsed.data
    }
    if (body?.homeIdentity !== undefined) {
      const parsed = homeIdentitySchema.safeParse(body.homeIdentity)
      if (!parsed.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid home identity format')
      await setHomeIdentity(parsed.data)
    }
    if (body?.recommendationsContent !== undefined) {
      const parsed = recommendationsContentSchema.safeParse(body.recommendationsContent)
      if (!parsed.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid recommendations content format')
      await setRecommendationsContent(parsed.data)
    }
    if (body?.aboutPageContent !== undefined) {
      const parsed = aboutPageContentSchema.safeParse(body.aboutPageContent)
      if (!parsed.success) return apiError(event, 400, 'VALIDATION_ERROR', 'Invalid about page content format')
      await setAboutPageContent(parsed.data)
    }
    if (body?.socials === undefined && body?.homeIdentity === undefined && body?.recommendationsContent === undefined && body?.aboutPageContent === undefined) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'No supported setting provided')
    }

    return apiSuccess(event, { message: 'Site settings updated', ...(updatedSocials ? { socials: updatedSocials } : {}) })
  } catch (err: any) {
    console.error('[API v1] PUT /admin/site-settings error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to update site settings')
  }
})
