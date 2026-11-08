<template>
  <div class="site-tag-icon-picker" role="group" :aria-label="label">
    <button
      type="button"
      class="site-tag-icon-picker-option"
      :class="{ 'is-selected': !modelValue }"
      :aria-label="letterLabel"
      :aria-pressed="!modelValue"
      :title="letterLabel"
      @click="emit('update:modelValue', null)"
    >
      <span>{{ initial }}</span>
    </button>
    <button
      v-for="option in iconOptions"
      :key="option.value"
      type="button"
      class="site-tag-icon-picker-option"
      :class="{ 'is-selected': modelValue === option.value }"
      :aria-label="option.label"
      :aria-pressed="modelValue === option.value"
      :title="option.label"
      @click="emit('update:modelValue', option.value)"
    >
      <NIcon v-if="option.value === 'i-ph-palette'" name="i-ph-palette" />
      <NIcon v-else-if="option.value === 'i-ph-camera'" name="i-ph-camera" />
      <NIcon v-else-if="option.value === 'i-ph-code'" name="i-ph-code" />
      <NIcon v-else-if="option.value === 'i-ph-film-strip'" name="i-ph-film-strip" />
      <NIcon v-else-if="option.value === 'i-ph-pen-nib'" name="i-ph-pen-nib" />
      <NIcon v-else-if="option.value === 'i-ph-star'" name="i-ph-star" />
      <NIcon v-else-if="option.value === 'i-ph-sparkle'" name="i-ph-sparkle" />
      <NIcon v-else-if="option.value === 'i-ph-lightning'" name="i-ph-lightning" />
      <NIcon v-else-if="option.value === 'i-ph-cube'" name="i-ph-cube" />
      <NIcon v-else-if="option.value === 'i-ph-book-open'" name="i-ph-book-open" />
      <NIcon v-else-if="option.value === 'i-ph-heart'" name="i-ph-heart" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TAG_ICON_OPTIONS, type TagIconName } from '~~/shared/constants/tag-icons'

const props = defineProps<{
  modelValue: TagIconName | null
  tagName: string
  label: string
  letterLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TagIconName | null]
}>()

const { $t } = useI18n()
const initial = computed(() => Array.from(props.tagName.trim())[0]?.toLocaleUpperCase() || '#')
const iconOptions = computed(() => TAG_ICON_OPTIONS.map(option => ({
  ...option,
  label: $t(`pages.tags.icons.${option.label}`),
})))
</script>

<style scoped>
.site-tag-icon-picker { display: flex; flex-wrap: wrap; gap: 8px; }
.site-tag-icon-picker-option { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid var(--site-color-border); border-radius: 10px; background: transparent; color: var(--site-color-muted); cursor: pointer; font-size: 16px; transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 220ms var(--site-ease-standard); }
.site-tag-icon-picker-option:hover { border-color: var(--site-color-text); color: var(--site-color-heading); transform: translateY(-1px); }
.site-tag-icon-picker-option.is-selected { border-color: var(--site-color-heading); color: var(--site-color-heading); background: var(--site-color-hover-background); }
.site-tag-icon-picker-option:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .site-tag-icon-picker-option { transition: none; } }
</style>
