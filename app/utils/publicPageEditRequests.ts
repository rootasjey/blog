export type PublicPageEditTarget = 'home-intro' | 'recommendations' | 'about'

export const PUBLIC_PAGE_EDIT_REQUEST_EVENT = 'public-page-edit-request'

export function requestPublicPageEdit(target: PublicPageEditTarget) {
  if (!import.meta.client) return

  window.dispatchEvent(new CustomEvent<PublicPageEditTarget>(PUBLIC_PAGE_EDIT_REQUEST_EVENT, {
    detail: target,
  }))
}
