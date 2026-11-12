import { computed, ref } from 'vue'
import type { HomeIdentity } from '~~/shared/types/home-identity'
import type { HomePostSectionsContent } from '~~/shared/types/home-post-sections'
import type { AboutPageContent, RecommendationsContent } from '~~/shared/types/public-page-content'
import { DEFAULT_SITE_BRAND_NAME } from '~~/shared/types/site-settings'

export type SocialLink = {
  platform: string
  url: string
  label?: string
  order?: number
  enabled?: boolean
}

export type PublicSiteSettings = {
  socials: SocialLink[]
  siteBrandName: string
  homeIdentity?: HomeIdentity
  homePostSections?: HomePostSectionsContent
  recommendationsContent?: RecommendationsContent
  aboutPageContent?: AboutPageContent
}

const defaultSiteSettings = (): PublicSiteSettings => ({
  socials: [],
  siteBrandName: DEFAULT_SITE_BRAND_NAME,
})

export default async function useSiteSettings() {
  const { data: settings, refresh, error: requestError } = await useFetch<PublicSiteSettings>('/api/site-settings', {
    key: 'public-site-settings',
    default: defaultSiteSettings,
  })
  const refreshing = ref(false)
  const saving = ref(false)
  const operationError = ref<string | null>(null)
  const loading = computed(() => refreshing.value || saving.value)
  const error = computed(() => operationError.value || requestError.value?.message || null)

  async function fetchSettings() {
    refreshing.value = true
    operationError.value = null
    try {
      await refresh()
      if (requestError.value) throw requestError.value
    } catch (caught) {
      operationError.value = caught instanceof Error ? caught.message : 'Failed to load site settings'
      throw caught
    } finally {
      refreshing.value = false
    }
  }

  async function updateSocials(socials: SocialLink[]) {
    saving.value = true
    operationError.value = null
    try {
      await $fetch('/api/admin/site-settings', {
        method: 'PUT',
        body: { socials },
      })
      settings.value.socials = socials
    } catch (caught: any) {
      operationError.value = caught?.data?.message || caught?.message || 'Failed to update site settings'
      throw caught
    } finally {
      saving.value = false
    }
  }

  async function updateSiteBrandName(name: string) {
    const normalizedName = name.trim()
    saving.value = true
    operationError.value = null
    try {
      await $fetch('/api/admin/site-settings', {
        method: 'PUT',
        body: { siteBrandName: normalizedName },
      })
      settings.value.siteBrandName = normalizedName
    } catch (caught: any) {
      operationError.value = caught?.data?.message || caught?.message || 'Failed to update site title'
      throw caught
    } finally {
      saving.value = false
    }
  }

  return {
    settings,
    socials: computed(() => settings.value.socials),
    loading,
    error,
    fetchSettings,
    refresh: fetchSettings,
    updateSocials,
    updateSiteBrandName,
  }
}
