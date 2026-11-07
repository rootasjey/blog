<template>
  <section class="site-collection-intro">
    <img class="site-collection-avatar" src="/images/presentation/jc-pp.jpg" alt="Jérémie Corpinot" width="100" height="100">
    <SlidingCopy v-if="animateCopy" :title="title" :description="description" />
    <template v-else>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description: string; animateCopy?: boolean }>(), { animateCopy: false })
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-collection-intro { width: min(700px, calc(100vw - 32px)); margin: 0 auto 80px; color: var(--site-color-text); }
.site-shell .site-collection-avatar { display: block; width: 100px; height: 100px; margin-bottom: 40px; border-radius: 50%; object-fit: cover; }
.site-shell .site-collection-intro h1 { margin: 0 0 14px; color: var(--site-color-heading); font-size: 20px; font-weight: 550; line-height: 28px; }
.site-shell .site-collection-intro p { margin: 0; color: var(--site-color-text); font-size: 16px; line-height: 24px; }
@media (max-width: 1023px) {
  .site-shell .site-collection-intro { margin-bottom: 44px; }
}
@media (max-width: 1023px) {
  .site-shell .site-collection-avatar { width: 72px; height: 72px; margin-bottom: 28px; }
}
@media (prefers-reduced-motion: reduce) {
}
}
</style>
