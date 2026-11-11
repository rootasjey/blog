import { db, schema } from 'hub:db'
import { blob } from 'hub:blob'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { DEFAULT_HOME_IDENTITY, type HomeIdentity } from '~~/shared/types/home-identity'

export const SOCIALS_KEY = 'socials'
export const HOME_IDENTITY_KEY = 'homeIdentity'

export const homeIdentitySchema = z.object({
  avatar: z.string().max(500).refine(value => value.startsWith('/') || /^https:\/\//i.test(value), 'Invalid avatar URL'),
  fr: z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(4000) }),
  en: z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(4000) }),
}).strict()

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
