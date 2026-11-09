<template>
  <fieldset class="site-tag-color-picker">
    <legend>{{ translate('pages.tags.colorLabel', 'Couleur du tag', 'Tag color') }}</legend>
    <div class="site-tag-color-picker-options">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="site-tag-color-picker-option"
        :class="{ 'is-selected': modelValue?.toLowerCase() === option.value.toLowerCase() }"
        :style="{ '--tag-color-swatch': option.value }"
        :aria-label="option.label"
        :aria-pressed="modelValue?.toLowerCase() === option.value.toLowerCase()"
        :title="option.label"
        @click="emit('update:modelValue', option.value)"
      >
        <span aria-hidden="true" />
      </button>

      <label class="site-tag-color-picker-custom" :aria-label="customLabel" :title="customLabel">
        <NIcon name="i-ph-eyedropper" aria-hidden="true" />
        <input
          type="color"
          :value="modelValue || fallbackColor"
          :aria-label="customLabel"
          @input="onCustomColorInput"
        >
      </label>

      <button
        type="button"
        class="site-tag-color-picker-auto"
        :class="{ 'is-selected': !modelValue }"
        :aria-pressed="!modelValue"
        @click="emit('update:modelValue', null)"
      >
        {{ translate('pages.tags.colorAutomatic', 'Automatique', 'Automatic') }}
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TAG_COLOR_OPTIONS } from '~~/shared/constants/tag-colors'

defineProps<{ modelValue: string | null }>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { $ts, $getLocale } = useI18n()
const fallbackColor = '#6d28d9'
const options = computed(() => TAG_COLOR_OPTIONS.map(option => ({
  ...option,
  label: translate(`pages.tags.colors.${option.key}`, colorNames.fr[option.key], colorNames.en[option.key]),
})))
const customLabel = computed(() => translate('pages.tags.colorCustom', 'Couleur personnalisée', 'Custom color'))

const colorNames = {
  fr: { violet: 'Violet', coral: 'Corail', amber: 'Ambre', blue: 'Bleu', green: 'Vert', pink: 'Rose', neutral: 'Neutre' },
  en: { violet: 'Violet', coral: 'Coral', amber: 'Amber', blue: 'Blue', green: 'Green', pink: 'Pink', neutral: 'Neutral' },
}

function translate(key: string, frenchFallback: string, englishFallback: string): string {
  const value = $ts(key)
  if (typeof value === 'string' && value !== key) return value
  return $getLocale().startsWith('fr') ? frenchFallback : englishFallback
}

function onCustomColorInput(event: Event) {
  const input = event.currentTarget
  if (input instanceof HTMLInputElement) emit('update:modelValue', input.value)
}
</script>

<style scoped>
.site-tag-color-picker { min-width: 0; margin: 0; padding: 0; border: 0; }
.site-tag-color-picker legend { margin-bottom: 8px; color: var(--site-color-heading); font-size: 14px; font-weight: 500; }
.site-tag-color-picker-options { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.site-tag-color-picker-option,
.site-tag-color-picker-custom {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  box-sizing: border-box;
  padding: 0;
  border: 1px solid var(--site-color-border);
  border-radius: 10px;
  background: transparent;
  color: var(--site-color-muted);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease, color 160ms ease;
}
.site-tag-color-picker-option span { width: 18px; height: 18px; border-radius: 50%; background: var(--tag-color-swatch); }
.site-tag-color-picker-option:hover,
.site-tag-color-picker-custom:hover { border-color: var(--site-color-heading); color: var(--site-color-heading); transform: translateY(-1px); }
.site-tag-color-picker-option.is-selected,
.site-tag-color-picker-auto.is-selected { border-color: var(--site-color-heading); background: var(--site-color-hover-background); }
.site-tag-color-picker-custom { position: relative; overflow: hidden; font-size: 17px; }
.site-tag-color-picker-custom input { position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer; opacity: 0; }
.site-tag-color-picker-auto { min-height: 36px; padding: 0 10px; border: 1px solid var(--site-color-border); border-radius: 10px; background: transparent; color: var(--site-color-muted); cursor: pointer; font-size: 12px; transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease; }
.site-tag-color-picker-auto:hover { border-color: var(--site-color-heading); color: var(--site-color-heading); }
.site-tag-color-picker-option:focus-visible,
.site-tag-color-picker-custom:focus-within,
.site-tag-color-picker-auto:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .site-tag-color-picker-option,
  .site-tag-color-picker-custom,
  .site-tag-color-picker-auto { transition: none; }
}
</style>
