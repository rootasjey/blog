<template>
  <div
    class="site-cursor-tooltip"
    :class="{ 'is-visible': isVisible }"
    :style="tooltipStyle"
    aria-hidden="true"
  >
    <span ref="measureElement" class="site-cursor-tooltip-measure">{{ label }}</span>
    <span class="site-cursor-tooltip-content" :class="`is-${labelPhase}`">
      <span
        :class="activeLabelLayer === 'a' ? 'site-cursor-tooltip-label-current' : 'site-cursor-tooltip-label-incoming'"
      >{{ labelLayerA }}</span>
      <span
        :class="activeLabelLayer === 'b' ? 'site-cursor-tooltip-label-current' : 'site-cursor-tooltip-label-incoming'"
      >{{ labelLayerB }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const labelLayerA = ref('')
const labelLayerB = ref('')
const activeLabelLayer = ref<'a' | 'b'>('a')
const labelPhase = ref<'idle' | 'entering' | 'preparing-swap' | 'swapping' | 'committing'>('idle')
const isVisible = ref(false)
const width = ref(0)
const pointerX = ref(0)
const pointerY = ref(0)
const measureElement = ref<HTMLElement | null>(null)

let animationFrame = 0
let finePointer = false
let hideTimer: number | undefined
let labelTimer: number | undefined
let labelRevision = 0

const label = computed(() => getLayerValue(activeLabelLayer.value))
const incomingLabel = computed(() => getLayerValue(otherLabelLayer()))

const tooltipStyle = computed(() => ({
  left: `${Math.max(8, Math.min(pointerX.value + 14, windowWidth() - width.value - 8))}px`,
  top: `${Math.max(8, Math.min(pointerY.value + 18, windowHeight() - 36))}px`,
  width: `${width.value}px`,
}))

function windowWidth() {
  return typeof window === 'undefined' ? 0 : window.innerWidth
}

function windowHeight() {
  return typeof window === 'undefined' ? 0 : window.innerHeight
}

function closestTooltipTarget(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>('[data-cursor-tooltip]') : null
}

function otherLabelLayer() {
  return activeLabelLayer.value === 'a' ? 'b' : 'a'
}

function getLayerValue(layer: 'a' | 'b') {
  return layer === 'a' ? labelLayerA.value : labelLayerB.value
}

function setLayerValue(layer: 'a' | 'b', value: string) {
  if (layer === 'a') {
    labelLayerA.value = value
  } else {
    labelLayerB.value = value
  }
}

function setCurrentLabel(value: string) {
  setLayerValue(activeLabelLayer.value, value)
}

function setIncomingLabel(value: string) {
  setLayerValue(otherLabelLayer(), value)
}

function promoteIncomingLabel() {
  const previousLayer = activeLabelLayer.value
  activeLabelLayer.value = otherLabelLayer()
  setLayerValue(previousLayer, '')
}

function updateLabel(nextLabel: string, wasVisible: boolean) {
  if (!nextLabel) return

  if (label.value === nextLabel || incomingLabel.value === nextLabel) {
    if (!wasVisible) startLabelEntrance(nextLabel)
    return
  }

  window.clearTimeout(labelTimer)
  const revision = ++labelRevision
  const isSwapping = wasVisible && label.value

  if (isSwapping) {
    if (labelPhase.value === 'swapping' && incomingLabel.value) {
      promoteIncomingLabel()
    }
    setIncomingLabel(nextLabel)
  } else {
    setCurrentLabel(nextLabel)
    setLayerValue(otherLabelLayer(), '')
  }

  labelPhase.value = isSwapping ? 'preparing-swap' : 'entering'
  void nextTick(() => {
    if (revision !== labelRevision) return
    width.value = measureLabel(nextLabel)
    window.requestAnimationFrame(() => {
      if (revision !== labelRevision) return

      if (isSwapping) {
        window.requestAnimationFrame(() => {
          if (revision !== labelRevision) return
          labelPhase.value = 'swapping'
          const scrollDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 500
          labelTimer = window.setTimeout(() => {
            if (revision !== labelRevision) return
            labelPhase.value = 'committing'
            promoteIncomingLabel()
            window.requestAnimationFrame(() => {
              if (revision !== labelRevision) return
              labelPhase.value = 'idle'
              labelTimer = undefined
            })
          }, scrollDuration + 20)
        })
        return
      }

      labelPhase.value = 'idle'
    })
  })
}

function measureLabel(text: string) {
  if (!measureElement.value) return 0
  measureElement.value.textContent = text
  return measureElement.value.getBoundingClientRect().width
}

function startLabelEntrance(nextLabel: string) {
  window.clearTimeout(labelTimer)
  labelTimer = undefined
  const revision = ++labelRevision
  setCurrentLabel(nextLabel)
  setLayerValue(otherLabelLayer(), '')
  labelPhase.value = 'entering'
  window.requestAnimationFrame(() => {
    if (revision !== labelRevision) return
    window.requestAnimationFrame(() => {
      if (revision !== labelRevision) return
      labelPhase.value = 'idle'
    })
  })
}

function cancelLabelTransition() {
  labelRevision += 1
  window.clearTimeout(labelTimer)
  labelTimer = undefined
  if (incomingLabel.value) promoteIncomingLabel()
  labelPhase.value = 'committing'
}

function handlePointerOver(event: PointerEvent) {
  if (!finePointer || event.pointerType === 'touch') return
  const target = closestTooltipTarget(event.target)
  const nextLabel = target?.dataset.cursorTooltip?.trim()
  if (!nextLabel) return

  window.clearTimeout(hideTimer)
  updateLabel(nextLabel, isVisible.value)
  isVisible.value = true
  pointerX.value = event.clientX
  pointerY.value = event.clientY
  void nextTick(() => {
    width.value = measureLabel(nextLabel)
  })
}

function handlePointerMove(event: PointerEvent) {
  if (!isVisible.value || event.pointerType === 'touch') return
  if (animationFrame) return
  animationFrame = window.requestAnimationFrame(() => {
    pointerX.value = event.clientX
    pointerY.value = event.clientY
    animationFrame = 0
  })
}

function handlePointerOut(event: PointerEvent) {
  if (!isVisible.value || closestTooltipTarget(event.relatedTarget)) return
  window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    cancelLabelTransition()
    isVisible.value = false
    width.value = 0
    hideTimer = undefined
  }, 80)
}

