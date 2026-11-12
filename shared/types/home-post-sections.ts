export type HomePostSectionKey = 'featuredPosts' | 'recentPosts'
export type HomePostTagMatch = 'any' | 'all'

export type HomePostSectionConfig = {
  title: { fr: string; en: string }
  includeTags: string[]
  excludeTags: string[]
  tagMatch: HomePostTagMatch
}

export type HomePostSectionsContent = Record<HomePostSectionKey, HomePostSectionConfig>

export const DEFAULT_HOME_POST_SECTIONS: HomePostSectionsContent = {
  featuredPosts: {
    title: { fr: 'Articles à la une', en: 'Featured Posts' },
    includeTags: [],
    excludeTags: ['top pinned', 'featured project', 'project'],
    tagMatch: 'any',
  },
  recentPosts: {
    title: { fr: 'Le journal', en: 'The Journal' },
    includeTags: [],
    excludeTags: ['top pinned', 'featured post', 'featured project'],
    tagMatch: 'any',
  },
}
