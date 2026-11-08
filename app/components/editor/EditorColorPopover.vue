<template>
  <NPopover
    modal
    v-if="editor"
    :disableOutsidePointerEvents="true"
    :open="visible"
    @update:open="(v: boolean) => (visible = v)"
    :_popover-content="colorPopoverContent"
  >
    <template #trigger>
      <button 
        @click="visible = !visible" 
        type="button" 
        class="site-editor-color-trigger p-1.5 rounded-md text-foreground/80 hover:bg-muted transition-colors flex items-center justify-center min-w-[28px]"
      >
        <span class="i-lucide-droplet" />
        <span
          v-if="hasAnyColor"
          class="color-preview"
          :style="{ background: selectionBackgroundColor || selectionTextColor || 'transparent', borderColor: selectionTextColor || 'transparent' }"
        />
      </button>
    </template>

    <div class="flex flex-col gap-2 p-2" @pointerdown="onPointerDown">
      <div class="flex flex-col gap-2">
        <div class="text-xs font-600 color-gray-700 dark:color-gray-300">Highlight</div>
        <div class="color-grid">
          <button
            v-for="col in highlightPalette"
            :key="col"
            type="button"
            :style="{ background: col }"
            class="color-swatch"
            @click="setHighlight(col)"
          />
          <button type="button" class="color-swatch clear" @click="clearHighlight" title="Clear highlight">×</button>
        </div>
      </div>

      <div class="flex flex-col gap-2 mb-2">
        <div class="text-xs font-600 color-gray-700 dark:color-gray-300">Text</div>
        <div class="color-grid">
          <button
            v-for="col in textPalette"
            :key="col"
            type="button"
            :style="{ background: col }"
            class="color-swatch"
            @click="setTextColor(col)"
          />
          <button type="button" class="color-swatch clear" @click="clearTextColor" title="Clear text color">×</button>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="text-xs font-600 color-gray-700 dark:color-gray-300">Background</div>
        <div class="color-grid">
          <button
            v-for="col in backgroundPalette"
            :key="col"
            type="button"
            :style="{ background: col }"
            class="color-swatch"
            @click="setBackgroundColor(col)"
          />
          <button type="button" class="color-swatch clear" @click="clearBackgroundColor" title="Clear background">×</button>
        </div>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { textPalette, highlightPalette, backgroundPalette, DEFAULT_HIGHLIGHT } from './palette'
import type { Editor } from '@tiptap/vue-3'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from '@una-ui/nuxt';

interface Props { editor: Editor | null }
const props = defineProps<Props>()

const visible = ref(false)

const colorPopoverContent = { 
  class: 'py-1 px-2 w-auto rounded-4',
  onInteractOutside: onInteractOutside,
}

function onInteractOutside(e: PointerDownOutsideEvent | FocusOutsideEvent) {
  e.detail.originalEvent.preventDefault()
}

/**
 * Prevent the editor from losing focus when clicking inside the popover.
 * @param e - PointerEvent
 */
function onPointerDown(e: PointerEvent) {
  e.preventDefault()
}

// Color operations
function setTextColor(color: string) { props.editor?.chain().focus().setColor(color).run() }
function clearTextColor() { props.editor?.chain().focus().unsetColor().run() }
function setHighlight(color?: string) { props.editor?.chain().focus().toggleHighlight({ color: color ?? DEFAULT_HIGHLIGHT }).run() }
function clearHighlight() { props.editor?.chain().focus().unsetHighlight().run() }
function setBackgroundColor(color: string) { props.editor?.chain().focus().setBackgroundColor(color).run() }
function clearBackgroundColor() { props.editor?.chain().focus().unsetBackgroundColor().run() }

const selectionTextColor = computed(() => props.editor?.getAttributes('textStyle')?.color || props.editor?.getAttributes('highlight')?.color || '')
const selectionBackgroundColor = computed(() => props.editor?.getAttributes('textStyle')?.backgroundColor || '')
const hasAnyColor = computed(() => !!(selectionTextColor.value || selectionBackgroundColor.value))
</script>

<style scoped>
@layer components {

.color-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.25rem; }
.site-editor-color-trigger:hover { color: var(--site-color-accent); }
.color-swatch { width: 1.25rem; height: 1.25rem; border-radius: 0.45rem; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 0 0 1px rgba(0,0,0,0.02) inset; transition: all 0.2s; }
.color-swatch.clear { display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--un-foreground-color, #111827); background: transparent; }
.dark .color-swatch.clear { color: var(--un-foreground-color, #f9fafb); border: 1px solid rgba(255,255,255,0.3); }
.color-swatch:hover { transform: scale(1.2); }
.color-swatch:active { transform: scale(0.9); }
.color-preview { display: inline-block; width: 0.9rem; height: 0.9rem; margin-left: 0.375rem; border-radius: 9999px; border: 2px solid transparent; }
}
</style>
