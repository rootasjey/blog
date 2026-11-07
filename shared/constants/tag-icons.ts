export const TAG_ICON_OPTIONS = [
  { value: 'i-ph-palette', label: 'palette' },
  { value: 'i-ph-camera', label: 'camera' },
  { value: 'i-ph-code', label: 'code' },
  { value: 'i-ph-film-strip', label: 'film' },
  { value: 'i-ph-pen-nib', label: 'writing' },
  { value: 'i-ph-star', label: 'star' },
  { value: 'i-ph-sparkle', label: 'sparkle' },
  { value: 'i-ph-lightning', label: 'lightning' },
  { value: 'i-ph-cube', label: 'cube' },
  { value: 'i-ph-book-open', label: 'book' },
  { value: 'i-ph-heart', label: 'heart' },
] as const

export type TagIconName = typeof TAG_ICON_OPTIONS[number]['value']

const tagIconNames = new Set<string>(TAG_ICON_OPTIONS.map(option => option.value))

export function isTagIconName(value: unknown): value is TagIconName {
  return typeof value === 'string' && tagIconNames.has(value)
}
