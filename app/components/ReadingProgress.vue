<template>
  <aside
    v-if="headings.length"
    class="site-reading-progress"
    :class="{ 'is-visible': isVisible, 'is-open': isOpen }"
    :style="{ '--reading-progress': `${progress}%` }"
    :aria-hidden="!isVisible && !isOpen"
    :inert="!isVisible && !isOpen"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @keydown.esc="isOpen = false"
  >
    <button
      class="site-reading-progress-head"
      type="button"
      :aria-expanded="isOpen || isHovered"
      :aria-label="$ts('components.readingProgress.title')"
      @click="isOpen = !isOpen"
    >
      <span class="site-reading-progress-title">
        {{ $ts('components.readingProgress.title') }}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
      <span class="site-reading-progress-time">{{ readingMinutes }} min</span>
      <svg class="site-reading-progress-ring" viewBox="0 0 16 16" aria-hidden="true">
        <circle class="site-reading-progress-ring-track" cx="8" cy="8" r="7" />
        <circle
          class="site-reading-progress-ring-value"
          cx="8"
          cy="8"
          r="7"
          :style="{ strokeDashoffset: `${ringCircumference * (1 - progress / 100)}` }"
        />
      </svg>
    </button>

    <nav class="site-reading-progress-menu" :aria-label="$ts('components.readingProgress.contents')">
      <a
        v-for="(heading, index) in headings"
        :key="heading.id"
        :href="`#${heading.id}`"
        :class="{ active: index === activeHeadingIndex }"
        :style="{ '--heading-level': heading.level }"
        @click="isOpen = false"
      >
        {{ heading.title }}
      </a>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

interface Props {
  contentSelector: string
}

interface HeadingItem {
  id: string
  title: string
  level: number
}

const props = defineProps<Props>()
const { $ts } = useI18n()
const headings = ref<HeadingItem[]>([])
const readingMinutes = ref(1)
const progress = ref(0)
const activeHeadingIndex = ref(0)
const isOpen = ref(false)
const isHovered = ref(false)
const isVisible = computed(() => progress.value > 0 && progress.value < 100)

const ringCircumference = 2 * Math.PI * 7
let contentElement: HTMLElement | null = null
let contentObserver: MutationObserver | null = null
let frameId = 0

function headingId(heading: HTMLElement, index: number) {
  if (heading.id) return heading.id

  const slug = heading.textContent?.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50) || 'section'
  const baseId = `reading-${index + 1}-${slug}`
  let id = baseId
  let suffix = 2

  while (document.getElementById(id)) {
    id = `${baseId}-${suffix++}`
  }

  heading.id = id
  return id
}

