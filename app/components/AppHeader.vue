<template>
  <!-- Mobile Menu Drawer -->
  <aside
    v-if="isMobileMenuOpen"
    class="fixed inset-0 z-50 bg-black/50 lg:hidden"
    @click="closeMobileMenu"
  >
    <div
      class="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 overflow-y-auto"
      @click.stop
    >
      <div class="p-6">
        <button @click="closeMobileMenu" class="mb-8">
          <div class="i-ph-x w-6 h-6"></div>
        </button>

        <nav class="space-y-1">
          <NuxtLink
            :to="localizedPath('/', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            :to="localizedPath('/about', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.about') }}
          </NuxtLink>
          <NuxtLink
            :to="localizedPath('/authors', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.authors') }}
          </NuxtLink>
          <NuxtLink
            :to="localizedPath('/tags', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.tags') }}
          </NuxtLink>
          <NuxtLink
            :to="localizedPath('/recommendations', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.recommendations') }}
          </NuxtLink>
          <template v-if="!isLoggedIn">
            <NuxtLink
              :to="localizedPath('/signin', $getLocale())"
              class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
              @click="closeMobileMenu"
            >
              {{ $t('common.signin') }}
            </NuxtLink>
          </template>
          <template v-else>
            <button @click="() => { handleLogout(); closeMobileMenu(); }" class="w-full text-left block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">{{ $t('common.signout') }}</button>
          </template>
          <NuxtLink
            :to="localizedPath('/signup', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('common.signup') }}
          </NuxtLink>
          <NuxtLink
            :to="localizedPath('/subscribe', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('common.subscribe') }}
          </NuxtLink>
          <NuxtLink
            :to="localizedPath('/membership', $getLocale())"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.membership') }}
          </NuxtLink>
        </nav>

        <!-- Language Switcher (Mobile) -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 px-4">{{ $t('common.language') }}</p>
          <div class="flex flex-wrap gap-2 px-4">
            <NuxtLink
              v-for="locale in $getLocales()"
              :key="locale.code"
              :to="$switchLocalePath(locale.code)"
              class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              :class="locale.code === $getLocale()
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              {{ locale.displayName || locale.code }}
            </NuxtLink>
          </div>
        </div>

        <!-- Social Icons in Mobile Drawer -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-4 px-4">
            <a
              v-for="s in orderedSocials"
              :key="s.platform + s.url"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="site-interactive-hover text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <div :class="`${iconClass(s.platform)} w-5 h-5`"></div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <header class="site-masthead">
    <div class="mx-auto">
      <!-- Mobile Top Bar -->
      <div class="lg:hidden flex items-center justify-between px-4 py-3"
        :class="{
          'bg-white/80 dark:bg-gray-950/80 backdrop-blur': isScrolled
        }"
      >
        <NuxtLink :to="localizedPath('/', $getLocale())" class="site-mobile-brand ml-1 flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full">
          <span
            class="site-wordmark font-title font-bold text-xl"
            :class="{
              'text-white': !isScrolled && router.currentRoute.value.path === '/',
            }"
          >
          {{ $t('nav.brand') }}
        </span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <NButton
            icon
            btn="ghost-gray"
            class="hover:scale-105 active:scale-99 transition-transform"
            :class="{
              'color-white': scrollY === 0 && router.currentRoute.value.path === '/',
            }"
            @click="toggleTheme"
            :aria-label="$t('nav.toggleTheme')"
          >
            <!-- SSR friendly: render both icons and toggle with CSS `dark:` utilities to avoid hydration mismatch. -->
            <div class="i-ph-moon-bold block dark:hidden w-6 h-6"></div>
            <div class="i-ph-sun-bold hidden dark:block w-6 h-6"></div>
            <span class="sr-only">{{ $t('nav.toggleTheme') }}</span>
          </NButton>
        </div>
      </div>

      <!-- Desktop Header -->
      <div class="site-header-desktop">
        <!-- Row 1: Centered Logo -->
        <div
          class="site-header-brand"
        >
          <NuxtLink :to="localizedPath('/', $getLocale())" class="flex items-center">
            <span
              class="site-wordmark"
            >
              {{ $t('nav.brand') }}
            </span>
          </NuxtLink>
        </div>

        <!-- Row 2: Social | Navigation | Auth -->
        <div class="site-header-grid grid items-center px-6 max-w-7xl mx-auto grid-cols-3">
          <!-- Left: Social Icons -->
          <div class="site-header-social">
            <a
              v-for="s in orderedSocials"
              :key="s.platform + s.url"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <div :class="`${iconClass(s.platform)} w-4.5 h-4.5`"></div>
            </a>
          </div>

          <!-- Center: Navigation Links -->
          <nav class="site-header-nav">
            <NuxtLink :to="localizedPath('/', $getLocale())" class="site-interactive-hover font-600 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white">
              {{ $t('nav.home') }}
            </NuxtLink>
            <NuxtLink :to="localizedPath('/posts', $getLocale())" class="site-interactive-hover font-600 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white">
              {{ $t('nav.posts') }}
            </NuxtLink>
            <NuxtLink :to="localizedPath('/projects', $getLocale())" class="site-interactive-hover font-600 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white">
              {{ $t('nav.projects') }}
            </NuxtLink>
            <div
              class="site-header-pages"
              :data-open="isPagesMenuOpen"
              @mouseenter="isPagesMenuOpen = true"
              @mouseleave="isPagesMenuOpen = false"
              @focusin="isPagesMenuOpen = true"
              @focusout="closePagesMenuOnFocusLeave"
              @keydown.esc="isPagesMenuOpen = false"
            >
              <button
                type="button"
                class="site-interactive-hover"
                :aria-expanded="isPagesMenuOpen"
                aria-haspopup="true"
                @click="isPagesMenuOpen = true"
              >
                {{ pagesLabel }}
              </button>
              <nav class="site-header-pages-menu" :aria-label="pagesLabel">
                <NuxtLink :to="localizedPath('/about', $getLocale())">{{ $t('nav.about') }}</NuxtLink>
                <NuxtLink :to="localizedPath('/tags', $getLocale())">{{ $t('nav.tags') }}</NuxtLink>
                <NuxtLink :to="localizedPath('/recommendations', $getLocale())">{{ $t('nav.recommendations') }}</NuxtLink>
                <NuxtLink :to="localizedPath('/authors', $getLocale())">{{ $t('nav.authors') }}</NuxtLink>
                <NuxtLink :to="localizedPath('/credits', $getLocale())">{{ $t('footer.credits') }}</NuxtLink>
              </nav>
            </div>
          </nav>

          <!-- Right: Auth + Search + Theme -->
          <div class="site-header-controls flex items-center gap-3 justify-self-end">
            <template v-if="!isLoggedIn">
              <NuxtLink :to="localizedPath('/signin', $getLocale())" class="site-interactive-hover text-sm font-600 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                {{ $t('common.signin') }}
              </NuxtLink>
            </template>

            <template v-else>
              <NDropdownMenu :items="dropdownItems">
                <NButton btn="~" rounded="full" class="site-interactive-hover site-header-avatar-trigger min-w-0 p-0">
                  <NuxtImg
                    v-if="currentAvatarProvider === 'hubblob' && !generatedAvatarFailed"
                    provider="hubblob"
                    :src="currentAvatarUrl"
                    :alt="currentUser.value?.name || $t('common.profile')"
                    class="site-header-avatar-image w-6 h-6 rounded-full"
                    @error="generatedAvatarFailed = true"
                  />
                  <img
                    v-else-if="currentAvatarUrl && !generatedAvatarFailed"
                    :src="currentAvatarUrl"
                    :alt="currentUser.value?.name || $t('common.profile')"
                    class="site-header-avatar-image w-6 h-6 rounded-full"
                    @error="generatedAvatarFailed = true"
                  />
                  <NAvatar v-else :label="userInitial" avatar="solid-black" size="xs" class="important:font-600 font-title" />
                </NButton>
              </NDropdownMenu>
            </template>
            <NuxtLink :to="localizedPath('/donate', $getLocale())" class="site-interactive-hover site-header-donate uppercase px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wide rounded-4 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              {{ $t('nav.donate') }}
            </NuxtLink>

            <NCombobox
              v-if="!isLoggedIn"
              :items="themeOptions"
              by="value"
              :model-value="currentThemeObj"
              @update:model-value="onThemeChange"
              size="xs"
              :una="{ combobox: 'w-auto min-w-0', comboboxList: 'w-44 min-w-44 site-header-combobox-menu' }"
              :_combobox-trigger="{ trailing: '', una: { comboboxTrigger: 'site-interactive-hover site-header-control-trigger site-header-theme-trigger w-7 h-7 min-w-7 min-h-7 p-0 border-none shadow-none hover:shadow-none focus:shadow-none', comboboxTriggerTrailing: 'hidden', btnTrailing: 'hidden' } }"
              :_combobox-input="{ class: 'border-none' }"
            >
              <template #trigger="{ modelValue }">
                <div :class="modelValue?.icon || 'i-ph-sun'" class="site-theme-icon" />
              </template>
              <template #label="{ item }">
                <div class="flex items-center gap-2 text-xs">
                  <div :class="item.icon" class="w-4 h-4" />
                  {{ item.label }}
                </div>
              </template>
            </NCombobox>
            <button v-if="!isLoggedIn" type="button" @click="openSearch" class="site-interactive-hover site-header-search text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors" :aria-label="$t('nav.openSearch')">
              <div class="i-ph-magnifying-glass w-3.5 h-3.5"></div>
            </button>
            <NCombobox
              v-if="!isLoggedIn"
              :items="localeOptions"
              by="code"
              :model-value="currentLocaleObj"
              @update:model-value="onLocaleChange"
              size="xs"
              :una="{ combobox: 'w-auto min-w-0', comboboxList: 'w-auto cursor-pointer site-header-combobox-menu' }"
              :_combobox-trigger="{ trailing: '', una: { comboboxTrigger: 'site-interactive-hover site-header-control-trigger site-header-locale-trigger w-auto min-w-0 border-none shadow-none hover:shadow-none focus:shadow-none', comboboxTriggerTrailing: 'hidden', btnTrailing: 'hidden' } }"
              :_combobox-input="{ class: 'border-none' }"
            >
              <template #trigger="{ modelValue }">
                <span class="text-sm font-semibold uppercase tracking-wide">{{ modelValue?.code?.toUpperCase() || 'EN' }}</span>
              </template>
              <template #label="{ item }">
                <span class="text-xs">{{ item.displayName }}</span>
              </template>
            </NCombobox>
          </div>
        </div>
      </div>
    </div>
  </header>

  <ClientOnly>
    <AdminSiteSettingsDrawer v-model:open="siteSettingsDrawerOpen" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, isRef, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHeaderScroll } from '../composables/useHeaderScroll'
