import { eventHandler } from 'h3'
import { getHomeIdentity, getSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async () => {
  const [socials, homeIdentity] = await Promise.all([getSocials(), getHomeIdentity()])
  return { socials, homeIdentity }
})
