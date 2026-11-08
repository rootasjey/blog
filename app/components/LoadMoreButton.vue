<template>
  <button class="site-load-more-button" type="button" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>

<style>
@layer components {
  .site-shell .site-load-more-button {
    display: block;
    grid-column: 1 / -1;
    justify-self: center;
    margin: 44px auto 0;
    padding: 8px 14px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: var(--site-color-heading);
    font-family: system-ui, sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    cursor: pointer;
    transition:
      background-color 200ms ease,
      color 200ms ease,
      border-color 200ms ease,
      opacity 200ms ease,
      transform 220ms var(--site-ease-standard),
      translate 220ms var(--site-ease-standard);
  }

  .site-shell .site-load-more-button:hover,
  .site-shell .site-load-more-button:focus-visible {
    background: var(--site-color-hover-background);
    color: var(--site-color-heading);
    translate: 0 -2px;
  }

  .site-shell .site-load-more-button:active {
    transform: scale(.98);
  }

  @media (prefers-reduced-motion: reduce) {
    .site-shell .site-load-more-button {
      transition: none;
    }

    .site-shell .site-load-more-button:hover,
    .site-shell .site-load-more-button:focus-visible {
      transform: none;
      translate: none;
    }
  }
}
</style>
