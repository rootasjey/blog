<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="public-page-edit-context-menu"
      role="menu"
      :aria-label="labels.menu"
      :style="positionStyle"
      @click.stop
      @keydown.esc.prevent="close"
    >
      <button ref="editButton" type="button" role="menuitem" @click="edit">
        <span class="i-ph-pencil-simple" aria-hidden="true" />
        <span>{{ labels.edit }}</span>
      </button>
      <div class="public-page-edit-context-menu__hint" role="note">
        <span class="i-ph-info" aria-hidden="true" />
        <span>{{ labels.nativeMenu }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { requestPublicPageEdit, type PublicPageEditTarget } from '~/utils/publicPageEditRequests'

const props = defineProps<{ isAdmin: boolean; isEditMode: boolean }>()
const { $getLocale } = useI18n()
const isFrench = computed(() => $getLocale() === 'fr')
const labels = computed(() => isFrench.value
  ? { menu: 'Actions de modification', edit: 'Modifier', nativeMenu: 'Ctrl + clic droit pour le menu du navigateur' }
  : { menu: 'Edit actions', edit: 'Edit', nativeMenu: 'Press Ctrl + right-click for browser menu' })

const open = ref(false)
const target = ref<PublicPageEditTarget | null>(null)
const position = ref({ x: 0, y: 0 })
const editButton = ref<HTMLButtonElement | null>(null)
const positionStyle = computed(() => ({ left: `${position.value.x}px`, top: `${position.value.y}px` }))

function close() {
  open.value = false
  target.value = null
}

async function onContextMenu(event: MouseEvent) {
  if (!props.isAdmin || !props.isEditMode || event.ctrlKey) return

  const source = event.target
  if (!(source instanceof Element)) return

  const editableRegion = source.closest<HTMLElement>('[data-public-page-edit-target]')
  const requestedTarget = editableRegion?.dataset.publicPageEditTarget as PublicPageEditTarget | undefined
  if (!requestedTarget) return

  event.preventDefault()
  target.value = requestedTarget
  position.value = {
    x: Math.max(8, Math.min(event.clientX, window.innerWidth - 260)),
    y: Math.max(8, Math.min(event.clientY, window.innerHeight - 110)),
  }
  open.value = true
  await nextTick()
  editButton.value?.focus()
}

function onDocumentClick(event: MouseEvent) {
  const source = event.target
  if (!(source instanceof Node)) return
  if (editButton.value?.parentElement?.contains(source)) return
  close()
}

function edit() {
  if (!target.value) return
  requestPublicPageEdit(target.value)
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

watch([() => props.isAdmin, () => props.isEditMode], ([isAdmin, isEditMode]) => {
  if (!isAdmin || !isEditMode) close()
})

onMounted(() => {
  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', onContextMenu)
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
@layer components {
.public-page-edit-context-menu {
  position: fixed;
  z-index: 120;
  width: min(252px, calc(100vw - 16px));
  overflow: hidden;
  border: 1px solid var(--site-color-border);
  border-radius: 0.75rem;
  background: var(--site-color-surface);
  color: var(--site-color-text);
  box-shadow: 0 12px 36px rgb(0 0 0 / 24%);
}

.public-page-edit-context-menu button,
.public-page-edit-context-menu__hint {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: left;
}

.public-page-edit-context-menu button {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.public-page-edit-context-menu button:hover,
.public-page-edit-context-menu button:focus-visible {
  outline: none;
  background: var(--site-color-hover-background);
}

.public-page-edit-context-menu button > span:first-child,
.public-page-edit-context-menu__hint > span:first-child {
  flex: 0 0 auto;
  font-size: 1.125rem;
}

.public-page-edit-context-menu__hint {
  border-top: 1px solid var(--site-color-border);
  color: var(--site-color-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}
}
</style>
