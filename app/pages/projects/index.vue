<template>
  <div class="min-h-screen py-6 site-project-index">
    <div class="container mx-auto px-4 md:px-8">
      <CollectionIntro
        v-if="activeTab === 'published' && !isAdmin"
        :title="publicIntroCopy.title"
        :description="publicIntroCopy.description"
        animateCopy
      />

      <!-- Admin-only project controls -->
      <div v-if="isAdmin" class="site-admin-list-header">
        <div class="site-admin-list-header-copy-wrap">
          <SlidingCopy
            :title="activeTab === 'published' ? $t('pages.projects.heading') : activeTab === 'drafts' ? $t('pages.posts.draftsHeading') : $t('pages.posts.archivedHeading')"
            :description="activeTab === 'published' ? $t('pages.projects.description') : activeTab === 'drafts' ? $t('pages.projects.draftsDescription') : $t('pages.projects.archivedDescription')"
            :direction="copySlideDirection"
            title-class="site-admin-heading"
            description-class="site-admin-intro"
          />
        </div>
      </div>

      <ClientOnly>
        <div v-if="isAdmin" class="site-admin-post-controls">
          <AdminListTabs :model-value="activeTab" :items="adminTabs" :label="$t('pages.projects.heading')" @select="setTab" />

          <div class="site-admin-post-actions">
            <NButton @click="isNewDrawerOpen = true" btn="primary" size="xs" leading="i-ph-plus-bold" class="site-admin-post-create">
              {{ $t('pages.projects.newProject') }}
            </NButton>
            <NDropdownMenu :items="viewDropdownItems" :_dropdownMenuContent="{ side: 'bottom', align: 'end' }">
              <template #default>
                <NButton btn="ghost-gray" size="xs" icon :aria-label="$t('common.changeView')" class="site-admin-post-options-trigger">
                  <NIcon name="i-ph-dots-three-vertical" />
                </NButton>
              </template>
            </NDropdownMenu>
          </div>
        </div>
        <NewPostDrawer v-model="isNewDrawerOpen" @created="onPostCreated" defaultTag="project" />
      </ClientOnly>

      <!-- Projects list (grid cards & list view) -->
      <PostsList
        v-if="isAdmin && activeTab === 'published' && posts && posts.length > 0"
        :posts="enhancedPosts"
        :viewMode="viewMode"
        :isAdmin="isAdmin"
        :selectionMode="selectionMode"
        :selectedSlugs="selectedSlugs"
        :duplicatingPosts="duplicatingPosts"
        :menuItemsForPost="menuItemsForPost"
        @toggle-selected="toggleSelected"
        @long-press-start="startLongPress"
        @long-press-cancel="cancelLongPress"
        @post-click="onPostCardClick"
        :linkForPost="(p) => `/posts/${p.slug}`"
        :entered="entered"
        projectCardLayout
      />

      <section v-else-if="activeTab === 'published' && !isLoadingVisible && publicProjects.length" class="site-demo-projects">
        <NuxtLink v-for="project in publicProjects" :key="project.slug" :to="project.to" class="site-demo-project">
          <div class="site-demo-project-image">
            <PostImage :src="project.image" :alt="project.title" />
          </div>
          <h2>{{ project.title }}</h2>
          <p class="site-demo-project-meta">
            <ProjectTag :label="project.category" />
            <time :datetime="project.date">{{ project.year }}</time>
          </p>
        </NuxtLink>
      </section>

      <!-- Loading state -->
      <div v-else-if="isLoadingVisible" class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400">{{ $t('pages.projects.loading') }}</p>
      </div>

      <!-- Empty state (styled like error page) -->
      <div v-else-if="!hasVisiblePosts && !isLoadingVisible" class="text-center py-12">
        <div class="mb-6">
          <p class="error-code text-8xl md:text-size-54 font-extrabold leading-none">0</p>
        </div>

        <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-800 mb-4">{{ $t('pages.projects.emptyHeading') }}</h2>

        <p class="font-body font-500 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-8">
          {{ $t('pages.projects.emptyDescription') }}
        </p>

        <div class="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <NuxtLink to="/" class="px-6 py-5 bg-black dark:bg-white text-white dark:text-black text-sm font-500 uppercase tracking-wide rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center gap-2">
            <div class="i-ph-house-bold w-4 h-4"></div>
            {{ $t('common.goHome') }}
          </NuxtLink>

          <NuxtLink to="/credits" class="px-6 py-5 border border-gray-300 dark:border-gray-700 text-sm font-500 uppercase tracking-wide rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition flex items-center gap-2">
            <div class="i-ph-arrow-left-bold w-4 h-4"></div>
            {{ $t('common.browseCredits') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Drafts (admin tab) -->
      <ClientOnly>
        <PostsList
          v-if="isAdmin && activeTab === 'drafts' && enhancedDrafts.length > 0"
          :posts="enhancedDrafts"
          :viewMode="viewMode"
          :isAdmin="isAdmin"
          :selectionMode="selectionMode"
          :selectedSlugs="selectedSlugs"
          :duplicatingPosts="duplicatingPosts"
          :menuItemsForPost="menuItemsForPost"
          @toggle-selected="toggleSelected"
          @long-press-start="startLongPress"
          @long-press-cancel="cancelLongPress"
          @post-click="onPostCardClick"
          :linkForPost="(p) => `/posts/edit/${p.slug}`"
          :entered="entered"
          projectCardLayout
        />
      </ClientOnly>

      <!-- Archived (admin tab) -->
      <ClientOnly>
        <PostsList
          v-if="isAdmin && activeTab === 'archived' && enhancedArchived.length > 0"
          :posts="enhancedArchived"
          :viewMode="viewMode"
          :isAdmin="isAdmin"
          :selectionMode="selectionMode"
          :selectedSlugs="selectedSlugs"
          :duplicatingPosts="duplicatingPosts"
          :menuItemsForPost="menuItemsForPost"
          @toggle-selected="toggleSelected"
          @long-press-start="startLongPress"
          @long-press-cancel="cancelLongPress"
          @post-click="onPostCardClick"
          :linkForPost="(p) => `/posts/${p.slug}`"
          :entered="entered"
          projectCardLayout
        />
      </ClientOnly>
    </div>
  </div>

  <div v-if="!isAdmin && activeTab === 'published'" class="site-public-archive-footer site-project-index-footer">
    <NewsletterSubscription />
    <HomeRecommendations />
  </div>

  <!-- Confirm Delete Modal -->
  <NDialog v-model:open="confirmDialogOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ $t('common.deletePost') }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('pages.projects.deleteConfirm', { name: postPendingDelete?.name }) }}</p>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="confirmDialogOpen = false">{{ $t('common.cancel') }}</NButton>
        <NButton btn="danger" size="sm" @click="confirmDelete" :loading="deleting">{{ $t('common.delete') }}</NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import { watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'
const router = useRouter()
const confirmDialogOpen = ref(false)
const postPendingDelete = ref<Post | null>(null)
const deleting = ref(false)
const duplicatingPosts = ref(new Set<string | number>())

const { enhancePost } = usePost()
const { user, loggedIn } = useUserSession()

// New post drawer state + handler
const isNewDrawerOpen = ref(false)
function onPostCreated(p: Post) {
  if (!posts.value) posts.value = [p]
  else posts.value.unshift(p)
}

const projectTags = ['project', 'featured project']

async function fetchProjectPosts() {
  const results = await Promise.all(
    projectTags.map(tag => $fetch<Post[]>(`/api/posts?tag=${encodeURIComponent(tag)}`))
  )
  const merged = new Map<string, Post>()
  for (const list of results) {
    for (const post of list) {
      merged.set(post.slug, post)
    }
  }
  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || '') || 0
    const bTime = Date.parse(b.createdAt || '') || 0
    return bTime - aTime
  })
}

