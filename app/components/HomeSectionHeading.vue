<template>
  <NuxtLink class="site-home-section-heading" :to="to">
    <h2>{{ title }}</h2>
    <span class="i-ph-arrow-right" aria-hidden="true" />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  to: string
}>()
</script>

<style>
@layer components {
.site-shell .site-home-section-heading {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--site-color-muted);
  text-decoration: none;
  transition:
    color 200ms ease,
    transform 220ms var(--site-ease-standard);
}

.site-shell .site-home-section-heading::before {
  position: absolute;
  z-index: -1;
  inset: -3px -8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  content: "";
  transition: background-color 150ms ease;
}

.site-shell .site-home-section-heading h2 {
  margin: 0;
  color: inherit;
  font-family: var(--site-font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 18px;
  text-transform: none;
}

.site-shell .site-home-section-heading > span {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  font-size: 13px;
  transition: transform 200ms ease;
}

.site-shell .site-home-section-heading:hover {
  color: var(--site-color-heading);
  transform: translateY(-1px);
}

.site-shell .site-home-section-heading:hover::before,
.site-shell .site-home-section-heading:focus-visible::before {
  border-color: var(--site-color-hover-background);
  background: var(--site-color-hover-background);
}

.site-shell .site-home-section-heading:hover > span {
  transform: translateX(1px);
}

@media (prefers-reduced-motion: reduce) {
  .site-shell .site-home-section-heading,
  .site-shell .site-home-section-heading::before,
  .site-shell .site-home-section-heading > span {
    transition: none;
  }

  .site-shell .site-home-section-heading:hover,
  .site-shell .site-home-section-heading:hover > span {
    transform: none;
  }
}
}
</style>
