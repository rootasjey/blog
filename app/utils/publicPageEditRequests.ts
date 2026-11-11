export type PublicPageEditTarget = 'home-intro' | 'recommendations' | 'about' | `tag:${number}`

export const PUBLIC_PAGE_EDIT_REQUEST_EVENT = 'public-page-edit-request'

export function requestPublicPageEdit(target: PublicPageEditTarget) {
  if (!import.meta.client) return

  window.dispatchEvent(new CustomEvent<PublicPageEditTarget>(PUBLIC_PAGE_EDIT_REQUEST_EVENT, {
    detail: target,
  }))
}

export function getPublicTagEditId(target: PublicPageEditTarget) {
  const match = /^tag:(\d+)$/.exec(target)
  if (!match) return null

  const id = Number(match[1])
  return Number.isSafeInteger(id) ? id : null
}
