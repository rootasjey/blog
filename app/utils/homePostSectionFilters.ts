import type { HomePostSectionConfig } from '~~/shared/types/home-post-sections'

type TaggedPost = { tags?: Array<{ name: string }> | null }

export function filterHomePosts<T extends TaggedPost>(posts: T[], config: HomePostSectionConfig) {
  const includeTags = new Set(config.includeTags.map(normalizeTag))
  const excludeTags = new Set(config.excludeTags.map(normalizeTag))

  return posts.filter((post) => {
    const postTags = new Set((post.tags ?? []).map(tag => normalizeTag(tag.name)))
    if ([...excludeTags].some(tag => postTags.has(tag))) return false

    if (includeTags.size === 0) return true

    if (config.tagMatch === 'all') {
      return [...includeTags].every(tag => postTags.has(tag))
    }

    return [...includeTags].some(tag => postTags.has(tag))
  })
}

function normalizeTag(value: string) {
  return value.trim().toLocaleLowerCase()
}
