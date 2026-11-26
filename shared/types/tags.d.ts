/**
 * Tag structure used in the API.
 * This is used in the API response and in the Post type.
 * It includes the tag's ID, name, category, optional icon, and timestamps.
 */
export type ApiTag = {
  id: number
  name: string
  title_fr?: string
  title_en?: string
  category: string
  description: string
  description_fr?: string
  description_en?: string
  icon?: string | null
  icon_svg?: string | null
  color?: string | null
  created_at: string
  updated_at: string
  count?: number
}

/**
 * Tag structure used in the UI.
 * This is used in the Post type and in the UI components.
 * It includes the tag's name and an optional category.
 */
export type Tag = {
  name: string
  title_fr?: string
  title_en?: string
  category?: string
  description?: string
  description_fr?: string
  description_en?: string
  icon?: string | null
  icon_svg?: string | null
  color?: string | null
}

export interface TagWithUsage extends ApiTag {
  count: number
  isUsed: boolean
}

export interface TagStats {
  total: number
  custom: number
}

export interface TagUsageStats {
  total: number
  used: number
  unused: number
  categories: number
}
