<template>
  <NodeViewWrapper as="div" :class="['task-item', selected ? 'is-selected' : '', checked ? 'is-checked' : '']">
    <div class="task-checkbox">
      <AndreasCheckbox :id="id" :checked="checked" :disabled="!isEditable" @change="onToggle" :label="labelText" />
    </div>

    <div class="task-content-wrapper">
      <NodeViewContent as="div" class="task-content" />
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import AndreasCheckbox from './AndreasCheckbox.vue'

const props = defineProps(nodeViewProps)

const id = computed(() => `task-${props.getPos ? String(props.getPos?.()) : String(Math.random()).slice(2, 8)}`)
const checked = computed(() => !!props.node.attrs.checked)
const selected = computed(() => !!props.selected)
// Whether the hosting editor is editable (post viewer is read-only)
const isEditable = computed(() => !!(props.editor && (props.editor.options?.editable ?? false)))

// Text to show next to the checkbox when outside of the editable NodeViewContent.
// Node content is editable via NodeViewContent so label can be empty for most cases.
const labelText = computed(() => '')

function onToggle(value: boolean) {
  if (!isEditable.value) return

  // Update the node attribute and re-focus the editor
  props.updateAttributes({ checked: value })
  props.editor.commands.focus()
}
</script>

<style scoped>
@layer components {

.task-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin: 0.25rem 0;
}
.task-item.is-selected {
  outline: 2px solid var(--site-color-focus-ring, #737378);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
}
.task-checkbox {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}
.task-content-wrapper {
  flex: 1 1 auto;
}
.task-content {
  min-height: 1.5rem;
}
.task-item.is-checked .task-content {
  text-decoration: line-through;
  opacity: 0.65;
}
}
</style>
