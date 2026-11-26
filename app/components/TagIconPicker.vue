<template>
  <div class="site-tag-icon-picker">
    <div class="site-tag-icon-picker-search">
      <span class="i-ph-magnifying-glass site-tag-icon-picker-search-icon" aria-hidden="true" />
      <input
        v-model="search"
        type="search"
        :placeholder="searchPlaceholder"
        :aria-label="searchLabel"
      />
    </div>

    <TransitionGroup
      tag="div"
      name="site-tag-icon-grid"
      class="site-tag-icon-picker-grid"
      role="group"
      :aria-label="label"
      @scroll.passive="handleGridScroll"
    >
      <button
        type="button"
        key="tag-initial"
        class="site-tag-icon-picker-option"
        :class="{ 'is-selected': !icon }"
        :aria-label="letterLabel"
        :aria-pressed="!icon"
        :title="letterLabel"
        @click="select(null, null)"
      >
        <span>{{ initial }}</span>
      </button>
      <button
        v-for="option in visibleIcons"
        :key="`tabler:${option.name}`"
        type="button"
        class="site-tag-icon-picker-option"
        :class="{ 'is-selected': icon === `tabler:${option.name}` }"
        :aria-label="option.label"
        :aria-pressed="icon === `tabler:${option.name}`"
        :title="option.label"
        @click="select(`tabler:${option.name}`, option.body)"
      >
        <TagIcon :icon="`tabler:${option.name}`" :icon-svg="option.body" :name="tagName" />
      </button>
    </TransitionGroup>

    <p v-if="loading" class="site-tag-icon-picker-status" role="status">{{ loadingLabel }}</p>
    <p v-else-if="loadError" class="site-tag-icon-picker-status" role="alert">{{ errorLabel }}</p>
    <p v-else-if="!matchingNames.length && !visibleIcons.length" class="site-tag-icon-picker-status">{{ emptyLabel }}</p>
    <button
      v-if="loadError"
      type="button"
      class="site-tag-icon-picker-load-more"
      @click="loadVisibleIcons"
    >
      {{ retryLabel }}
    </button>
    <button
      v-else-if="hasMoreResults"
      type="button"
      class="site-tag-icon-picker-load-more"
      :disabled="loading"
      @click="loadMore"
    >
      {{ loadMoreLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import {
  getTablerIconShardIds,
  TABLER_ICON_SHARD_SIZE,
  type TablerIconShard,
} from '~~/shared/utils/tabler-icon-catalog'

type TablerIconManifest = { count: number; shardSize: number; names: string[] }
type TablerIconShardResponse = { icons: TablerIconShard }

const props = defineProps<{
  enabled: boolean
  icon: string | null
  iconSvg: string | null
  tagName: string
  label: string
  letterLabel: string
  searchLabel: string
  loadingLabel: string
  emptyLabel: string
  loadMoreLabel: string
  errorLabel: string
  retryLabel: string
}>()

const emit = defineEmits<{
  'update:icon': [value: string | null]
  'update:iconSvg': [value: string | null]
}>()

const search = ref('')
const loading = ref(false)
const loadError = ref(false)
const visibleIconCount = ref(72)
const manifest = shallowRef<TablerIconManifest | null>(null)
const icons = shallowRef<Record<string, string>>({})
const loadedShards = shallowRef<Record<string, true>>({})
const initial = computed(() => Array.from(props.tagName.trim())[0]?.toLocaleUpperCase() || '#')
const normalizedSearch = computed(() => search.value.trim().toLocaleLowerCase())
const selectedIconName = computed(() => props.icon?.startsWith('tabler:') ? props.icon.slice('tabler:'.length) : '')
const indexByName = computed(() => new Map((manifest.value?.names ?? []).map((name, index) => [name, index])))
const { $getLocale, $ts } = useI18n()
const searchPlaceholder = computed(() => manifest.value
  ? $ts('pages.tags.iconSearchPlaceholderWithCount', {
      count: new Intl.NumberFormat($getLocale()).format(manifest.value.count),
    })
  : props.searchLabel)

watch(normalizedSearch, () => {
  visibleIconCount.value = 72
})

const matchingNames = computed(() => (manifest.value?.names ?? [])
  .filter(name => !normalizedSearch.value || name.replaceAll('-', ' ').includes(normalizedSearch.value)))
const hasMoreResults = computed(() => matchingNames.value.length > visibleIconCount.value)
const visibleNames = computed(() => {
  const names = matchingNames.value.slice(0, visibleIconCount.value)
  if (selectedIconName.value && manifest.value?.names.includes(selectedIconName.value) && !names.includes(selectedIconName.value)) {
    names.unshift(selectedIconName.value)
  }
  return names
})

const visibleIcons = computed(() => {
  return visibleNames.value.flatMap((name) => {
    const body = icons.value[name]
    return body ? [{ name, body, label: name.replaceAll('-', ' ') }] : []
  })
})

const runtimeConfig = useRuntimeConfig()
const appBasePath = runtimeConfig.app.baseURL.endsWith('/') ? runtimeConfig.app.baseURL : `${runtimeConfig.app.baseURL}/`
const assetBasePath = `${appBasePath}tabler-icons`
let manifestRequest: Promise<TablerIconManifest> | null = null
const shardRequests = new Map<string, Promise<void>>()
let loadGeneration = 0

function assetPath(path: string) {
  return `${assetBasePath}/${path}`
}

async function loadManifest() {
  if (manifest.value) return manifest.value

  manifestRequest ??= fetch(assetPath('manifest.json')).then(async (response) => {
    if (!response.ok) throw new Error(`Tabler icon manifest request failed: ${response.status}`)
    const data = await response.json() as TablerIconManifest
    if (!Array.isArray(data.names) || !Number.isInteger(data.count) || !Number.isInteger(data.shardSize)) {
      throw new Error('Invalid Tabler icon manifest')
    }
    return data
  })

  try {
    manifest.value = await manifestRequest
    return manifest.value
  } catch (error) {
    manifestRequest = null
    throw error
  }
}

function loadShard(shardId: string) {
  if (loadedShards.value[shardId]) return Promise.resolve()
  const inFlight = shardRequests.get(shardId)
  if (inFlight) return inFlight

  const request = fetch(assetPath(`shards/${shardId}.json`))
    .then(async (response) => {
      if (!response.ok) throw new Error(`Tabler icon shard request failed: ${response.status}`)
      const data = await response.json() as TablerIconShardResponse
      if (!data.icons || typeof data.icons !== 'object') throw new Error('Invalid Tabler icon shard')
      icons.value = { ...icons.value, ...data.icons }
      loadedShards.value = { ...loadedShards.value, [shardId]: true }
    })
    .finally(() => shardRequests.delete(shardId))

  shardRequests.set(shardId, request)
  return request
}

async function loadVisibleIcons() {
  if (!props.enabled) return
  const generation = ++loadGeneration
  loading.value = true
  loadError.value = false

  try {
    const iconManifest = await loadManifest()
    const shardIds = getTablerIconShardIds(
      visibleNames.value,
      indexByName.value,
      iconManifest.shardSize || TABLER_ICON_SHARD_SIZE,
    )
    await Promise.all(shardIds.map(loadShard))
  } catch {
    if (generation === loadGeneration) loadError.value = true
  } finally {
    if (generation === loadGeneration) {
      loading.value = false
    }
  }
}

watch([() => props.enabled, normalizedSearch, visibleIconCount, selectedIconName], ([enabled]) => {
  if (!enabled) {
    loadGeneration++
    loading.value = false
    loadError.value = false
    return
  }
  void loadVisibleIcons()
}, { immediate: true })

function handleGridScroll(event: Event) {
  const grid = event.currentTarget as HTMLElement
  if (grid.scrollHeight - grid.scrollTop - grid.clientHeight <= 72) loadMore()
}

function select(icon: string | null, iconSvg: string | null) {
  emit('update:icon', icon)
  emit('update:iconSvg', iconSvg)
}

function loadMore() {
  if (loading.value || !hasMoreResults.value) return
  visibleIconCount.value += 72
}
</script>

<style scoped>
@layer components {
  .site-tag-icon-picker { display: grid; gap: 10px; }
  .site-tag-icon-picker-search { position: relative; display: block; }
  .site-tag-icon-picker-search-icon { position: absolute; top: 50%; left: 11px; color: var(--site-color-muted); transform: translateY(-50%); }
  .site-tag-icon-picker-search input { box-sizing: border-box; width: 100%; min-height: 38px; padding: 6px 10px 6px 34px; border: 1px solid var(--site-color-border); border-radius: 10px; background: transparent; color: var(--site-color-text); font: inherit; font-size: 13px; }
  .site-tag-icon-picker-grid { display: grid; max-height: 220px; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 7px; overflow: auto; padding: 2px; }
  .site-tag-icon-grid-enter-active,
  .site-tag-icon-grid-leave-active { transition: opacity 140ms ease, transform 180ms cubic-bezier(.2, .75, .25, 1); }
  .site-tag-icon-grid-enter-from,
  .site-tag-icon-grid-leave-to { opacity: 0; transform: translateY(4px) scale(.9); }
  .site-tag-icon-grid-move { transition: transform 180ms cubic-bezier(.2, .75, .25, 1); }
  .site-tag-icon-picker-option { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid var(--site-color-border); border-radius: 10px; background: transparent; color: var(--site-color-muted); cursor: pointer; font-size: 16px; transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 220ms var(--site-ease-standard); }
  .site-tag-icon-picker-option:hover { border-color: var(--site-color-text); color: var(--site-color-heading); transform: translateY(-1px); }
  .site-tag-icon-picker-option.is-selected { border-color: var(--site-color-heading); color: var(--site-color-heading); background: var(--site-color-hover-background); }
  .site-tag-icon-picker-option:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
  .site-tag-icon-picker-status { margin: 0; color: var(--site-color-muted); font-size: 12px; }
  .site-tag-icon-picker-load-more { justify-self: start; min-height: 34px; padding: 5px 10px; border: 1px solid var(--site-color-border); border-radius: 9px; background: transparent; color: var(--site-color-text); cursor: pointer; font: inherit; font-size: 12px; transition: background-color 160ms ease, border-color 160ms ease; }
  .site-tag-icon-picker-load-more:hover { border-color: var(--site-color-heading); background: var(--site-color-hover-background); }
  .site-tag-icon-picker-load-more:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
  @media (max-width: 480px) { .site-tag-icon-picker-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
  @media (prefers-reduced-motion: reduce) {
    .site-tag-icon-picker-option,
    .site-tag-icon-grid-enter-active,
    .site-tag-icon-grid-leave-active,
    .site-tag-icon-grid-move { transition: none; }
    .site-tag-icon-grid-enter-from,
    .site-tag-icon-grid-leave-to { opacity: 1; transform: none; }
  }
}
</style>