// Fetch project posts from API (tags: project + featured project)
const { data: posts, pending, error } = await useAsyncData('project-posts', fetchProjectPosts)

// Drafts & archived (lazy fetch on toggle) — filtered by project tags (mirrors posts page)
const { data: drafts, pending: draftsPending, execute: fetchDrafts } = await useAsyncData<Post[]>('project-drafts', async () => {
  const results = await Promise.all(projectTags.map(tag => $fetch<Post[]>(`/api/posts/drafts?tag=${encodeURIComponent(tag)}`)))
  const merged = new Map<string, Post>()
  for (const list of results) {
    for (const post of list) {
      merged.set(post.slug, post)
    }
  }
  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || '') || 0
    const bTime = Date.parse(b.createdAt || '') || 0
    return bTime - aTime
  })
}, { immediate: false })

const { data: archived, pending: archivedPending, execute: fetchArchived } = await useAsyncData<Post[]>('project-archived', async () => {
  const results = await Promise.all(projectTags.map(tag => $fetch<Post[]>(`/api/posts/archived?tag=${encodeURIComponent(tag)}`)))
  const merged = new Map<string, Post>()
  for (const list of results) {
    for (const post of list) {
      merged.set(post.slug, post)
    }
  }
  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || '') || 0
    const bTime = Date.parse(b.createdAt || '') || 0
    return bTime - aTime
  })
}, { immediate: false })

