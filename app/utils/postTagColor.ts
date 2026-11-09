const postTagAccents: Record<string, string> = {
  minimalism: 'var(--site-color-tag-violet)',
  minimalisme: 'var(--site-color-tag-violet)',
  design: 'var(--site-color-tag-coral)',
  creative: 'var(--site-color-tag-amber)',
  creativity: 'var(--site-color-tag-amber)',
  créativité: 'var(--site-color-tag-amber)',
  'digital culture': 'var(--site-color-tag-blue)',
  'culture numérique': 'var(--site-color-tag-blue)',
  'case studies': 'var(--site-color-tag-green)',
  'études de cas': 'var(--site-color-tag-green)',
  'visual essays': 'var(--site-color-tag-pink)',
  'essais visuels': 'var(--site-color-tag-pink)',
  analytics: 'var(--site-color-tag-neutral)',
  brand: 'var(--site-color-tag-neutral)',
  marque: 'var(--site-color-tag-neutral)',
}

export function postTagColor(name: string, customColor?: string | null) {
  if (customColor && /^#[\da-f]{6}$/i.test(customColor)) {
    return `color-mix(in srgb, ${customColor} 65%, var(--site-color-text))`
  }

  return postTagAccents[name.trim().toLocaleLowerCase()] || 'var(--site-color-tag-default)'
}
