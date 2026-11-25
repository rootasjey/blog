export type StaticRichTextMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strike' }
  | { type: 'link'; attrs: { href: string } }

export type StaticRichTextNode = {
  type: 'doc' | 'paragraph' | 'text' | 'hardBreak' | 'bulletList' | 'orderedList' | 'listItem'
  text?: string
  content?: StaticRichTextNode[]
  marks?: StaticRichTextMark[]
  attrs?: { href?: string }
}

export type StaticRichTextValue = string | StaticRichTextNode

export function isStaticRichTextDocument(value: unknown): value is StaticRichTextNode {
  return !!value && typeof value === 'object' && (value as { type?: unknown }).type === 'doc'
}

export function normalizeStaticRichText(value: StaticRichTextValue): StaticRichTextNode {
  if (isStaticRichTextDocument(value)) return value

  return {
    type: 'doc',
    content: value.split(/\n\s*\n/).filter(Boolean).map(text => ({
      type: 'paragraph',
      content: text.split('\n').flatMap((line, index) => index
        ? [{ type: 'hardBreak' as const }, { type: 'text' as const, text: line }]
        : [{ type: 'text' as const, text: line }]),
    })),
  }
}

export function isSafeStaticRichTextHref(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  const href = value.trim()
  if (/^(https?:|mailto:)/i.test(href)) return true
  return href.startsWith('/') && !href.startsWith('//') || href.startsWith('#')
}

export function staticRichTextToPlainText(value: StaticRichTextValue): string {
  if (typeof value === 'string') return value.replace(/\n\s*\n/g, ' ').trim()
  const visit = (node: StaticRichTextNode): string => {
    if (node.type === 'text') return node.text || ''
    if (node.type === 'hardBreak') return ' '
    const children = (node.content || []).map(visit).join('')
    return ['paragraph', 'listItem'].includes(node.type) ? `${children} ` : children
  }
  return visit(value).replace(/\s+/g, ' ').trim()
}
