<template>
  <nav
    v-if="!isProfileEditor && !isPostEditor"
    class="site-mobile-bottom-nav fixed bottom-2 left-4 right-4 rounded-2 z-20 backdrop-blur shadow-[0_-6px_24px_-18px_rgba(0,0,0,0.25)] transition-transform transition-opacity duration-200"
    :class="showNav ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'"
  >
    <div class="mx-auto max-w-3xl px-4 py-0 pb-[calc(env(safe-area-inset-bottom)+6px)]">
      <div class="grid grid-cols-3">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="localizedPath(item.to, $getLocale())"
          class="site-mobile-bottom-nav-link flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors"
          :class="{ 'is-active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <span :class="[item.icon, 'text-lg']" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const showNav = ref(false)
const lastY = ref(0)
const isProfileEditor = computed(() => route.path.split('/').filter(Boolean).at(-1) === 'profile')
const isPostEditor = computed(() => route.path.includes('/posts/edit/'))

const { $t, $getLocale } = useI18n()

const items = [
  { label: $t('mobileNav.home'), to: '/', icon: 'i-ph-house-simple-duotone' },
  { label: $t('mobileNav.search'), to: '/search', icon: 'i-ph-magnifying-glass-duotone' },
  { label: $t('mobileNav.settings'), to: '/settings', icon: 'i-ph-gear-six-duotone' },
]

const currentBasePath = computed(() => route.path.replace(/^\/(?:fr|es|de|it)(?=\/|$)/, '') || '/')
const isActive = (to: string) => to === '/'
  ? currentBasePath.value === '/'
  : currentBasePath.value.startsWith(to)

const allowedRoutes = [
  '/search', 
  '/settings', 
  '/profile', 
  '/theme', 
  '/about', 
  '/credits', 
  '/privacy-policy', 
  '/terms-of-service',
]
const isAllowedRoute = computed(() => allowedRoutes.includes(currentBasePath.value))

if (import.meta.client) {
  const { y } = useWindowScroll()

  watch(y, (value) => {
    // if (value <= 0 && route.path !== '/search' && route.path !== '/settings') {
    if (value <= 0 && !isAllowedRoute.value) {
      showNav.value = false
      lastY.value = value
      return
    }

    showNav.value = value < lastY.value
    lastY.value = value
  }, { immediate: true })

  watch(() => route.path, () => {
    // Re-evaluate visibility on route change
    if (y.value <= 0 && !isAllowedRoute.value) {
      showNav.value = false
    } else {
      showNav.value = true
    }
  })
}

onMounted(() => {
  // Initial check
  const { y } = useWindowScroll()
  if (y.value <= 0 && !isAllowedRoute.value) {
    showNav.value = false
  } else {
    showNav.value = true
  }
})
</script>

<style>
@layer components {
.site-shell .site-mobile-bottom-nav {
  border: 1px solid var(--site-color-border);
  background: color-mix(in srgb, var(--site-color-background) 95%, transparent);
}

.site-shell .site-mobile-bottom-nav-link { color: var(--site-color-muted); }
.site-shell .site-mobile-bottom-nav-link:is(:hover, .is-active) { color: var(--site-color-heading); }
}
</style>
