import { getAboutPageContent, getHomeIdentity, getRecommendationsContent, getSocials } from '~~/server/utils/siteSettings'

export default defineEventHandler(async (event) => {
  try {
    const [socials, homeIdentity, recommendationsContent, aboutPageContent] = await Promise.all([
      getSocials(), getHomeIdentity(), getRecommendationsContent(), getAboutPageContent(),
    ])
    return apiSuccess(event, { socials, homeIdentity, recommendationsContent, aboutPageContent })
  } catch (err: any) {
    console.error('[API v1] GET /site-settings error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch site settings')
  }
})
