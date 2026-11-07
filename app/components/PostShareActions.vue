<template>
  <div class="site-post-share-actions" role="group" :aria-label="$t('components.postShare.label')">
    <button type="button" :aria-label="$t('components.postShare.copy')" :data-cursor-tooltip="$t('components.postShare.copy')" @click="copyLink">
      <span class="i-ph-copy" aria-hidden="true" />
    </button>
    <a
      :href="facebookShareUrl"
      :aria-label="$t('components.postShare.facebook')"
      :data-cursor-tooltip="$t('components.postShare.facebook')"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="i-ph-facebook-logo" aria-hidden="true" />
    </a>
    <a
      :href="xShareUrl"
      :aria-label="$t('components.postShare.x')"
      :data-cursor-tooltip="$t('components.postShare.x')"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="i-ph-x-logo" aria-hidden="true" />
    </a>
    <a :href="linkedinShareUrl" :aria-label="$t('components.postShare.linkedin')" :data-cursor-tooltip="$t('components.postShare.linkedin')" target="_blank" rel="noopener noreferrer">
      <span class="i-ph-linkedin-logo" aria-hidden="true" />
    </a>
    <a :href="blueskyShareUrl" :aria-label="$t('components.postShare.bluesky')" :data-cursor-tooltip="$t('components.postShare.bluesky')" target="_blank" rel="noopener noreferrer">
      <span class="i-ph-butterfly" aria-hidden="true" />
    </a>
    <a :href="pinterestShareUrl" :aria-label="$t('components.postShare.pinterest')" :data-cursor-tooltip="$t('components.postShare.pinterest')" target="_blank" rel="noopener noreferrer">
      <span class="i-ph-pinterest-logo" aria-hidden="true" />
    </a>
    <span v-if="copied || copyFailed" class="site-post-share-status" role="status">
      {{ $t(copied ? 'components.postShare.copied' : 'components.postShare.copyFailed') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{ title: string }>()
const { $t } = useI18n()
const pageUrl = ref('')
const pageImage = ref('')
const copied = ref(false)
const copyFailed = ref(false)

const xShareUrl = computed(() => `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.title)}&url=${encodeURIComponent(pageUrl.value)}`)
const facebookShareUrl = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl.value)}`)
const linkedinShareUrl = computed(() => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl.value)}`)
const blueskyShareUrl = computed(() => `https://bsky.app/intent/compose?text=${encodeURIComponent(`${props.title} ${pageUrl.value}`)}`)
const pinterestShareUrl = computed(() => `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl.value)}&description=${encodeURIComponent(props.title)}${pageImage.value ? `&media=${encodeURIComponent(pageImage.value)}` : ''}`)

onMounted(() => {
  pageUrl.value = window.location.href
  pageImage.value = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content || ''
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(pageUrl.value)
    copied.value = true
    copyFailed.value = false
    window.setTimeout(() => { copied.value = false }, 2200)
  } catch {
    copied.value = false
    copyFailed.value = true
    window.setTimeout(() => { copyFailed.value = false }, 2200)
  }
}
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-post-share-actions { position: relative; display: flex; flex: 0 0 auto; align-items: center; gap: 6px; }
.site-shell .site-post-share-actions > a,
.site-shell .site-post-share-actions > a,
.site-shell .site-post-share-actions > button { position: relative; display: grid; width: 36px; height: 36px; box-sizing: border-box; padding: 4px; place-items: center; border: 1px solid color-mix(in srgb, var(--site-color-text) 12%, var(--site-color-background)); border-radius: var(--site-radius-control); background: transparent; color: var(--site-color-muted); cursor: pointer; font-size: 18px; text-decoration: none; transition: transform 180ms cubic-bezier(.2,.8,.2,1), background-color 150ms ease-in-out, border-color 150ms ease-in-out, color 150ms ease-in-out; }
.site-shell .site-post-share-actions > a > span:first-child,
.site-shell .site-post-share-actions > button > span:first-child { font-size: 16px; }
.site-shell .site-post-share-actions > a:hover,
.site-shell .site-post-share-actions > button:hover { background: var(--site-color-hover-background); border-color: var(--site-color-hover-background); color: var(--site-color-heading); transform: translateY(-1px); }
.site-shell .site-post-share-actions > a:focus-visible,
.site-shell .site-post-share-actions > button:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.site-shell .site-post-share-status { position: absolute; top: calc(100% + 6px); right: 0; z-index: 1; padding: 6px 10px; border: 1px solid var(--site-color-border); border-radius: 8px; background: var(--site-color-background); color: var(--site-color-text); font-size: 12px; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-post-share-actions > a,
  .site-shell .site-post-share-actions > button { transition: none; }
}
}
</style>
