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
  const resizedWidth = ref<number | null>(null)
  const resizedHeight = ref<number | null>(null)
  const isResizing = ref(false)
  const animationPhase = ref<AnimationPhase>('idle')
  let animationTimer: ReturnType<typeof setTimeout> | undefined
  let releaseDocumentScroll: (() => void) | undefined
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeStartWidth = 0
  let resizeStartHeight = 0

  const panelStyle = computed(() => ({
    left: isMaximized.value ? '5vw' : `${x.value}px`,
    top: isMaximized.value ? '5dvh' : `${y.value}px`,
    width: isMaximized.value ? '90vw' : getResizedDimension(resizedWidth.value),
    height: isMaximized.value ? '90dvh' : getResizedDimension(resizedHeight.value),
    maxHeight: getMaxHeight(),
    '--editor-panel-normal-height': normalPanelHeight.value === null ? undefined : `${normalPanelHeight.value}px`,
  }))

  const panelClasses = computed(() => ({
    'editor-panel--maximized': isMaximized.value,
    'editor-panel--transition-ready': transitionsReady.value,
    'editor-panel--spring-expanding': animationPhase.value === 'expanding',
    'editor-panel--spring-restoring': animationPhase.value === 'restoring',
    'editor-panel--resizing': isResizing.value,
  }))

  function resetPanelState() {
    stopResize()
    if (animationTimer) clearTimeout(animationTimer)
    animationTimer = undefined
    animationPhase.value = 'idle'
    isMaximized.value = false
  }

  function prepareForOpen() {
    resetPanelState()
    transitionsReady.value = false
    normalPanelHeight.value = null
    resizedWidth.value = null
    resizedHeight.value = null
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

  function startResize(event: PointerEvent) {
    if (isMaximized.value || event.button !== 0 || !panel.value) return
    event.preventDefault()
    event.stopPropagation()

    resizeStartX = event.clientX
    resizeStartY = event.clientY
    resizeStartWidth = panel.value.offsetWidth
    resizeStartHeight = panel.value.offsetHeight
    isResizing.value = true
    window.addEventListener('pointermove', resizePanel)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
  }

  function resizePanel(event: PointerEvent) {
    const bounds = getResizeBounds()
    resizedWidth.value = clamp(resizeStartWidth + event.clientX - resizeStartX, bounds.minWidth, bounds.maxWidth)
    resizedHeight.value = clamp(resizeStartHeight + event.clientY - resizeStartY, bounds.minHeight, bounds.maxHeight)
  }

  function resizeWithKeyboard(event: KeyboardEvent) {
    if (isMaximized.value || !panel.value) return
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
      : 0
    if (!direction) return
    event.preventDefault()
    isResizing.value = true

    const amount = event.shiftKey ? 48 : 16
    const widthDelta = event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? direction * amount : 0
    const heightDelta = event.key === 'ArrowUp' || event.key === 'ArrowDown' ? direction * amount : 0
    const bounds = getResizeBounds()
    const currentWidth = resizedWidth.value ?? panel.value.offsetWidth
    const currentHeight = resizedHeight.value ?? panel.value.offsetHeight
    resizedWidth.value = clamp(currentWidth + widthDelta, bounds.minWidth, bounds.maxWidth)
    resizedHeight.value = clamp(currentHeight + heightDelta, bounds.minHeight, bounds.maxHeight)
    requestAnimationFrame(() => { isResizing.value = false })
  }

  function stopResize() {
    if (!import.meta.client) return
    isResizing.value = false
    window.removeEventListener('pointermove', resizePanel)
    window.removeEventListener('pointerup', stopResize)
    window.removeEventListener('pointercancel', stopResize)
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function getResizedDimension(value: number | null) {
    return value === null ? undefined : `${value}px`
  }

  function getMaxHeight() {
    if (isMaximized.value) return '90dvh'
    if (resizedHeight.value === null) return undefined
    return `${getResizeBounds().maxHeight}px`
  }

  function getResizeBounds() {
    const availableWidth = Math.max(0, window.innerWidth - x.value - 8)
    const availableHeight = Math.max(0, window.innerHeight - y.value - 8)

    return {
      minWidth: Math.min(320, availableWidth),
      maxWidth: availableWidth,
      minHeight: Math.min(280, availableHeight),
      maxHeight: availableHeight,
    }
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
    startResize,
    resizeWithKeyboard,
  }
}