function updateHeadings() {
  if (!contentElement) return

  const text = contentElement.textContent?.trim() ?? ''
  const wordCount = text ? text.split(/\s+/).length : 0
  readingMinutes.value = Math.max(1, Math.ceil(wordCount / 200))
  headings.value = [...contentElement.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')]
    .filter(heading => heading.textContent?.trim())
    .map((heading, index) => ({
      id: headingId(heading, index),
      title: heading.textContent?.trim() ?? '',
      level: Number(heading.tagName.slice(1)),
    }))
}

function updateProgress() {
  if (!contentElement) return

  const rect = contentElement.getBoundingClientRect()
  const nextProgress = rect.height > 0
    ? Math.min(100, Math.max(0, ((50 - rect.top) / rect.height) * 100))
    : 0

  progress.value = Math.round(nextProgress * 100) / 100

  const currentHeading = headings.value.reduce((activeIndex, heading, index) => {
    const element = document.getElementById(heading.id)
    return element && element.getBoundingClientRect().top <= 60 ? index : activeIndex
  }, 0)
  activeHeadingIndex.value = currentHeading
}

function scheduleProgressUpdate() {
  if (frameId) return

  frameId = requestAnimationFrame(() => {
    frameId = 0
    updateProgress()
  })
}

async function attachContent() {
  await nextTick()
  const nextContent = document.querySelector<HTMLElement>(props.contentSelector)

  if (nextContent === contentElement) {
    return
  }

  contentObserver?.disconnect()
  contentElement = nextContent

  if (!contentElement) {
    headings.value = []
    progress.value = 0
    return
  }

  contentObserver = new MutationObserver(() => {
    updateHeadings()
    scheduleProgressUpdate()
  })
  contentObserver.observe(contentElement, { childList: true, subtree: true, characterData: true })
  updateHeadings()
  scheduleProgressUpdate()
}

onMounted(() => {
  window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
  window.addEventListener('resize', scheduleProgressUpdate, { passive: true })
  void attachContent()
})

onUpdated(() => {
  void attachContent()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleProgressUpdate)
  window.removeEventListener('resize', scheduleProgressUpdate)
  contentObserver?.disconnect()
  if (frameId) cancelAnimationFrame(frameId)
})
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-reading-progress {
  position: fixed;
  z-index: 12;
  top: 10px;
  left: 50%;
  width: min(320px, calc(100vw - 32px));
  max-width: 240px;
  height: 40px;
  box-sizing: border-box;
  padding-inline: 12px;
  overflow: hidden;
  transform: translateX(-50%) scale(.9);
  border-radius: 20px;
  background: var(--site-color-hover-background);
  color: var(--site-color-heading);
  opacity: 0;
  pointer-events: none;
  transition: max-width .35s var(--site-ease-standard), height .25s ease, opacity .2s ease, transform .22s var(--site-ease-standard), background-color .25s ease;
}
.site-shell .site-reading-progress.is-visible,
.site-shell .site-reading-progress:focus-within { transform: translateX(-50%) scale(1); opacity: 1; pointer-events: auto; }
.site-shell .site-reading-progress-head {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.site-shell .site-reading-progress-title { display: flex; flex: 1; align-items: center; gap: 4px; white-space: nowrap; font-size: 14px; font-weight: 550; }
.site-shell .site-reading-progress-title svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; transition: transform .25s ease; }
.site-shell .site-reading-progress-time { color: var(--site-color-muted); font-size: 14px; white-space: nowrap; }
.site-shell .site-reading-progress-ring { width: 16px; height: 16px; flex: none; transform: rotate(-90deg); }
.site-shell .site-reading-progress-ring circle { fill: none; stroke-width: 2; }
.site-shell .site-reading-progress-ring-track { stroke: var(--site-color-border); }
.site-shell .site-reading-progress-ring-value { stroke: var(--site-color-heading); stroke-dasharray: 44; stroke-linecap: round; transition: stroke-dashoffset .12s linear; }
.site-shell .site-reading-progress-menu {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  display: flex;
  max-height: calc(100vh - 64px);
  flex-direction: column;
  gap: 8px;
  padding: 8px 20px 16px;
  overflow: auto;
  border-radius: 0 0 18px 18px;
  background: var(--site-color-background);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-2px);
  transition: opacity .2s ease, transform .2s ease;
}
.site-shell .site-reading-progress-menu a { margin-left: calc((var(--heading-level) - 1) * 10px); color: var(--site-color-text); font-size: 14px; font-weight: 500; line-height: 1.4; text-decoration: none; }
.site-shell .site-reading-progress-menu a.active { color: var(--site-color-accent); }
.site-shell .site-reading-progress:hover,
.site-shell .site-reading-progress:focus-within,
.site-shell .site-reading-progress.is-open { max-width: 320px; height: 52px; overflow: visible; background: var(--site-color-background); box-shadow: 0 8px 28px rgb(0 0 0 / 12%); }
.site-shell .site-reading-progress:hover .site-reading-progress-head,
.site-shell .site-reading-progress:focus-within .site-reading-progress-head,
.site-shell .site-reading-progress.is-open .site-reading-progress-head { height: 52px; padding-inline: 4px; }
.site-shell .site-reading-progress:hover .site-reading-progress-title svg,
.site-shell .site-reading-progress:focus-within .site-reading-progress-title svg,
.site-shell .site-reading-progress.is-open .site-reading-progress-title svg { transform: rotate(90deg); }
.site-shell .site-reading-progress:hover .site-reading-progress-menu,
.site-shell .site-reading-progress:focus-within .site-reading-progress-menu,
.site-shell .site-reading-progress.is-open .site-reading-progress-menu { opacity: 1; pointer-events: auto; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-reading-progress,
.site-shell .site-reading-progress * { transition-duration: .01ms; }
}
}
</style>
