<template>
  <span
    v-if="iconSvg"
    v-bind="$attrs"
    class="site-tag-svg-icon"
    :style="maskStyle"
    aria-hidden="true"
  />
  <NIcon v-else-if="icon?.startsWith('i-')" v-bind="$attrs" :name="icon" aria-hidden="true" />
  <span v-else v-bind="$attrs" aria-hidden="true">{{ initial }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  icon?: string | null
  iconSvg?: string | null
  name: string
}>()

const initial = computed(() => Array.from(props.name.trim())[0]?.toLocaleUpperCase() || '#')
const svg = computed(() => props.iconSvg ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${props.iconSvg}</svg>` : '')
const maskStyle = computed(() => {
  if (!svg.value) return undefined
  const data = `url("data:image/svg+xml,${encodeURIComponent(svg.value)}")`
  return {
    maskImage: data,
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
    backgroundColor: 'currentColor',
  }
})
</script>

<style scoped>
@layer components {
  .site-tag-svg-icon { display: inline-block; width: 1em; height: 1em; vertical-align: middle; }
}
</style>
