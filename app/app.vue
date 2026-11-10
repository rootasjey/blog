<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <CursorTooltip />
      <SearchModal />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import '@/styles/main.css'
import 'uno.css'
import { onMounted, onBeforeUnmount } from 'vue'
import useGlobalSearch from './composables/useGlobalSearch'

const { open } = useGlobalSearch()
const router = useRouter()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    const active = document.activeElement
    if (isTextEntryOrMenu(active)) return

    e.preventDefault()
    router.back()
    return
  }

  // Cmd/Ctrl + K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    // do not open when typing into inputs/textareas or contenteditable elements
    const active = document.activeElement as HTMLElement | null
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)) return
    e.preventDefault()
    open('')
  }
}

function isTextEntryOrMenu(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false
  if (element.matches('input, textarea, select') || element.isContentEditable) return true

  return Boolean(element.closest(
    '[role="menu"], [role="dialog"], .site-header-pages[data-open="true"], .site-header-user-menu, .site-header-user-menu-sub, aside.fixed.inset-0',
  ))
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
