<template>
  <div
    ref="wrapper"
    class="site-text-slide-copy"
    :style="wrapperHeightStyle"
  >
    <div v-if="previousCopy" class="site-text-slide-layer site-text-slide-layer--previous" :style="previousLayerStyle" aria-hidden="true">
      <h1 :class="titleClass">{{ previousCopy.title }}</h1>
      <p :class="descriptionClass">{{ previousCopy.description }}</p>
    </div>

    <div ref="currentLayer" class="site-text-slide-layer site-text-slide-layer--current" :style="currentLayerStyle">
      <h1 :class="titleClass">{{ currentCopy.title }}</h1>
      <p :class="descriptionClass">{{ currentCopy.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount } from 'vue'

type Copy = { title: string; description: string }

const props = withDefaults(defineProps<{
  title: string
  description: string
  direction?: number
  titleClass?: string
  descriptionClass?: string
}>(), {
  direction: 1,
  titleClass: '',
  descriptionClass: '',
})

const slideDuration = 420
const slideDistance = 14
const wrapper = ref<HTMLElement | null>(null)
const currentLayer = ref<HTMLElement | null>(null)
const currentCopy = ref<Copy>({ title: props.title, description: props.description })
const previousCopy = ref<Copy | null>(null)
const progress = ref(1)
const wrapperHeight = ref<number | null>(null)
const wrapperHeightStyle = computed(() => wrapperHeight.value === null ? undefined : { height: `${wrapperHeight.value}px` })
let animationFrame: number | null = null
let transitionId = 0

const currentLayerStyle = computed(() => ({
  opacity: String(progress.value),
  transform: `translateX(${Math.sign(props.direction || 1) * (1 - progress.value) * slideDistance}px)`,
}))

const previousLayerStyle = computed(() => ({
  opacity: String(1 - progress.value),
  transform: `translateX(${-Math.sign(props.direction || 1) * progress.value * slideDistance}px)`,
}))

watch(() => [props.title, props.description] as const, async ([title, description]) => {
  const nextCopy = { title, description }
  if (nextCopy.title === currentCopy.value.title && nextCopy.description === currentCopy.value.description) return

  const currentTransitionId = ++transitionId
  if (animationFrame !== null) cancelAnimationFrame(animationFrame)

  wrapperHeight.value = wrapper.value?.getBoundingClientRect().height ?? null
  await nextTick()
  if (currentTransitionId !== transitionId) return

  previousCopy.value = currentCopy.value
  currentCopy.value = nextCopy
  progress.value = 0

  if (!import.meta.client || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    previousCopy.value = null
    wrapperHeight.value = null
    progress.value = 1
    return
  }

  await nextTick()
  if (currentTransitionId !== transitionId) return
  const toHeight = currentLayer.value?.getBoundingClientRect().height
  if (!toHeight) {
    previousCopy.value = null
    wrapperHeight.value = null
    progress.value = 1
    return
  }

  const startedAt = performance.now()
  const animate = (now: number) => {
    if (currentTransitionId !== transitionId) return
    const linearProgress = Math.min((now - startedAt) / slideDuration, 1)
    progress.value = 1 - Math.pow(1 - linearProgress, 3)
    if (linearProgress >= 1) {
      previousCopy.value = null
      wrapperHeight.value = null
      animationFrame = null
      return
    }
    animationFrame = requestAnimationFrame(animate)
  }

  animationFrame = requestAnimationFrame(() => {
    wrapperHeight.value = toHeight
    animationFrame = requestAnimationFrame(animate)
  })
}, { flush: 'pre' })

onBeforeUnmount(() => {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame)
})
</script>

<style>
@layer components {
  .site-text-slide-copy {
    position: relative;
    display: grid;
    min-width: 0;
    overflow: hidden;
    transition: height 420ms cubic-bezier(.22, 1, .36, 1);
  }

  .site-text-slide-layer {
    grid-area: 1 / 1;
    min-width: 0;
    width: 100%;
    align-self: start;
    will-change: transform, opacity;
  }

  .site-text-slide-layer--current { position: relative; }

  .site-text-slide-layer--previous {
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .site-text-slide-copy { transition-duration: .01ms !important; }
  }
}
</style>
