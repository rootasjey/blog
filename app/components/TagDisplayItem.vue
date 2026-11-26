<template>
  <NuxtLink
    :to="to"
    class="site-tag-display"
    :class="`site-tag-display--${variant}`"
    :aria-label="ariaLabel"
    :data-public-page-edit-target="editTarget || undefined"
    :style="{ '--tag-accent': postTagColor(name, color) }"
  >
    <span class="site-tag-display-icon" aria-hidden="true">
      <TagIcon :icon="icon" :icon-svg="iconSvg" :name="title" />
    </span>
    <span class="site-tag-display-title">
      <span class="site-tag-display-label">{{ title }}</span>
      <span v-if="count != null" class="site-tag-display-count">x{{ count }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { postTagColor } from '~/utils/postTagColor'

withDefaults(defineProps<{
  to: string
  name: string
  title: string
  count?: number | null
  icon?: string | null
  iconSvg?: string | null
  color?: string | null
  variant: 'directory' | 'home'
  ariaLabel?: string
  editTarget?: string
}>(), {
  count: null,
  icon: null,
  iconSvg: null,
  color: null,
  ariaLabel: undefined,
  editTarget: undefined,
})
</script>

<style>
@layer components {
  .site-shell .site-tag-display {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
    color: var(--site-color-heading);
    text-decoration: none;
  }
  .site-shell .site-tag-display--directory { min-height: 44px; flex: 1; }
  .site-shell .site-tag-display--home {
    height: 44px;
    flex: 0 0 44px;
    padding: 0 10px 0 0;
    font-size: 15px;
    font-weight: 500;
  }
  .site-shell .site-tag-display-icon {
    display: grid;
    box-sizing: border-box;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--tag-accent) 30%, transparent);
    border-radius: var(--site-radius-control);
    background: color-mix(in srgb, var(--tag-accent) 5%, transparent);
    color: var(--tag-accent);
    font-size: 19px;
    font-weight: 550;
    transform: scale(1);
    transition: background-color 200ms ease, border-color 200ms ease, transform 220ms var(--site-ease-standard);
  }
  .site-shell .site-tag-display-title {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: 4px;
    color: var(--site-color-heading);
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    transition: transform 180ms ease-out, font-weight 200ms ease;
  }
  .site-shell .site-tag-display-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .site-shell .site-tag-display-count {
    flex: 0 0 auto;
    color: var(--site-color-muted);
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    font-variant-numeric: tabular-nums;
  }
  .site-shell .site-tag-display--home .site-tag-display-title { font-weight: 700; }
  .site-shell .site-tag-display--home .site-tag-display-count { font-size: 12px; font-weight: 400; }
  .site-shell .site-tag-display:hover,
  .site-shell .site-tag-display:focus-visible { color: var(--site-color-heading); }
  .site-shell .site-tag-display:hover .site-tag-display-icon,
  .site-shell .site-tag-display:focus-visible .site-tag-display-icon {
    border-color: transparent;
    background: color-mix(in srgb, var(--tag-accent) 6%, transparent);
    transform: scale(1.05);
  }
  .site-shell .site-tag-display--directory:hover .site-tag-display-title,
  .site-shell .site-tag-display--directory:focus-visible .site-tag-display-title { font-weight: 600; }
  .site-shell .site-tag-display:hover .site-tag-display-title,
  .site-shell .site-tag-display:focus-visible .site-tag-display-title { transform: translateX(2px); }
  .site-shell .site-tag-display:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    .site-shell .site-tag-display-title,
    .site-shell .site-tag-display-icon { transition: none; transform: none; }
  }
}
</style>
