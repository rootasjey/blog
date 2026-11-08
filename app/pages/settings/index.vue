<template>
  <div class="site-page site-settings site-settings--index">
    <div class="site-settings-content">
      <header class="site-settings-header">
        <h1 class="site-admin-heading">{{ $t('pages.settings.heading') }}</h1>
      </header>

      <nav class="site-settings-list" :aria-label="$t('pages.settings.heading')">
        <div class="site-settings-item site-settings-theme-item">
          <button
            type="button"
            class="site-settings-theme-cycle"
            :aria-label="$t('pages.settings.switchTheme', { theme: themePreferenceLabel })"
            @click="cycleTheme"
          >
            <span :class="[themeIconClass, 'site-settings-row-icon']" aria-hidden="true" />
          </button>
          <NuxtLink :to="localizedPath('/settings/theme', $getLocale())" class="site-settings-row-link">
            <span class="site-settings-row-copy">
              <span class="site-settings-row-title">{{ $t('pages.settings.theme') }}</span>
              <span class="site-settings-row-description">{{ $t('pages.settings.themeDescription') }}</span>
            </span>
            <span class="i-ph-caret-right site-settings-row-chevron" aria-hidden="true" />
          </NuxtLink>
        </div>

        <NuxtLink :to="localizedPath('/profile', $getLocale())" class="site-settings-item site-settings-row-link">
          <span class="i-ph-user-circle-duotone site-settings-row-icon" aria-hidden="true" />
          <span class="site-settings-row-copy">
            <span class="site-settings-row-title">{{ $t('pages.settings.profile') }}</span>
            <span class="site-settings-row-description">{{ $t('pages.settings.profileDescription') }}</span>
          </span>
          <span class="i-ph-caret-right site-settings-row-chevron" aria-hidden="true" />
        </NuxtLink>

        <NuxtLink :to="localizedPath('/settings/ai', $getLocale())" class="site-settings-item site-settings-row-link">
          <span class="i-ph-sparkle-duotone site-settings-row-icon" aria-hidden="true" />
          <span class="site-settings-row-copy">
            <span class="site-settings-row-title">{{ $t('pages.settings.aiSettings') }}</span>
            <span class="site-settings-row-description">{{ $t('pages.settings.aiSettingsDescription') }}</span>
          </span>
          <span class="i-ph-caret-right site-settings-row-chevron" aria-hidden="true" />
        </NuxtLink>

        <NuxtLink :to="localizedPath('/about', $getLocale())" class="site-settings-item site-settings-row-link">
          <span class="i-ph-newspaper-duotone site-settings-row-icon" aria-hidden="true" />
          <span class="site-settings-row-copy">
            <span class="site-settings-row-title">{{ $t('pages.settings.about') }}</span>
            <span class="site-settings-row-description">{{ $t('pages.settings.aboutDescription') }}</span>
          </span>
          <span class="i-ph-caret-right site-settings-row-chevron" aria-hidden="true" />
        </NuxtLink>

        <NuxtLink :to="localizedPath('/credits', $getLocale())" class="site-settings-item site-settings-row-link">
          <span class="i-ph-github-logo-duotone site-settings-row-icon" aria-hidden="true" />
          <span class="site-settings-row-copy">
            <span class="site-settings-row-title">{{ $t('pages.settings.credits') }}</span>
            <span class="site-settings-row-description">{{ $t('pages.settings.creditsDescription') }}</span>
          </span>
          <span class="i-ph-caret-right site-settings-row-chevron" aria-hidden="true" />
        </NuxtLink>
      </nav>

      <div class="site-settings-version-row">
        <span class="site-settings-row-title">{{ $t('pages.settings.appVersion') }}</span>
        <span class="site-settings-row-description">{{ $t('pages.settings.appVersionDescription', { version: appVersion }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t, $getLocale } = useI18n()
useSeoMeta({ title: `${$t('pages.settings.heading')} — ${$t('seo.siteName')}` })

type ThemePreference = 'light' | 'dark' | 'system'

const config = useRuntimeConfig()
const appVersion = (config.public?.appVersion as string) || '0.0.0'

const colorMode = useColorMode()
const themePreference = computed<ThemePreference>(() => (colorMode.preference as ThemePreference) || 'system')
const themePreferenceLabel = computed(() => themePreference.value)
const themeIconClass = computed(() => {
  if (themePreference.value === 'light') return 'i-ph-sun-duotone'
  if (themePreference.value === 'dark') return 'i-ph-moon-duotone'
  return 'i-ph-laptop-duotone'
})

function cycleTheme() {
  const next = themePreference.value === 'system'
    ? 'light'
    : themePreference.value === 'light'
      ? 'dark'
      : 'system'
  colorMode.preference = next
}
</script>

<style scoped>
@layer components {

.animate-entrance {
  opacity: 0;
  transform: translateY(8px) scale(0.996);
  animation: entrance 640ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
}

@keyframes entrance {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-entrance {
    transition: none;
    animation: none;
    opacity: 1;
    transform: none;
  }
}
}
</style>
