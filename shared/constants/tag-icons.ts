const LEGACY_TAG_ICON_NAMES = new Set([
  'i-ph-palette', 'i-ph-camera', 'i-ph-code', 'i-ph-film-strip', 'i-ph-pen-nib',
  'i-ph-star', 'i-ph-sparkle', 'i-ph-lightning', 'i-ph-cube', 'i-ph-book-open', 'i-ph-heart',
])

export const TAG_ICON_OPTIONS = [...LEGACY_TAG_ICON_NAMES].map(value => ({ value }))

export type TagIconName = `tabler:${string}` | string

export function isTagIconName(value: unknown): value is TagIconName {
  if (typeof value !== 'string') return false
  return LEGACY_TAG_ICON_NAMES.has(value) || /^tabler:[a-z0-9-]{1,80}$/.test(value)
}

export function isTablerTagIcon(value: unknown): value is `tabler:${string}` {
  return typeof value === 'string' && /^tabler:[a-z0-9-]{1,80}$/.test(value)
}

const ALLOWED_TAG_ICON_ELEMENTS = new Set(['path', 'g', 'circle', 'rect', 'defs', 'use'])
const ALLOWED_TAG_ICON_ATTRIBUTES = new Set([
  'fill', 'stroke', 'stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd',
  'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'opacity', 'class', 'id', 'href',
])

/** Accept only the basic geometry used by Tabler icons before storing it for CSS masking. */
export function sanitizeTagIconBody(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 20_000) return null

  const elements: string[] = []
  const elementStack: string[] = []
  const elementPattern = /<\/?([a-z][a-z0-9-]*)\b([^>]*)>/gi
  let cursor = 0

  for (const match of value.matchAll(elementPattern)) {
    const index = match.index ?? 0
    const elementName = match[1]
    const rawAttributes = match[2] ?? ''
    const matchedElement = match[0] ?? ''
    if (!elementName) return null
    if (value.slice(cursor, index).trim()) return null
    const element = elementName.toLowerCase()
    if (!ALLOWED_TAG_ICON_ELEMENTS.has(element)) return null

    const closing = matchedElement.startsWith('</')
    if (closing) {
      if (rawAttributes.trim()) return null
      if (elementStack.pop() !== element) return null
      elements.push(`</${element}>`)
      cursor = index + matchedElement.length
      continue
    }

    const selfClosing = /\/\s*>$/.test(matchedElement)
    const attributes = rawAttributes.replace(/\/\s*$/, '')
    let attributeCursor = 0
    const safeAttributes: string[] = []
    const attributePattern = /\s+([a-z-]+)="([^"]*)"/gi

    for (const attributeMatch of attributes.matchAll(attributePattern)) {
      const attributeIndex = attributeMatch.index ?? 0
      const attributeName = attributeMatch[1]
      const attributeValue = attributeMatch[2]
      if (!attributeName || attributeValue === undefined) return null
      if (attributes.slice(attributeCursor, attributeIndex).trim()) return null

      const name = attributeName.toLowerCase()
      if (!ALLOWED_TAG_ICON_ATTRIBUTES.has(name) || /[<>"'&]|url\s*\(|javascript:/i.test(attributeValue)) return null
      if (name === 'href' && !/^#[a-z0-9_-]+$/i.test(attributeValue)) return null

      safeAttributes.push(`${name}="${attributeValue}"`)
      attributeCursor = attributeIndex + attributeMatch[0].length
    }

    if (attributes.slice(attributeCursor).trim()) return null
    elements.push(`<${element}${safeAttributes.length ? ` ${safeAttributes.join(' ')}` : ''}${selfClosing ? '/>' : '>'}`)
    if (!selfClosing) elementStack.push(element)
    cursor = index + matchedElement.length
  }

  if (value.slice(cursor).trim() || elements.length === 0 || elementStack.length) return null
  return elements.join('')
}
