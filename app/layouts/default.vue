<template>
  <div class="min-h-screen flex flex-col font-text site-shell">
    <header
      class="site-banner relative z-10"
      :class="{ 'site-banner--hidden': isScrolled && isScrollingDown }"
      role="banner"
    >
      <AppHeader />
    </header>
    <main class="flex-1 pb-20 md:pb-0">
      <slot />
    </main>
    <BottomPageBlur />
    <AppFooter class="hidden md:block" />
    <MobileBottomNav class="lg:hidden" />
  </div>
</template>

<script setup lang="ts">
const { isScrolled, isScrollingDown } = useHeaderScroll()
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell > main:has(> .site-auth-page),
.site-shell > main:has(> .site-error-page) {
  display: flex;
  flex-direction: column;
}
}
</style>
