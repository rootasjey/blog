import type { Tag } from '../types/tags'

type LocalizedTag = Pick<Tag, 'name' | 'title_fr' | 'title_en' | 'description' | 'description_fr' | 'description_en'>

export function localizedTagTitle(tag: LocalizedTag, locale: string): string {
  const translated = locale === 'fr' ? tag.title_fr : tag.title_en
  const alternate = locale === 'fr' ? tag.title_en : tag.title_fr
  return translated?.trim() || alternate?.trim() || tag.name
}
export function localizedTagDescription(tag: LocalizedTag, locale: string): string {
  const translated = locale === 'fr' ? tag.description_fr : tag.description_en
  const alternate = locale === 'fr' ? tag.description_en : tag.description_fr
  return translated?.trim() || alternate?.trim() || tag.description || ''
}