// Admin tab state – controls which list is shown for admins (published/drafts/archived)
const activeTab = useStorage<'published'|'drafts'|'archived'>('projects.activeTab', 'published')
const adminTabs = computed(() => [
  { value: 'published' as const, label: $t('pages.posts.published') },
  { value: 'drafts' as const, label: $t('pages.posts.drafts') },
  { value: 'archived' as const, label: $t('pages.posts.archived') },
])
const copySlideDirection = ref(1)
const tabOrder = ['published', 'drafts', 'archived'] as const

function setTab(tab: 'published'|'drafts'|'archived') {
  if (tab === activeTab.value) return
  copySlideDirection.value = tabOrder.indexOf(tab) > tabOrder.indexOf(activeTab.value) ? 1 : -1
  activeTab.value = tab
  if (tab === 'drafts' && !drafts.value) fetchDrafts()
  if (tab === 'archived' && !archived.value) fetchArchived()
}

const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin') 

// Persistent view preference for projects
const viewMode = useStorage<'cards'|'list'>('projects.viewMode.v3', 'cards')
const isListView = computed(() => viewMode.value === 'list')
const viewDropdownItems = computed(() => [
  { label: $t('pages.posts.cardsView'), onSelect: () => (viewMode.value = 'cards'), leading: 'i-ph-squares-four', trailing: viewMode.value === 'cards' ? 'i-ph-check' : undefined },
  { label: $t('pages.posts.listView'), onSelect: () => (viewMode.value = 'list'), leading: 'i-ph-list-checks', trailing: viewMode.value === 'list' ? 'i-ph-check' : undefined },
])

// Enhance posts with computed properties
const enhancedPosts = computed(() => posts.value ? posts.value.map(p => enhancePost(p)) : [])
const enhancedDrafts = computed(() => drafts.value ? drafts.value.map(p => enhancePost(p)) : [])
const enhancedArchived = computed(() => archived.value ? archived.value.map(p => enhancePost(p)) : [])

const visiblePosts = computed(() => {
  if (activeTab.value === 'published') return enhancedPosts.value
  if (activeTab.value === 'drafts') return enhancedDrafts.value
  if (activeTab.value === 'archived') return enhancedArchived.value
  return [] as Post[]
})

const hasVisiblePosts = computed(() => {
  if (activeTab.value === 'published') return enhancedPosts.value.length > 0
  if (activeTab.value === 'drafts') return enhancedDrafts.value.length > 0
  if (activeTab.value === 'archived') return enhancedArchived.value.length > 0
  return false
})

const isLoadingVisible = computed(() => {
  if (activeTab.value === 'published') return pending.value
  if (activeTab.value === 'drafts') return draftsPending.value
  if (activeTab.value === 'archived') return archivedPending.value
  return false
})

// subtle entrance animation state for project cards
const entered = ref(false) 

