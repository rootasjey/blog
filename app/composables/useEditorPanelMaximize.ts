import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

type AnimationPhase = 'idle' | 'expanding' | 'restoring'

let scrollLockCount = 0
let rootOverflowBeforeLock = ''
let rootScrollbarGutterBeforeLock = ''

function lockDocumentScroll() {
  const root = document.documentElement
  if (scrollLockCount === 0) {
    rootOverflowBeforeLock = root.style.overflow
    rootScrollbarGutterBeforeLock = root.style.scrollbarGutter
    root.style.overflow = 'hidden'
    root.style.scrollbarGutter = 'stable'
  }

  scrollLockCount += 1
  let released = false

  return () => {
    if (released) return
    released = true
    scrollLockCount = Math.max(0, scrollLockCount - 1)
    if (scrollLockCount !== 0) return

    root.style.overflow = rootOverflowBeforeLock
    root.style.scrollbarGutter = rootScrollbarGutterBeforeLock
  }
}

export function useEditorPanelMaximize(
  panel: Ref<HTMLElement | null>,
  x: Ref<number>,
  y: Ref<number>,
  isOpen: Ref<boolean>,
) {
  const isMaximized = ref(false)
  const transitionsReady = ref(false)
  const normalPanelHeight = ref<number | null>(null)
  const animationPhase = ref<AnimationPhase>('idle')
  let animationTimer: ReturnType<typeof setTimeout> | undefined
  let releaseDocumentScroll: (() => void) | undefined

  const panelStyle = computed(() => ({
    left: isMaximized.value ? '5vw' : `${x.value}px`,
    top: isMaximized.value ? '5dvh' : `${y.value}px`,
    width: isMaximized.value ? '90vw' : undefined,
    height: isMaximized.value ? '90dvh' : undefined,
    maxHeight: isMaximized.value ? '90dvh' : undefined,
    '--editor-panel-normal-height': normalPanelHeight.value === null ? undefined : `${normalPanelHeight.value}px`,
  }))

  const panelClasses = computed(() => ({
    'editor-panel--maximized': isMaximized.value,
    'editor-panel--transition-ready': transitionsReady.value,
    'editor-panel--spring-expanding': animationPhase.value === 'expanding',
    'editor-panel--spring-restoring': animationPhase.value === 'restoring',
  }))

  function resetPanelState() {
    if (animationTimer) clearTimeout(animationTimer)
    animationTimer = undefined
    animationPhase.value = 'idle'
    isMaximized.value = false
  }

  function prepareForOpen() {
    resetPanelState()
    transitionsReady.value = false
    normalPanelHeight.value = null
  }

  function captureNormalHeight() {
    if (!panel.value) return
    normalPanelHeight.value = panel.value.offsetHeight
    requestAnimationFrame(() => { transitionsReady.value = true })
  }

  function toggleMaximize() {
    if (!transitionsReady.value) return
    isMaximized.value = !isMaximized.value
    animationPhase.value = isMaximized.value ? 'expanding' : 'restoring'
    if (animationTimer) clearTimeout(animationTimer)
    animationTimer = setTimeout(() => {
      animationPhase.value = 'idle'
      animationTimer = undefined
    }, 620)
  }

  watch(isMaximized, (maximized) => {
    if (!import.meta.client) return
    if (maximized) {
      releaseDocumentScroll ??= lockDocumentScroll()
      return
    }
    releaseDocumentScroll?.()
    releaseDocumentScroll = undefined
  }, { flush: 'sync' })

  watch(isOpen, (open) => {
    if (!open) resetPanelState()
  }, { flush: 'sync' })

  onScopeDispose(() => {
    resetPanelState()
    releaseDocumentScroll?.()
    releaseDocumentScroll = undefined
  })

  return {
    isMaximized,
    transitionsReady,
    panelStyle,
    panelClasses,
    prepareForOpen,
    captureNormalHeight,
    toggleMaximize,
  }
}
