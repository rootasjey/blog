import { and, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { getSettingValue } from '~~/server/utils/siteSettings'

export const USER_ROLES = ['reader', 'writer', 'editor', 'admin'] as const
export type UserRole = typeof USER_ROLES[number]
export type PostPermission = 'read' | 'edit' | 'publish' | 'ai'

export type PermissionActor = {
  id: number
  role: string
  authMethod?: 'session' | 'api_key'
  apiKeyScopes?: string[]
  apiKeyPostIds?: number[]
}

export type PermissionPost = { id: number; user_id: number; status?: string }

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}

export async function getEditorsCanEditAllArticles() {
  return getSettingValue('editors_can_edit_all_articles', false)
}

export async function hasPostPermission(
  actor: PermissionActor,
  post: PermissionPost,
  permission: PostPermission,
): Promise<boolean> {
  if (actor.authMethod === 'api_key') {
    const scopes = actor.apiKeyScopes ?? []
    const isLegacyWildcardKey = scopes.includes('*')

    const requiredScope = permission === 'read'
      ? 'posts:read'
      : permission === 'ai'
        ? 'ai:run'
        : 'posts:write'
    if (!isLegacyWildcardKey && !scopes.includes(requiredScope)) return false
    const postIds = actor.apiKeyPostIds ?? []
    const isPostAuthorized = postIds.includes(post.id) || (isLegacyWildcardKey && post.user_id === actor.id)
    if (!isPostAuthorized) return false
    if (permission === 'read') return true

    const account = await db.query.users.findFirst({
      where: eq(schema.users.id, actor.id),
      columns: { access_role: true },
    })
    return account?.access_role !== 'reader' && Boolean(account)
  }

  const account = await db.query.users.findFirst({
    where: eq(schema.users.id, actor.id),
    columns: { access_role: true },
  })
  if (!account) return false

  const storedRole = account.access_role || actor.role
  const role = storedRole === 'user' ? 'editor' : storedRole === 'moderator' ? 'reader' : storedRole
  if (role === 'admin') return true
  if (permission === 'read' && post.status === 'published') return true
  if (permission === 'read' && actor.id === post.user_id) return true
  if (permission === 'read' && role === 'editor' && await getEditorsCanEditAllArticles()) return true
  if (permission === 'ai') permission = 'edit'

  const isOwner = actor.id === post.user_id
  if (permission === 'edit' && isOwner && (role === 'writer' || role === 'editor')) return true
  if (permission === 'publish' && isOwner && role === 'writer') return true

  if (permission === 'edit' && role === 'editor' && await getEditorsCanEditAllArticles()) return true

  const collaborator = await db.query.post_collaborators.findFirst({
    where: and(
      eq(schema.post_collaborators.post_id, post.id),
      eq(schema.post_collaborators.user_id, actor.id),
    ),
  })

  if (!collaborator) return false
  if (permission === 'read') return true
  if (permission === 'edit') return collaborator.can_edit
  if (permission === 'publish') return collaborator.can_publish
  return true
}

export async function assertPostPermission(
  actor: PermissionActor,
  post: PermissionPost,
  permission: PostPermission,
) {
  if (await hasPostPermission(actor, post, permission)) return
  throw createError({
    statusCode: 403,
    statusMessage: `You are not authorized to ${permission} this post`,
  })
}
