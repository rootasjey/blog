<template>
  <button
    type="button"
    class="editor-panel-resize-handle"
    :aria-label="label"
    :title="label"
    @pointerdown="emit('start', $event)"
    @keydown="emit('keydown', $event)"
  >
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M13.5 3.5 3.5 13.5M13.5 8.5l-5 5" />
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()

const emit = defineEmits<{
  start: [event: PointerEvent]
  keydown: [event: KeyboardEvent]
}>()
</script>

<style scoped>
.editor-panel-resize-handle {
  position: absolute;
  z-index: 2;
  inset-inline-end: 4px;
  inset-block-end: 4px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 5px;
  border: 0;
  border-radius: 8px;
  background: var(--site-color-surface);
  color: var(--site-color-muted);
  cursor: nwse-resize;
  touch-action: none;
}

.editor-panel-resize-handle:hover,
.editor-panel-resize-handle:focus-visible {
  color: var(--site-color-accent);
}

.editor-panel-resize-handle:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 1px;
}

.editor-panel-resize-handle svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.5;
}
</style>
