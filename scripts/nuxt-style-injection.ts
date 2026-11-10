const layeredStylesheetPaths = [
  '@unocss/reset/tailwind.css',
  '@una-ui/preset/una.css',
]

export function isLayeredNuxtStylesheet(entry: unknown): boolean {
  const source = getStylesheetSource(entry)
  const normalizedSource = source.replaceAll('\\', '/')

  return layeredStylesheetPaths.some(path => normalizedSource.includes(path))
}

function getStylesheetSource(entry: unknown): string {
  if (entry === null) return ''
  if (typeof entry === 'string') return entry
  if (typeof entry !== 'object') return ''
  if (!('src' in entry)) return ''

  const source = entry.src
  if (typeof source !== 'string') return ''

  return source
}
