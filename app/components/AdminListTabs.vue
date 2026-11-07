<template>
  <nav ref="nav" class="site-admin-post-tabs" :aria-label="label">
    <button
      v-for="(item, index) in items"
      :key="item.value"
      :ref="element => setButtonRef(element, index)"
      type="button"
      class="site-admin-post-tab"
      :aria-pressed="modelValue === item.value"
      @click="emit('select', item.value)"
    >
      {{ item.label }}
    </button>
    <span
      class="site-admin-post-tab-indicator"
      :class="{ 'is-positioned': hasPositioned }"
      :style="indicatorStyle"
      aria-hidden="true"
    />
  </nav>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from 'vue'

type TabValue = 'published' | 'drafts' | 'archived'
type TabItem = { value: TabValue; label: string }

const props = defineProps<{
  modelValue: TabValue
  items: TabItem[]
  label: string
}>()

const emit = defineEmits<{ select: [value: TabValue] }>()
const nav = ref<HTMLElement | null>(null)
const tabButtons = ref<(HTMLButtonElement | null)[]>([])
const indicatorStyle = ref<Record<string, string>>({})
const hasPositioned = ref(false)
let resizeObserver: ResizeObserver | null = null

function setButtonRef(element: unknown, index: number) {
  tabButtons.value[index] = element as HTMLButtonElement | null
}

function updateIndicator() {
  const activeIndex = props.items.findIndex(item => item.value === props.modelValue)
  const activeButton = tabButtons.value[activeIndex]
  if (!activeButton) return

  indicatorStyle.value = {
    width: `${activeButton.offsetWidth}px`,
    transform: `translateX(${activeButton.offsetLeft}px)`,
  }
}

watch(() => [props.modelValue, ...props.items.map(item => item.label)] as const, async () => {
  await nextTick()
  updateIndicator()
}, { flush: 'post' })

onMounted(async () => {
  await nextTick()
  updateIndicator()
  if (nav.value) {
    resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(nav.value)
    tabButtons.value.forEach(button => button && resizeObserver?.observe(button))
  }
  requestAnimationFrame(() => { hasPositioned.value = true })
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>
