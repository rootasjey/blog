export const TAG_COLOR_OPTIONS = [
  { key: 'violet', value: '#6d28d9' },
  { key: 'coral', value: '#c2413a' },
  { key: 'amber', value: '#b45309' },
  { key: 'blue', value: '#0369a1' },
  { key: 'green', value: '#15803d' },
  { key: 'pink', value: '#be185d' },
  { key: 'neutral', value: '#52525b' },
] as const

export function isTagColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
}
