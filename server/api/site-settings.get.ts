import { eventHandler } from 'h3'
import { getAboutPageContent, getHomeIdentity, getRecommendationsContent, getSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async () => {
  const [socials, homeIdentity, recommendationsContent, aboutPageContent] = await Promise.all([
    getSocials(), getHomeIdentity(), getRecommendationsContent(), getAboutPageContent(),
  ])
  return { socials, homeIdentity, recommendationsContent, aboutPageContent }
})
