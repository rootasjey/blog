export type PublicPageEditTarget = 'home-intro' | 'recommendations' | 'about' | `tag:${number}` | `post:${string}` | 'home-section:featuredPosts' | 'home-section:recentPosts'

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

export function getPublicPostEditIdentifier(target: PublicPageEditTarget) {
  const prefix = 'post:'
  if (!target.startsWith(prefix)) return null

  const identifier = target.slice(prefix.length).trim()
  return identifier || null
}

export function getHomePostSectionEditKey(target: PublicPageEditTarget) {
  const prefix = 'home-section:'
  if (!target.startsWith(prefix)) return null

  const key = target.slice(prefix.length)
  return key === 'featuredPosts' || key === 'recentPosts' ? key : null
}
