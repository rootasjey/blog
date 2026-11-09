<template>
  <div class="site-page site-settings site-settings--theme">
    <div class="site-settings-content">
      <header class="site-settings-header site-settings-header--detail">
        <NuxtLink :to="localizedPath('/settings', $getLocale())" class="site-settings-back-link">
          <span class="i-ph-arrow-left" aria-hidden="true" />
          <span>{{ $ts('pages.settingsTheme.backToSettings') }}</span>
        </NuxtLink>
        <h1 id="theme-options-heading" class="site-admin-heading">{{ $ts('pages.settingsTheme.heading') }}</h1>
        <p class="site-settings-intro">{{ $ts('pages.settingsTheme.description') }}</p>
      </header>

      <section class="site-settings-section" aria-labelledby="theme-options-heading">
        <div
          class="site-settings-theme-options"
          role="radiogroup"
          aria-labelledby="theme-options-heading"
        >
          <label
            v-for="item in themeItems"
            :key="item.value"
            class="site-settings-theme-choice"
          >
            <input
              v-model="themePreference"
              class="site-settings-theme-radio"
              type="radio"
              name="corpinot-theme"
              :value="item.value"
            >
            <span class="site-settings-theme-choice-copy">
              <span class="site-settings-row-title">{{ item.label }}</span>
              <span class="site-settings-row-description">{{ item.description }}</span>
            </span>
          </label>
        </div>
      </section>

      <section class="site-settings-option-row">
        <div class="site-settings-row-copy">
          <h2 class="site-settings-section-title">{{ $ts('pages.settingsTheme.slashMenuLayout') }}</h2>
          <p class="site-settings-row-description">{{ $ts('pages.settingsTheme.slashMenuLayoutDesc') }}</p>
        </div>
        <NSwitch v-model="slashMenuVertical" switch-checked="primary" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'

const { $ts, $getLocale } = useI18n()
useSeoMeta({ title: `${$ts('pages.settingsTheme.heading')} — ${$ts('seo.siteName')}` })
import { useEditorSettings } from '~/composables/useEditorSettings'

type ThemePreference = 'light' | 'dark' | 'system'

const colorMode = useColorMode()
const themePreference = computed<ThemePreference>({
  get: () => (colorMode.preference as ThemePreference) || 'system',
  set: (value) => {
    colorMode.preference = value
  },
})

const { slashMenuVertical } = useEditorSettings()

const themeItems = [
  {
    value: 'system',
    label: $ts('pages.settingsTheme.system'),
    description: $ts('pages.settingsTheme.systemDesc'),
  },
  {
    value: 'light',
    label: $ts('pages.settingsTheme.light'),
    description: $ts('pages.settingsTheme.lightDesc'),
  },
  {
    value: 'dark',
    label: $ts('pages.settingsTheme.dark'),
    description: $ts('pages.settingsTheme.darkDesc'),
  },
] satisfies Array<{ value: ThemePreference; label: string; description: string }>
</script>