// Selection & long-press helpers (same UX as posts list)
const selectedSlugs = ref(new Set<string>())
const selectionMode = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function toggleSelected(slug: string) {
  const next = new Set(selectedSlugs.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  selectedSlugs.value = next
}

function startLongPress(slug: string) {
  if (selectionMode.value) return
  cancelLongPress()
  longPressTimer = setTimeout(() => {
    selectionMode.value = true
    // don't auto-select the item to mirror posts behavior
  }, 600)
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onPostCardClick(evt: MouseEvent, post: Post) {
  if (selectionMode.value) {
    evt.preventDefault()
    toggleSelected(post.slug)
  }
}

// trigger entrance animations once projects are loaded and visible
watch(
  [() => visiblePosts.value.length, () => isLoadingVisible.value, () => activeTab.value],
  async ([len, loading]) => {
    if (loading) return
    entered.value = false
    await nextTick()
    if (import.meta.client) {
      const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: FrameRequestCallback) => setTimeout(cb, 16)
      raf(() => setTimeout(() => { entered.value = true }, 30))
    } else {
      // Server: mark entered immediately to avoid calling browser APIs
      entered.value = true
    }
  },
  { immediate: true }
)

function handleGlobalKeydown(e: KeyboardEvent) {
  // Ignore if event already handled or modifier keys are pressed
  if (e.defaultPrevented) return
  if (e.metaKey || e.ctrlKey || e.altKey) return

  // Don't react while the user is typing in inputs, textareas, or contentEditable elements
  const target = e.target as HTMLElement | null
  if (target) {
    const tag = target.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return
  }

  const key = (e.key || '').toLowerCase()
  if (key === 'a' && isAdmin.value) setTab('archived')
  else if (key === 'p' && isAdmin.value) setTab('published')
  else if (key === 'd' && isAdmin.value) setTab('drafts')
  else if (key === 'l') viewMode.value = viewMode.value === 'list' ? 'cards' : 'list'
}

onMounted(() => {
  if (activeTab.value === 'drafts' && !drafts.value) fetchDrafts()
  if (activeTab.value === 'archived' && !archived.value) fetchArchived()

  if (import.meta.client) {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onUnmounted(() => {
  cancelLongPress()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})

const { $t, $getLocale } = useI18n()

const publicIntroCopy = computed(() => $getLocale() === 'fr'
  ? {
      title: 'Projets sélectionnés',
      description: 'Études de cas, explorations produit et systèmes visuels développés au fil de projets indépendants et collaboratifs. Un aperçu du travail guidé par la clarté, la retenue et une réflexion à long terme.',
    }
  : {
      title: 'Selected Works',
      description: 'Case studies, product explorations, and visual systems developed across independent and collaborative projects. A focused look at work shaped by clarity, restraint, and long-term thinking.',
    })

const demoProjects = computed(() => {
  const locale = $getLocale() === 'fr' ? 'fr' : 'en'
  return PRESENTATION_POSTS.filter(post => post.isProject).map(post => ({
    slug: post.slug,
    to: localizedPath(`/preview/${post.slug}`, $getLocale()),
    title: post.title[locale],
    image: post.image,
    category: post.tag[locale],
    date: post.publishedAt,
    year: new Date(post.publishedAt).getFullYear(),
  }))
})

const publicProjects = computed(() => {
  if (!enhancedPosts.value.length) return demoProjects.value

  const locale = $getLocale() === 'fr' ? 'fr' : 'en'
  return enhancedPosts.value.map(post => {
    const category = post.tags?.find(tag => !projectTags.includes(tag.name.toLowerCase()))?.name
    const date = post.publishedAt || post.createdAt

    return {
      slug: post.slug,
      to: localizedPath(`/posts/${post.slug}`, locale),
      title: post.name,
      image: post.image?.src || '',
      category: category || (locale === 'fr' ? 'Projet' : 'Project'),
      date,
      year: date ? new Date(date).getFullYear() : '',
    }
  })
})
const config = useRuntimeConfig()

useSeoMeta({
  title: $t('pages.projects.metaTitle'),
  description: $t('pages.projects.metaDescription'),
  ogTitle: $t('pages.projects.metaTitle'),
  ogDescription: $t('pages.projects.metaDescription'),
  ogUrl: `${config.public.siteUrl}/projects`,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/projects` }],
})

async function refreshAllLists() {
  try {
    posts.value = await fetchProjectPosts()
    if (drafts.value || activeTab.value === 'drafts') await fetchDrafts()
    if (archived.value || activeTab.value === 'archived') await fetchArchived()
  } catch (e) {
    console.error('Failed to refresh posts', e)
  }
}

async function updatePostStatus(post: Post, status: 'draft'|'published'|'archived') {
  try {
    await $fetch(`/api/posts/${post.slug}`, { method: 'PUT' as any, body: { status } })
    await refreshAllLists()
  } catch (e) {
    console.error('Failed to update status', e)
    throw e
  }
}

async function deletePost(post: Post) {
  if (!post) return
  try {
    await $fetch(`/api/posts/${post.slug}`, { method: 'DELETE' as any })
    await refreshAllLists()
  } catch (e) {
    console.error('Failed to delete post', e)
    throw e
  }
}

function editPost(post: Post) {
  router.push(`/posts/edit/${post.slug}`)
}

function menuItemsForPost(post: Post) {
  const isDup = duplicatingPosts.value.has(post.slug)
  return [
    {
      label: $t('pages.posts.status'),
      items: [
        { label: $t('pages.posts.draft'), trailing: post.status === 'draft' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'draft'), disabled: isDup },
        { label: $t('pages.posts.published'), trailing: post.status === 'published' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'published'), disabled: isDup },
        { label: $t('pages.posts.archived'), trailing: post.status === 'archived' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'archived'), disabled: isDup },
      ]
    },
    { label: $t('common.preview'), onSelect: () => previewPost(post), leading: 'i-ph-external-link', disabled: isDup },
    { label: $t('common.edit'), onSelect: () => !isDup && editPost(post), leading: 'i-ph-pencil', disabled: isDup },
    { label: $t('pages.posts.duplicate'), onSelect: () => !isDup && duplicatePost(post), leading: 'i-ph-copy', disabled: isDup },
    { label: $t('common.deletePost'), onSelect: () => !isDup && (postPendingDelete.value = post, confirmDialogOpen.value = true), leading: 'i-ph-trash', color: 'danger', disabled: isDup },
  ]
}

function previewPost(post: Post) {
  window.open(`/posts/${post.slug}`, '_blank')
}

async function confirmDelete() {
  if (!postPendingDelete.value) return
  deleting.value = true
  try {
    await deletePost(postPendingDelete.value)
    postPendingDelete.value = null
    confirmDialogOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

async function duplicatePost(post: Post) {
  if (!post) return
  duplicatingPosts.value = new Set([...duplicatingPosts.value, post.slug])
  try {
    const created: any = await $fetch(`/api/posts/${post.slug}/duplicate`, { method: 'POST' as any })
    if (created?.slug) {
      router.push(`/posts/edit/${created.slug}`)
    }
  } catch (e) {
    console.error('Failed to duplicate post', e)
  } finally {
    const s = new Set(duplicatingPosts.value)
    s.delete(post.slug)
    duplicatingPosts.value = s
  }
}
</script>

<style scoped>
@layer components {

.error-code {
  color: transparent;
  -webkit-text-stroke: 2px #F5E5E1;
  cursor: default;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.duplicate-overlay {
  background-image: linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 50%, rgba(59,130,246,0.06) 100%);
  background-size: 200% 100%;
  animation: duplicate-sweep 2.5s linear infinite;
}

@keyframes duplicate-sweep {
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
}

.dark .error-code {
  -webkit-text-stroke: 2px #374151;
}

.error-code:hover {
  -webkit-text-stroke: 3px #FF8F8F;
  transform: scale(0.99);
  animation: stroke-rainbow 3s linear infinite;
}

.dark .error-code:hover {
  -webkit-text-stroke: 3px #FF8F8F;
}

@keyframes stroke-pulse {
  0%, 100% {
    -webkit-text-stroke-width: 3px;
    filter: drop-shadow(0 0 0px #FF8F8F);
  }
  50% {
    -webkit-text-stroke-width: 4px;
    filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.6));
  }
}

@keyframes stroke-rainbow {
  0% { -webkit-text-stroke-color: #FF8F8F; }
  25% { -webkit-text-stroke-color: #FFF1CB; }
  50% { -webkit-text-stroke-color: #C2E2FA; }
  75% { -webkit-text-stroke-color: #B7A3E3; }
  100% { -webkit-text-stroke-color: #FF8F8F; }
}

/* List view tweaks */
.post-list-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
}
.post-list-thumb {
  width: 144px;
  height: 96px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
}
}
</style>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-demo-projects { display: grid; width: 100%; max-width: 700px; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px 24px; margin: 0 auto 64px; }
.site-shell .site-demo-project { color: var(--site-color-text); text-decoration: none; }
.site-shell .site-demo-project-image { overflow: hidden; aspect-ratio: 4 / 3; border-radius: 12px; background: #2b2b30; }
.site-shell .site-demo-project-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 250ms ease; }
.site-shell .site-demo-project:hover .site-demo-project-image img { transform: scale(1.02); }
.site-shell .site-demo-project h2 { margin: 14px 0 6px; color: var(--site-color-heading); font-family: var(--site-font-body); font-size: 16px; font-weight: 550; }
.site-shell .site-demo-project p { margin: 0; color: var(--site-color-muted); font-size: 14px; line-height: 1.5; }
.site-shell .site-project-index { padding-top: 70px; }
.site-shell .site-project-index > .container { box-sizing: border-box; width: min(700px, calc(100% - 32px)); max-width: 700px; padding-inline: 0; }
.site-shell .site-project-index .site-collection-intro { width: 100%; margin: 0 0 106px; }
.site-shell .site-project-index .site-collection-avatar { margin-bottom: 48px; }
.site-shell .site-project-index .site-demo-projects { display: grid; width: 100%; max-width: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px; margin: 0; }
.site-shell .site-demo-project { min-width: 0; color: var(--site-color-text); text-decoration: none; }
.site-shell .site-demo-project-image { aspect-ratio: 16 / 9; overflow: hidden; border-radius: 16px; }
.site-shell .site-demo-project-image img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .35s cubic-bezier(.2, .7, .2, 1); }
.site-shell .site-demo-project h2 { margin: 16px 0 4px; color: var(--site-color-heading); font-size: 18px; font-weight: 550; line-height: 24px; }
.site-shell .site-demo-project-meta { display: flex; gap: 14px; margin: 0; color: var(--site-color-muted); font-size: 14px; line-height: 20px; }
.site-shell .site-demo-project:hover .site-demo-project-image img { transform: scale(1.025); }
.site-shell .site-demo-project:focus-visible { outline: 2px solid var(--site-color-accent); outline-offset: 5px; border-radius: 3px; }
.site-shell .site-project-index-footer .home-newsletter { margin-top: 120px; }
.site-shell .site-project-index { background: var(--site-color-background); color: var(--site-color-text); }
.site-shell .site-project-index > .container { width: min(700px, calc(100% - 32px)); max-width: 700px; margin-inline: auto; }
.site-shell .site-project-index > .container { padding-inline: 0; }
.site-shell .site-project-index [class~="border-gray-200"] { border-color: var(--site-color-border); }
.site-shell .site-project-index.site-project-index > .container { width: min(700px, calc(100% - 32px)); max-width: 700px; }
@media (max-width: 1023px) {
  .site-shell .site-project-index { padding-top: 40px; }
}
@media (max-width: 1023px) {
  .site-shell .site-project-index .site-collection-avatar { margin-bottom: 32px; }
}
@media (max-width: 1023px) {
  .site-shell .site-project-index .site-collection-intro { margin-bottom: 52px; }
}
@media (max-width: 1023px) {
  .site-shell .site-project-index .site-demo-projects { width: 100%; max-width: 100%; margin: 0; }
}
@media (max-width: 1023px) {
  .site-shell .site-project-index-footer .home-newsletter { margin-top: 80px; }
}
@media (max-width: 600px) {
  .site-shell .site-demo-projects { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .site-shell .site-project-index .site-demo-projects { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  .site-shell .site-project-index .site-demo-projects { gap: 28px; }
}

/* Project archive follows Core's image-led two-column works grid. */
.site-shell .site-project-index > .container,
.site-shell .site-project-index.site-project-index > .container {
  width: min(720px, calc(100% - 40px));
  max-width: 720px;
}
.site-shell .site-project-index .site-collection-intro {
  width: 100%;
  max-width: 100%;
  margin-bottom: 80px;
}
.site-shell .site-project-index .site-collection-intro p { font-weight: 500; }
.site-shell .site-project-index .site-demo-projects { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px; }
.site-shell .site-project-index .site-demo-project-image { aspect-ratio: 16 / 9; border-radius: 16px; }
.site-shell .site-project-index .site-demo-project h2 { margin-top: 16px; font-size: 18px; line-height: 24px; }
.site-shell .site-project-index .site-demo-project-meta { font-size: 14px; line-height: 20px; }
.site-shell .site-project-index .site-admin-list-header { width: 100%; max-width: 100%; margin: 0 0 36px; }
.site-shell .site-project-index .site-admin-post-controls { width: 100%; }

@media (max-width: 767px) {
  .site-shell .site-project-index > .container,
  .site-shell .site-project-index.site-project-index > .container { width: calc(100% - 40px); }
  .site-shell .site-project-index .site-collection-intro { margin-bottom: 52px; }
  .site-shell .site-project-index .site-demo-projects { grid-template-columns: minmax(0, 1fr); gap: 36px; }
  .site-shell .site-project-index .site-demo-project h2 { margin-top: 14px; font-size: 21px; }
  .site-shell .site-project-index .site-admin-list-header { width: 100%; margin-bottom: 32px; }
}
}
</style>
