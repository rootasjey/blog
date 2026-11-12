import { eventHandler } from 'h3'
import { getAboutPageContent, getHomeIdentity, getHomePostSections, getRecommendationsContent, getSiteBrandName, getSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async () => {
  const [socials, siteBrandName, homeIdentity, homePostSections, recommendationsContent, aboutPageContent] = await Promise.all([
    getSocials(), getSiteBrandName(), getHomeIdentity(), getHomePostSections(), getRecommendationsContent(), getAboutPageContent(),
  ])
  return { socials, siteBrandName, homeIdentity, homePostSections, recommendationsContent, aboutPageContent }
})
