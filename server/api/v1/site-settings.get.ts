import { getHomeIdentity, getSocials } from '~~/server/utils/siteSettings'

export default defineEventHandler(async (event) => {
  try {
    const [socials, homeIdentity] = await Promise.all([getSocials(), getHomeIdentity()])
    return apiSuccess(event, { socials, homeIdentity })
  } catch (err: any) {
    console.error('[API v1] GET /site-settings error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch site settings')
  }
})
