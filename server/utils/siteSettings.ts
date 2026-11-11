import { db, schema } from 'hub:db'
import { blob } from 'hub:blob'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { DEFAULT_HOME_IDENTITY, type HomeIdentity } from '~~/shared/types/home-identity'
import {
  DEFAULT_ABOUT_PAGE_CONTENT,
  DEFAULT_RECOMMENDATIONS_CONTENT,
  type AboutPageContent,
  type RecommendationsContent,
} from '~~/shared/types/public-page-content'

export const SOCIALS_KEY = 'socials'
export const HOME_IDENTITY_KEY = 'homeIdentity'
export const RECOMMENDATIONS_CONTENT_KEY = 'recommendationsContent'
export const ABOUT_PAGE_CONTENT_KEY = 'aboutPageContent'

export const homeIdentitySchema = z.object({
  avatar: z.string().max(500).refine(value => value.startsWith('/') || /^https:\/\//i.test(value), 'Invalid avatar URL'),
  fr: z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(4000) }),
  en: z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(4000) }),
}).strict()

const localizedTextSchema = z.object({
  fr: z.string().trim().min(1).max(1000),
  en: z.string().trim().min(1).max(1000),
}).strict()

const localizedRecommendationSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
}).strict()

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,49}$/)
const imageSourceSchema = z.string().trim().min(1).max(500).refine(
  value => value.startsWith('/') || /^https:\/\//i.test(value),
  'Image must be a site path or HTTPS URL',
)

export const recommendationsContentSchema = z.object({
  fr: localizedRecommendationSchema,
  en: localizedRecommendationSchema,
  items: z.array(z.object({
    id: idSchema,
    name: localizedTextSchema,
    description: localizedTextSchema,
    href: z.string().url().max(500).refine(value => value.startsWith('https://'), 'Link must use HTTPS'),
    icon: imageSourceSchema,
  }).strict()).max(12),
}).strict().superRefine((value, context) => {
  const ids = value.items.map(item => item.id)
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['items'], message: 'Recommendation IDs must be unique' })
})

const aboutLocaleSchema = z.object({
  heading: z.string().trim().min(1).max(120),
  mainTitle: z.string().trim().min(1).max(500),
  intro: z.string().trim().min(1).max(4000),
  description: z.string().trim().min(1).max(4000),
  openSourceHeading: z.string().trim().min(1).max(200),
  openSourceText: z.string().trim().min(1).max(4000),
  faqHeading: z.string().trim().min(1).max(120),
  faq: z.array(z.object({
    id: idSchema,
    question: localizedTextSchema,
    answer: localizedTextSchema,
  }).strict()).max(20),
  contactHeading: z.string().trim().min(1).max(200),
  contactText: z.string().trim().min(1).max(2000),
}).strict()

export const aboutPageContentSchema = z.object({
  fr: aboutLocaleSchema,
  en: aboutLocaleSchema,
}).strict().superRefine((value, context) => {
  for (const locale of ['fr', 'en'] as const) {
    const ids = value[locale].faq.map(item => item.id)
    if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: [locale, 'faq'], message: 'FAQ IDs must be unique' })
  }
})

type ParsedHomeIdentity = z.infer<typeof homeIdentitySchema>

export const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  label: z.string().optional(),
  order: z.number().optional(),
  enabled: z.boolean().optional(),
})

export const socialsSchema = z.array(socialLinkSchema)

export type SocialLink = z.infer<typeof socialLinkSchema>

export async function getSettingValue<T = unknown>(key: string, fallback: T): Promise<T> {
  const existing = await db.query.site_settings.findFirst({ where: eq(schema.site_settings.key, key) })
  if (!existing?.value) return fallback
  try {
    return JSON.parse(existing.value) as T
  } catch (error) {
    console.error('Failed to parse site setting', key, error)
    return fallback
  }
}

export async function setSettingValue(key: string, value: unknown) {
  const serialized = JSON.stringify(value)
  const existing = await db.query.site_settings.findFirst({ where: eq(schema.site_settings.key, key) })

  if (existing) {
    await db
      .update(schema.site_settings)
      .set({ value: serialized, updated_at: new Date().toISOString() })
      .where(eq(schema.site_settings.id, existing.id))
      .run()
    return
  }

  await db
    .insert(schema.site_settings)
    .values({ key, value: serialized, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .run()
}

export async function getSocials(): Promise<SocialLink[]> {
  return getSettingValue<SocialLink[]>(SOCIALS_KEY, [])
}

export async function setSocials(socials: SocialLink[]) {
  socialsSchema.parse(socials)
  await setSettingValue(SOCIALS_KEY, socials)
}

export async function getHomeIdentity(): Promise<HomeIdentity> {
  const value = await getSettingValue<unknown>(HOME_IDENTITY_KEY, DEFAULT_HOME_IDENTITY)
  const parsed = homeIdentitySchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_HOME_IDENTITY
}

export async function setHomeIdentity(identity: ParsedHomeIdentity) {
  const parsed = homeIdentitySchema.parse(identity)
  const existing = await getHomeIdentity()
  await setSettingValue(HOME_IDENTITY_KEY, parsed)
  const previousPath = existing.avatar.replace(/^\/+/, '')
  if (existing.avatar !== parsed.avatar && previousPath.startsWith('site/home/identity/')) {
    try {
      await blob.del(previousPath)
    } catch (error) {
      console.warn('Failed to remove replaced home avatar', error)
    }
  }
}

export async function getRecommendationsContent(): Promise<RecommendationsContent> {
  const value = await getSettingValue<unknown>(RECOMMENDATIONS_CONTENT_KEY, DEFAULT_RECOMMENDATIONS_CONTENT)
  const parsed = recommendationsContentSchema.safeParse(value)
  return parsed.success ? parsed.data as RecommendationsContent : DEFAULT_RECOMMENDATIONS_CONTENT
}

export async function setRecommendationsContent(content: RecommendationsContent) {
  await setSettingValue(RECOMMENDATIONS_CONTENT_KEY, recommendationsContentSchema.parse(content))
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const value = await getSettingValue<unknown>(ABOUT_PAGE_CONTENT_KEY, DEFAULT_ABOUT_PAGE_CONTENT)
  const parsed = aboutPageContentSchema.safeParse(value)
  return parsed.success ? parsed.data as AboutPageContent : DEFAULT_ABOUT_PAGE_CONTENT
}

export async function setAboutPageContent(content: AboutPageContent) {
  await setSettingValue(ABOUT_PAGE_CONTENT_KEY, aboutPageContentSchema.parse(content))
}
