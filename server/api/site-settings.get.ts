import { eventHandler } from 'h3'
import { getAboutPageContent, getHomeIdentity, getHomePostSections, getRecommendationsContent, getSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async () => {
  const [socials, homeIdentity, homePostSections, recommendationsContent, aboutPageContent] = await Promise.all([
    getSocials(), getHomeIdentity(), getHomePostSections(), getRecommendationsContent(), getAboutPageContent(),
  ])
  return { socials, homeIdentity, homePostSections, recommendationsContent, aboutPageContent }
})
