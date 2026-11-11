export function usePublicPageEditMode() {
  return useState<boolean>('public-page-edit-mode', () => false)
}
