import type { ComputedRef } from 'vue'

export function useEditModeGridCursor(isEditModeActive: ComputedRef<boolean>) {
  const prefersReducedMotion = ref(false)
  let pointerFrame = 0
  let latestPointer: PointerEvent | null = null
  let reducedMotionPreference: MediaQueryList | undefined

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return

    latestPointer = event
    if (pointerFrame) return

    pointerFrame = window.requestAnimationFrame(() => {
      pointerFrame = 0
      if (!latestPointer) return

      const shell = document.querySelector<HTMLElement>('.site-shell')
      if (!shell) return

      const offsetX = (latestPointer.clientX / window.innerWidth - 0.5) * -28
      const offsetY = (latestPointer.clientY / window.innerHeight - 0.5) * -28
      shell.style.setProperty('--site-edit-grid-x', `${offsetX.toFixed(1)}px`)
      shell.style.setProperty('--site-edit-grid-y', `${offsetY.toFixed(1)}px`)
    })
  }

  function syncPointerTracking() {
    window.removeEventListener('pointermove', handlePointerMove)

    if (isEditModeActive.value && !prefersReducedMotion.value) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      return
    }

    const shell = document.querySelector<HTMLElement>('.site-shell')
    shell?.style.removeProperty('--site-edit-grid-x')
    shell?.style.removeProperty('--site-edit-grid-y')
  }

  const stopWatchingPointerTracking = watch(
    [isEditModeActive, prefersReducedMotion],
    syncPointerTracking,
    { flush: 'post' },
  )

  function updateReducedMotionPreference(event: MediaQueryListEvent) {
    prefersReducedMotion.value = event.matches
  }

  onMounted(() => {
    reducedMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionPreference.matches
    reducedMotionPreference.addEventListener('change', updateReducedMotionPreference)
    syncPointerTracking()
  })

  onBeforeUnmount(() => {
    stopWatchingPointerTracking()
    window.removeEventListener('pointermove', handlePointerMove)
    reducedMotionPreference?.removeEventListener('change', updateReducedMotionPreference)
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame)
  })
}
