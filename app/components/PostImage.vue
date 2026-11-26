<template>
  <video
    v-if="isVideo"
    :src="mediaSrc"
    :aria-label="alt"
    :loop="loop"
    :controls="controls"
    autoplay
    muted
    playsinline
    preload="metadata"
    v-bind="mediaAttrs"
  />
  <img
    v-else-if="isAnimated"
    :src="mediaSrc"
    :alt="alt || ''"
    loading="lazy"
    decoding="async"
    v-bind="mediaAttrs"
  />
  <NuxtImg v-else :provider="provider" :src="src" :alt="alt" v-bind="imgAttrs" />
</template>

<script setup lang="ts">
import type { ConfiguredImageProviders } from '@nuxt/image'
import { computed, useAttrs } from 'vue'

const props = defineProps<{
  src?: string
  alt?: string
  ext?: string
  loop?: boolean
  controls?: boolean
}>()

const attrs = useAttrs()
const extension = computed(() => (props.ext || props.src?.split(/[?#]/, 1)[0]?.split('.').pop() || '').toLowerCase())
const isVideo = computed(() => ['mp4', 'webm'].includes(extension.value))
const isAnimated = computed(() => ['gif', 'apng'].includes(extension.value))
const loop = computed(() => props.loop !== false)

const mediaSrc = computed(() => {
  const src = props.src ?? ''
  const parts = src.replace(/^\/+/, '').split('/')
  if (parts[0] !== 'posts' || parts.length < 4) return src

  const filename = parts.pop() ?? ''
  const slug = parts.slice(1).join('/')
  return `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(slug)}`
})

// Respect explicit provider if passed via attrs, otherwise infer from src
const provider = computed(() => {
  if ((attrs as any).provider) return (attrs as any).provider as keyof ConfiguredImageProviders
  const s = props.src ?? ''
  return s.startsWith('/posts/') ? 'hubblob' : undefined
})

// Provide sensible defaults but allow callers to override via attributes
const imgAttrs = computed(() => ({
  // default to lazy loading for non-critical images
  loading: (attrs as any).loading ?? 'lazy',
  decoding: (attrs as any).decoding ?? 'async',
  // prefer webp by default for modern browsers; caller can override
  format: (attrs as any).format ?? 'webp',
  // fallback quality
  quality: (attrs as any).quality ?? 75,
  // spread remaining attrs (including width/height/class etc.)
  ...(attrs as Record<string, unknown>),
}))

const mediaAttrs = computed(() => {
  const { provider: _provider, format: _format, quality: _quality, decoding: _decoding, ...rest } = attrs as Record<string, unknown>
  return rest
})
</script>