import useGlobalSearch from '~/composables/useGlobalSearch'
import useSiteSettings from '~/composables/useSiteSettings'
import { localizedPath } from '~/utils/presentationPosts'
import { troncheAvatarUrl } from '~/utils/troncheAvatar'

type ThemePreference = 'light' | 'dark' | 'system'
type ThemeMenuScope = 'desktop' | 'mobile'

const { user, loggedIn, fetch: refreshSession, clear: clearSession } = useUserSession()
const router = useRouter()
const { socials: siteSocials } = useSiteSettings()

const orderedSocials = computed(() => [...siteSocials.value].filter((s) => s.enabled !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

const isLoggedIn = computed(() => (typeof loggedIn === 'boolean' ? loggedIn : loggedIn.value))
const currentUser = computed(() => (isRef(user) ? (user.value as any) : user as any))
const userInitial = computed(() => (currentUser.value?.name ? currentUser.value.name.charAt(0).toUpperCase() : ''))
const generatedAvatarFailed = ref(false)
const currentAvatarUrl = computed(() => currentUser.value?.avatar || troncheAvatarUrl(currentUser.value?.name || '', 64))
const currentAvatarProvider = computed(() => currentAvatarUrl.value.startsWith('/users/') ? 'hubblob' : undefined)
watch(currentAvatarUrl, () => { generatedAvatarFailed.value = false })
const isAdmin = computed(() => isLoggedIn.value && currentUser.value?.role === 'admin')

const isMobileMenuOpen = ref(false)
const isPagesMenuOpen = ref(false)
const colorMode = useColorMode()
const { isScrolled, y: scrollY } = useHeaderScroll({ threshold: 12 })
const siteSettingsDrawerOpen = ref(false)

const desktopThemeMenu = createThemeMenuController()
const mobileThemeMenu = createThemeMenuController()
const desktopThemeOpen = computed({
  get: () => desktopThemeMenu.open.value,
  set: (val: boolean) => onThemeMenuOpenChange('desktop', val),
})
const mobileThemeOpen = computed({
  get: () => mobileThemeMenu.open.value,
  set: (val: boolean) => onThemeMenuOpenChange('mobile', val),
})

// Global search modal
const { open: openSearchModal } = useGlobalSearch()
function openSearch() { openSearchModal() }

function goSearch() {
  router.push(localizedPath('/search', $getLocale()))
}

async function handleLogout() {
  try {
    await $fetch('/api/logout', { method: 'POST' })
    await clearSession()
    await refreshSession()
    router.push(localizedPath('/', $getLocale()))
  } catch (err) {
    console.error('Logout failed', err)
  }
}

const { $t, $ts, $getLocale, $switchLocale, $getLocales } = useI18n()
const pagesLabel = computed(() => {
  const translated = $t('nav.pages')
  return translated.toLocaleLowerCase() === 'nav.pages' ? 'Pages' : translated
})

const localeOptions = computed(() => $getLocales().map(l => ({ code: l.code, displayName: l.displayName || l.code })))

const currentLocaleObj = computed(() => {
  const code = $getLocale()
  return localeOptions.value.find(l => l.code === code) || localeOptions.value[0]
})

function onLocaleChange(item: { code: string } | null) {
  if (item?.code) $switchLocale(item.code)
}

const themeOptions = computed(() => [
  { value: 'light', label: $ts('nav.light'), icon: 'i-ph-sun' },
  { value: 'dark', label: $ts('nav.dark'), icon: 'i-ph-moon' },
  { value: 'system', label: $ts('nav.system'), icon: 'i-ph-laptop' },
])

const currentThemeObj = computed(() => {
  const pref = colorMode.preference as ThemePreference
  return themeOptions.value.find(o => o.value === pref) || themeOptions.value[0]
})

const dropdownItems = computed(() => [
  { label: $t('common.search'), leading: 'i-ph-magnifying-glass', onSelect: openSearch },
  { class: 'site-header-user-menu-separator', _dropdownMenuSeparator: { class: 'site-header-user-menu-separator' } },
  {
    label: $t('common.language'),
    leading: 'i-ph-globe',
    items: localeOptions.value.map(locale => ({
      label: locale.displayName,
      trailing: locale.code === $getLocale() ? 'i-ph-check' : undefined,
      onSelect: () => onLocaleChange(locale),
    })),
  },
  {
    label: $t('nav.theme'),
    leading: 'i-ph-sun',
    items: themeOptions.value.map(theme => ({
      label: theme.label,
      leading: theme.icon,
      trailing: theme.value === currentThemeObj.value.value ? 'i-ph-check' : undefined,
      onSelect: () => onThemeChange(theme),
    })),
  },
  { class: 'site-header-user-menu-separator', _dropdownMenuSeparator: { class: 'site-header-user-menu-separator' } },
  ...(isAdmin.value
    ? [{ label: $t('nav.siteSocials'), leading: 'i-ph-share-network', onSelect: () => { siteSettingsDrawerOpen.value = true } }]
    : []),
  { label: $t('common.settings'), leading: 'i-ph-gear-six', onSelect: () => { router.push(localizedPath('/settings', $getLocale())) } },
  { label: $t('common.profile'), leading: 'i-ph-user-circle', onSelect: () => { router.push(localizedPath('/profile', $getLocale())) } },
  { class: 'site-header-user-menu-separator', _dropdownMenuSeparator: { class: 'site-header-user-menu-separator' } },
  { label: $t('common.signout'), leading: 'i-ph-sign-out', onSelect: async () => { await handleLogout() } },
])

function onThemeChange(item: { value: string } | null) {
  if (item?.value) setThemePreference(item.value as ThemePreference)
}

const dropdownContentProps = computed(() => ({
  align: 'end' as const,
  onEscapeKeyDown: () => closeThemeMenus(),
  onInteractOutside: () => closeThemeMenus(),
  onPointerDownOutside: () => closeThemeMenus(),
  onFocusOutside: () => closeThemeMenus(),
}))

function setThemePreference(preference: ThemePreference) {
  colorMode.preference = preference
  closeThemeMenus()
}

function closeThemeMenus() {
  desktopThemeMenu.close()
  mobileThemeMenu.close()
}

function openThemeMenu(scope: ThemeMenuScope) {
  closeThemeMenus()
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.requestOpen()
}

function onThemeMenuOpenChange(scope: ThemeMenuScope, nextOpen: boolean) {
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.handleOpenChange(nextOpen)
  if (!nextOpen) {
    const otherMenu = scope === 'desktop' ? mobileThemeMenu : desktopThemeMenu
    otherMenu.close()
  }
}

function onThemePressStart(scope: ThemeMenuScope, event: PointerEvent) {
  if (event.pointerType !== 'touch') return
  closeThemeMenus()
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.scheduleLongPress()
}

function onThemePressEnd(scope: ThemeMenuScope) {
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.cancelLongPress()
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function closePagesMenuOnFocusLeave(event: FocusEvent) {
  const menu = event.currentTarget as HTMLElement
  if (!menu.contains(event.relatedTarget as Node | null)) {
    isPagesMenuOpen.value = false
  }
}

function toggleTheme() {
  let newColorMode: ThemePreference = 'light'
  switch  (colorMode.preference) {
    case 'light':
      newColorMode = 'dark'
      break
    case 'dark':
      newColorMode = 'system'
      break
    case 'system':
      newColorMode = 'light'
      break
  }
  colorMode.value = newColorMode
  console.log('Toggling theme to', colorMode.value)
  setThemePreference(newColorMode)
}

function createThemeMenuController() {
  const open = ref(false)
  const allowOpen = ref(false)
  const longPressTimer = ref<number | null>(null)

  function clearTimer() {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }

  function requestOpen() {
    allowOpen.value = true
    open.value = true
  }

  function scheduleLongPress() {
    if (!import.meta.client) return
    clearTimer()
    longPressTimer.value = window.setTimeout(() => {
      allowOpen.value = true
      open.value = true
    }, 450)
  }

  function cancelLongPress() {
    clearTimer()
    if (!open.value) allowOpen.value = false
  }

  function close() {
    clearTimer()
    open.value = false
    allowOpen.value = false
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      close()
      return
    }

    if (!allowOpen.value) {
      open.value = false
      return
    }

    open.value = true
  }

  onBeforeUnmount(clearTimer)

  return { open, requestOpen, scheduleLongPress, cancelLongPress, close, handleOpenChange }
}

function iconClass(platform?: string) {
  if (!platform) return 'i-ph-link'
  const p = platform.toLowerCase()
  if (p.includes('twitter') || p === 'x') return 'i-ph-x-logo'
  if (p.includes('facebook')) return 'i-ph-facebook-logo'
  if (p.includes('instagram')) return 'i-ph-instagram-logo'
  if (p.includes('pinterest')) return 'i-ph-pinterest-logo'
  if (p.includes('youtube')) return 'i-ph-youtube-logo'
  if (p.includes('tiktok')) return 'i-ph-tiktok-logo'
  if (p.includes('github')) return 'i-ph-github-logo'
  if (p.includes('linkedin')) return 'i-ph-linkedin-logo'
  return 'i-ph-link'
}
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-wordmark { font-family: var(--site-font-body); }
.site-shell .site-masthead { background: var(--site-color-background); color: var(--site-color-text); }
.site-shell .site-header-desktop {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  width: min(700px, calc(100% - 32px));
  max-width: 700px;
  height: 60px;
  box-sizing: border-box;
  margin-inline: auto;
  padding: 0;
  border: 0;
  background: transparent;
}
.site-shell .site-header-brand {
  grid-column: 1;
  grid-row: 1;
  justify-content: flex-start;
  margin: 0;
  padding: 0;
  border: 0;
}
.site-shell .site-header-brand .site-wordmark { color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 16px; font-weight: 600; letter-spacing: 0; line-height: 24px; white-space: nowrap; }
.site-shell .site-header-grid { display: contents; }
.site-shell .site-header-social { display: none; }
.site-shell .site-header-nav {
  display: flex;
  grid-column: 2;
  grid-row: 1;
  align-items: center;
  justify-self: center;
  gap: 2px;
  color: var(--site-color-text);
  font-family: var(--site-font-body);
  font-size: 14px;
  font-weight: 400;
  text-transform: lowercase;
  white-space: nowrap;
}
.site-shell .site-header-nav a::first-letter { text-transform: uppercase; }
.site-shell .site-header-nav a[aria-current="page"] { border-color: var(--site-color-border); color: var(--site-color-heading); }
.site-shell .site-header-nav a,
.site-shell .site-header-nav button,
.site-shell .site-header-controls a { color: var(--site-color-text); font-weight: 400; text-decoration: none; }
.site-shell .site-header-nav a,
.site-shell .site-header-nav button { display: inline-flex; min-height: 30px; align-items: center; padding: 4px 7px; border: 1px solid transparent; border-radius: 10px; background: transparent; font-weight: 500; }
.site-shell .site-header-nav button { font: inherit; font-weight: 500; text-transform: capitalize; cursor: pointer; }
.site-shell .site-header-pages { position: relative; }
.site-shell .site-header-pages-menu { position: absolute; z-index: 30; top: calc(100% + 8px); left: 50%; display: grid; width: max-content; min-width: 160px; gap: 0; padding: 8px; border: 1px solid var(--site-color-border); border-radius: 10px; background: var(--site-color-background); box-shadow: 0 8px 24px rgb(0 0 0 / 8%); opacity: 0; visibility: hidden; pointer-events: none; transform: translate(-50%, 5px); transition: opacity 160ms ease, transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0s linear 180ms; }
.site-shell .site-header-pages::after { position: absolute; top: 100%; left: calc(50% - 80px); width: 160px; height: 13px; content: ""; }
.site-shell .site-header-pages:hover .site-header-pages-menu,
.site-shell .site-header-pages:focus-within .site-header-pages-menu,
.site-shell .site-header-pages[data-open="true"] .site-header-pages-menu { opacity: 1; visibility: visible; pointer-events: auto; transform: translate(-50%, 0); transition-delay: 0s; }
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-header-pages-menu { transition: none; }
}
.site-shell .site-header-pages-menu a { display: block; padding: 8px 14px; border: 0; border-radius: 6px; color: var(--site-color-text); line-height: 20px; }
.site-shell .site-header-pages-menu a:hover { background: var(--site-color-hover-background); color: var(--site-color-heading); }
.site-shell .site-header-controls {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  gap: 2px;
}
.site-shell .site-header-controls > a:first-child,
.site-shell .site-header-controls > a:nth-child(2) { display: none; }
.site-shell .site-header-controls button { color: var(--site-color-muted); }
.site-shell .site-header-controls .combobox-trigger-trailing { display: none; }
.site-shell .site-header-controls .site-header-control-trigger,
.site-shell .site-header-controls .site-header-search,
.site-shell .site-header-controls .site-header-avatar-trigger,
.site-shell .site-header-controls .site-header-donate {
  transition:
    color 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.site-shell .site-header-controls .site-header-control-trigger {
  border: 0;
  background-color: transparent;
  color: var(--site-color-text);
  box-shadow: none;
}
.site-shell .site-header-controls .site-header-control-trigger:hover,
.site-shell .site-header-controls .site-header-control-trigger:focus-visible {
  background-color: var(--site-color-hover-background);
  color: var(--site-color-heading);
  transform: translateY(-1px);
}
.site-shell .site-header-controls .site-header-control-trigger:active,
.site-shell .site-header-controls .site-header-search:active,
.site-shell .site-header-controls .site-header-avatar-trigger:active,
.site-shell .site-header-controls .site-header-donate:active { transform: scale(0.97); }
.site-shell .site-header-controls .site-header-theme-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}
.site-shell .site-header-controls .site-header-locale-trigger {
  min-height: 31px;
  padding: 5px 11px;
  border-radius: 8px;
}
.site-shell .site-header-controls .site-header-search {
  display: inline-flex;
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 10px;
}
.site-shell .site-header-controls .site-header-search:hover,
.site-shell .site-header-controls .site-header-search:focus-visible,
.site-shell .site-header-controls .site-header-avatar-trigger:hover,
.site-shell .site-header-controls .site-header-avatar-trigger:focus-visible {
  background-color: var(--site-color-hover-background);
  color: var(--site-color-heading);
  transform: translateY(-1px);
}
.site-shell .site-header-controls .site-header-avatar-image {
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.site-shell .site-header-controls .site-header-avatar-trigger:hover .site-header-avatar-image,
.site-shell .site-header-controls .site-header-avatar-trigger:focus-visible .site-header-avatar-image { transform: scale(1.04); }
.site-shell .site-theme-icon { width: 16px; height: 16px; color: var(--site-color-text); }
.site-shell .site-mobile-brand { background: transparent; border: 0; border-radius: 0; }
.site-shell .site-mobile-brand .site-wordmark { color: var(--site-color-text); }
.site-shell .site-masthead a:hover { color: var(--site-color-accent); }
.site-shell .site-header-nav a:hover,
.site-shell .site-header-nav button:hover { color: var(--site-color-heading); background: var(--site-color-hover-background); }
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-header-controls .site-header-control-trigger,
  .site-shell .site-header-controls .site-header-search,
  .site-shell .site-header-controls .site-header-avatar-trigger,
  .site-shell .site-header-controls .site-header-avatar-image,
  .site-shell .site-header-controls .site-header-donate {
    transition: none;
  }
  .site-shell .site-header-controls .site-header-control-trigger:hover,
  .site-shell .site-header-controls .site-header-control-trigger:focus-visible,
  .site-shell .site-header-controls .site-header-search:hover,
  .site-shell .site-header-controls .site-header-search:focus-visible,
  .site-shell .site-header-controls .site-header-avatar-trigger:hover,
  .site-shell .site-header-controls .site-header-avatar-trigger:focus-visible,
  .site-shell .site-header-controls .site-header-control-trigger:active,
  .site-shell .site-header-controls .site-header-search:active,
  .site-shell .site-header-controls .site-header-avatar-trigger:active,
  .site-shell .site-header-controls .site-header-donate:active,
  .site-shell .site-header-controls .site-header-avatar-trigger:hover .site-header-avatar-image,
  .site-shell .site-header-controls .site-header-avatar-trigger:focus-visible .site-header-avatar-image {
    transform: none;
  }
}
@media (max-width: 1023px) {
  .site-shell .site-header-desktop { display: none; }
}
@media (max-width: 1023px) {
  .site-shell .site-masthead > div > div:first-child { border: 0; background: var(--site-color-background); }
}
}
@layer theme-overrides {
  .site-header-combobox-menu .input-input:focus-visible {
    outline-offset: 0;
  }
}
</style>
