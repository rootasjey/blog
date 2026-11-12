import { eventHandler } from 'h3'
import { getAboutPageContent, getHomeIdentity, getHomePostSections, getRecommendationsContent, getSiteBrandName, getSettingValue, getSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async () => {
  const [socials, siteBrandName, homeIdentity, homePostSections, recommendationsContent, aboutPageContent, editorsCanEditAllArticles] = await Promise.all([
    getSocials(), getSiteBrandName(), getHomeIdentity(), getHomePostSections(), getRecommendationsContent(), getAboutPageContent(), getSettingValue('editors_can_edit_all_articles', false),
  ])
  return { socials, siteBrandName, homeIdentity, homePostSections, recommendationsContent, aboutPageContent, editorsCanEditAllArticles }
})