onMounted(() => {
  finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  document.addEventListener('pointerover', handlePointerOver)
  document.addEventListener('pointermove', handlePointerMove)
  document.addEventListener('pointerout', handlePointerOut)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerover', handlePointerOver)
  document.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('pointerout', handlePointerOut)
  window.clearTimeout(hideTimer)
  window.clearTimeout(labelTimer)
  labelRevision += 1
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
})
</script>

<style>
@layer components {
.site-cursor-tooltip {
  position: fixed;
  z-index: 1000;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #000 8%, transparent);
  border-radius: 999px;
  background: #fff;
  color: #171717;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  pointer-events: none;
  transform: translateY(-3px) scale(.98);
  filter: blur(6px);
  opacity: 0;
  visibility: hidden;
  transition:
    width 220ms cubic-bezier(.16, 1, .3, 1),
    opacity 160ms ease,
    filter 180ms ease,
    transform 180ms cubic-bezier(.16, 1, .3, 1),
    visibility 160ms linear 160ms;
}

.site-cursor-tooltip.is-visible {
  padding: 3px 10px;
  opacity: 1;
  visibility: visible;
  filter: blur(0);
  transform: translateY(0) scale(1);
  transition-delay: 0s;
}

.site-cursor-tooltip-measure {
  position: fixed;
  top: -100px;
  left: -10000px;
  width: max-content;
  padding: 3px 10px;
  border: 1px solid transparent;
  font: inherit;
  white-space: nowrap;
  visibility: hidden;
}

.site-cursor-tooltip-content {
  position: relative;
  display: block;
  height: 20px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.site-cursor-tooltip-label-current,
.site-cursor-tooltip-label-incoming {
  position: absolute;
  inset: 0;
  display: grid;
  max-width: none;
  place-items: center;
  transition:
    transform 180ms cubic-bezier(.16, 1, .3, 1),
    opacity 130ms ease,
    filter 160ms ease;
}

.site-cursor-tooltip-content.is-idle .site-cursor-tooltip-label-current {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0);
}

.site-cursor-tooltip-content.is-entering .site-cursor-tooltip-label-current {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(110%);
}

.site-cursor-tooltip-content.is-swapping .site-cursor-tooltip-label-current {
  opacity: 0;
  filter: blur(0);
  transform: translateY(-110%);
  transition-duration: 500ms, 500ms, 250ms;
  transition-timing-function: ease-in-out, ease-in-out, ease;
}

.site-cursor-tooltip-label-incoming {
  opacity: 0;
  filter: blur(0);
  transform: translateY(110%);
}

.site-cursor-tooltip-content.is-swapping .site-cursor-tooltip-label-incoming {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0);
  transition-duration: 500ms, 500ms, 250ms;
  transition-timing-function: ease-in-out, ease-in-out, ease;
}

.site-cursor-tooltip-content.is-committing .site-cursor-tooltip-label-current,
.site-cursor-tooltip-content.is-committing .site-cursor-tooltip-label-incoming {
  transition: none;
}

.site-cursor-tooltip-content.is-committing .site-cursor-tooltip-label-current {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .site-cursor-tooltip,
  .site-cursor-tooltip-label-current,
  .site-cursor-tooltip-label-incoming {
    transition-duration: 1ms;
  }

  .site-cursor-tooltip-content.is-swapping .site-cursor-tooltip-label-current,
  .site-cursor-tooltip-content.is-swapping .site-cursor-tooltip-label-incoming {
    transition-duration: 1ms;
  }
}
}
</style>
