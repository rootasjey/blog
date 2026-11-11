<template>
  <main v-if="post" class="min-h-screen site-post site-dynamic-post">
    <header class="site-post-header">
      <div class="container">
        <div>
          <nav class="site-preview-topic-nav" :aria-label="locale === 'fr' ? 'Articles associés' : 'Related posts'">
            <NuxtLink
              v-if="previousPost"
              class="site-post-nav-link site-post-nav-link-previous"
              :to="localizedPath(`/posts/${previousPost.slug}`, locale)"
              :aria-label="locale === 'fr' ? 'Article précédent' : 'Previous Post'"
              :data-cursor-tooltip="locale === 'fr' ? 'Article précédent' : 'Previous Post'"
            >
              <span class="i-ph-arrow-left" aria-hidden="true" />
            </NuxtLink>
            <span v-else class="site-post-nav-spacer" aria-hidden="true" />
            <div v-if="primaryTag" class="site-post-tag-group">
              <NuxtLink
                class="site-preview-tag site-interactive-hover"
                :to="tagPath(primaryTag.name)"
                :style="{ '--post-tag-color': postTagColor(primaryTag.name, primaryTag.color) }"
              >
                <span class="site-preview-tag-mark" aria-hidden="true">
                  <NIcon v-if="primaryTag.icon" :name="primaryTag.icon" class="site-preview-tag-icon" />
                  <span v-else>{{ primaryTag.name.slice(0, 1).toUpperCase() }}</span>
                </span>
                {{ primaryTag.name }}
              </NuxtLink>
              <div v-if="extraTags.length" ref="extraTagsPopover" class="site-post-extra-tags">
                <button
                  type="button"
                  class="site-post-extra-tags-trigger"
                  :aria-label="extraTagsLabel"
                  aria-controls="site-post-extra-tags-menu"
                  :aria-expanded="isExtraTagsOpen"
                  :class="{ 'is-open': isExtraTagsOpen }"
                  @click="isExtraTagsOpen = !isExtraTagsOpen"
                >
                  +{{ extraTags.length }}
                </button>
                <Transition name="site-extra-tags">
                  <div v-if="isExtraTagsOpen" id="site-post-extra-tags-menu" class="site-post-extra-tags-menu">
                    <NuxtLink
                      v-for="tag in extraTags"
                      :key="tag.id"
                      :to="tagPath(tag.name)"
                      :style="{ '--post-tag-color': postTagColor(tag.name, tag.color) }"
                    >
                      <span class="site-preview-tag-mark" aria-hidden="true">
                        <NIcon v-if="tag.icon" :name="tag.icon" class="site-preview-tag-icon" />
                        <span v-else>{{ tag.name.slice(0, 1).toUpperCase() }}</span>
                      </span>
                      {{ tag.name }}
                    </NuxtLink>
                  </div>
                </Transition>
              </div>
            </div>
            <span v-else class="site-post-nav-spacer" aria-hidden="true" />
            <NuxtLink
              v-if="nextPost"
              class="site-post-nav-link site-post-nav-link-next"
              :to="localizedPath(`/posts/${nextPost.slug}`, locale)"
              :aria-label="locale === 'fr' ? 'Article suivant' : 'Next Post'"
              :data-cursor-tooltip="locale === 'fr' ? 'Article suivant' : 'Next Post'"
            >
              <span class="i-ph-arrow-right" aria-hidden="true" />
            </NuxtLink>
            <span v-else class="site-post-nav-spacer" aria-hidden="true" />
          </nav>
          <h1>{{ post.name }}</h1>
          <p v-if="post.description" class="post-summary">{{ post.description }}</p>
        </div>
      </div>
    </header>

    <div v-if="post.image?.src" class="site-preview-cover">
      <button
        type="button"
        class="post-cover site-preview-cover-trigger"
        :aria-label="locale === 'fr' ? 'Agrandir la couverture' : 'Expand cover image'"
        @click="handleCoverClick"
      >
        <PostImage provider="hubblob" :src="post.image.src" :alt="post.image.alt || post.name" class="site-preview-cover-image" />
      </button>
    </div>

    <ReadingProgress v-if="post.article" content-selector=".site-post-content .post-content" />

    <article class="site-post-content">
      <div class="container">
        <div class="site-post-reading-column" @click="handleContentClick">
          <PostContent v-if="post.article" :content="post.article" />
        </div>
      </div>
    </article>

    <section v-if="!post.isProject" class="site-post-end">
      <div class="container">
        <div class="site-post-author-card site-post-public-byline">
          <NuxtLink
            v-if="singlePostAuthor"
            class="site-post-author-link"
            :to="authorPath(singlePostAuthor)"
            :aria-label="singlePostAuthor.name || $ts('components.postEndMatter.authorName')"
          >
            <div class="site-post-author-heading">
              <PostImage
                v-if="singlePostAuthor.avatar"
                provider="hubblob"
                :src="singlePostAuthor.avatar"
                :alt="singlePostAuthor.name || $ts('pages.post.userAlt')"
                width="32"
                height="32"
                loading="lazy"
              />
              <span>{{ singlePostAuthor.name || $ts('components.postEndMatter.authorName') }}</span>
            </div>
            <p class="site-post-author-bio">{{ authorProfile?.biography || $ts('components.postEndMatter.authorBio') }}</p>
          </NuxtLink>
          <div v-else-if="postAuthors.length > 1" class="site-post-author-link site-post-author-link--multiple">
            <PostAuthorAvatarStack :authors="postAuthors" :author-path="authorPath" />
          </div>

          <div class="site-post-public-meta">
            <time :datetime="post.publishedAt || post.createdAt">{{ formatPostDate(post.publishedAt || post.createdAt) }}</time>
            <NuxtLink v-if="isAdmin" class="site-post-edit-link" :to="editPostUrl">
              <NIcon name="i-ph-pencil-line" aria-hidden="true" />
              {{ $ts('pages.post.editPost') }}
            </NuxtLink>
          </div>
        </div>

        <div class="site-post-actions-row">
          <PostShareActions :title="post.name" />
          <NCombobox
            v-if="allVersions.length > 1"
            :items="allVersions"
            by="language"
            :model-value="selectedVersion"
            :aria-label="$ts('common.language')"
            :text-empty="$ts('common.noResults')"
            size="xs"
            class="site-post-language-combobox"
            :una="{ combobox: 'w-auto min-w-0', comboboxList: 'w-44 site-post-language-menu' }"
            :_combobox-trigger="{ ariaLabel: $ts('common.language'), trailing: '', una: { comboboxTrigger: 'site-post-language-trigger w-auto min-w-0', comboboxTriggerTrailing: 'hidden', btnTrailing: 'hidden' } }"
            :_combobox-input="{ placeholder: $ts('common.searchPlaceholder'), 'aria-label': $ts('common.language'), class: 'border-none' }"
            @update:model-value="onVersionChange"
          >
            <template #trigger="{ modelValue }">
              <span class="site-post-language-trigger-content">
                {{ modelValue?.label || $ts('common.language') }}
                <NIcon name="i-ph-caret-down" aria-hidden="true" />
              </span>
            </template>
            <template #label="{ item }">
              <span class="site-post-language-option">
                {{ item.label }}
              </span>
            </template>
          </NCombobox>
        </div>

        <PostRelatedArticles :articles="relatedArticles" />
      </div>
    </section>
    <NewsletterSubscription v-if="!post.isProject" />

    <transition :css="false" @enter="handleLightboxEnter" @leave="handleLightboxLeave">
      <div
        v-if="lightboxImage"
        class="lightbox-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="$ts('pages.post.expandedImage')"
        @click="closeLightbox"
      >
        <button type="button" class="lightbox-close" :aria-label="$ts('common.close')" @click.stop="closeLightbox">
          <span class="i-ph-x" aria-hidden="true" />
        </button>
        <div class="lightbox-image-frame" @click.stop>
          <img
            :src="lightboxImage.src"
            :alt="lightboxImage.alt || post.name"
            class="lightbox-image"
            :style="lightboxImageStyle"
          />
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import type { Post, PostAuthor } from '~~/shared/types/post'
import PostAuthorAvatarStack from '~/components/PostAuthorAvatarStack.vue'
import { localizedPath } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

const { $ts, $getLocale } = useI18n()
const route = useRoute()
const slug = route.params.slug as string
const { formatPostDate } = usePost()
const { loggedIn, user } = useUserSession()

const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')

const isEditableTarget = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  )
}

const handleEditShortcut = (event: KeyboardEvent) => {
  if (!isAdmin.value || !post.value) return
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  if (isEditableTarget(event.target)) return
  if (event.key.toLowerCase() !== 'e') return
  event.preventDefault()
  navigateTo(editPostUrl.value)
}

// Fetch post data from API
const { data: post, error } = await useFetch<Post>(`/api/posts/${slug}`)
if (error.value || !post.value) {
  const status = (error.value as any)?.statusCode || (error.value as any)?.status || 0
  if (status === 403) {
    throw createError({ statusCode: 403, statusMessage: $ts('pages.post.notAuthorized') })
  }
  throw createError({ statusCode: 404, statusMessage: $ts('pages.post.notFound') })
}

const { data: authorProfile } = post.value.user
  ? await useFetch<{ biography?: string | null }>(`/api/authors/${post.value.user.slug || post.value.user.id}`)
  : { data: ref<{ biography?: string | null } | null>(null) }

const { data: publishedPosts } = await useFetch<Post[]>('/api/posts', {
  query: { language: post.value.language, limit: 12 },
  default: () => [],
})

const editPostUrl = computed(() => localizedPath(`/posts/edit/${post.value?.slug || post.value?.id}`, $getLocale()))
const locale = computed(() => $getLocale())
const primaryTag = computed(() => post.value?.tags?.[0])
const extraTags = computed(() => post.value?.tags?.slice(1) ?? [])
const extraTagsLabel = computed(() => locale.value === 'fr' ? `Afficher ${extraTags.value.length} autres tags` : `Show ${extraTags.value.length} more tags`)
const extraTagsPopover = ref<HTMLElement | null>(null)
const isExtraTagsOpen = ref(false)
const tagPath = (name: string) => `${localizedPath('/posts', locale.value)}?tag=${encodeURIComponent(name)}`

const closeExtraTagsOnOutsideClick = (event: PointerEvent) => {
  const target = event.target
  if (target instanceof Node && !extraTagsPopover.value?.contains(target)) isExtraTagsOpen.value = false
}

const postAuthors = computed<PostAuthor[]>(() => {
  const authors = post.value?.authors ?? []
  if (authors.length) return authors
  const owner = post.value?.user
  if (!owner?.id) return []
  return [{ id: owner.id, name: owner.name ?? '', avatar: owner.avatar ?? '', biography: '', slug: owner.slug }]
})
const singlePostAuthor = computed(() => postAuthors.value.length === 1 ? postAuthors.value[0] : undefined)
const currentPostIndex = computed(() => (publishedPosts.value ?? []).findIndex(item => item.slug === post.value?.slug))
const previousPost = computed(() => {
  const index = currentPostIndex.value
  return index >= 0 ? publishedPosts.value?.[index + 1] : undefined
})
const nextPost = computed(() => {
  const index = currentPostIndex.value
  return index > 0 ? publishedPosts.value?.[index - 1] : undefined
})
const authorPath = (author: PostAuthor) => {
  const identifier = author.slug || author.id
  return localizedPath(identifier ? `/authors/${identifier}` : '/authors', locale.value)
}

// Fetch translations
const { data: translations } = await useFetch<any[]>('/api/posts/' + slug + '/translations', {
  query: { t: Date.now() },
  default: () => [],
})

const languageLabels: Record<string, string> = {
  en: 'English',
  fr: 'Fran\u00e7ais',
  es: 'Espa\u00f1ol',
  de: 'Deutsch',
  it: 'Italiano',
}

type PostVersion = { language: string; label: string; slug?: string; active: boolean }

const allVersions = computed<PostVersion[]>(() => {
  const current = post.value
  if (!current) return []
  const list: PostVersion[] = [
    { language: current.language, label: languageLabels[current.language] || current.language, active: true },
  ]
  for (const t of (translations.value || [])) {
    list.push({ language: t.language, label: languageLabels[t.language] || t.language, slug: t.slug, active: false })
  }
  return list
})

const selectedVersion = computed(() => allVersions.value.find(version => version.active) ?? null)

function onVersionChange(version: PostVersion | null) {
  if (!version?.slug || version.active) return
  navigateTo(localizedPath(`/posts/${version.slug}`, version.language))
}

const relatedArticles = computed(() => {
  const current = post.value
  if (!current) return []
  const candidates = (publishedPosts.value ?? []).filter(candidate => candidate.id !== current.id)
  const sharesTag = (candidate: Post) => candidate.tags?.some(tag => current.tags?.some(currentTag => currentTag.id === tag.id)) ?? false
  const selected = [
    ...candidates.filter(sharesTag),
    ...candidates.filter(candidate => !sharesTag(candidate)),
  ].slice(0, 2)

  return selected.map(candidate => ({
    to: localizedPath(`/posts/${candidate.slug}`, $getLocale()),
    title: candidate.name,
    image: candidate.image?.src || '/images/presentation/esc.webp',
    tag: candidate.tags?.[0]?.name,
    tagColor: candidate.tags?.[0]?.color,
    date: candidate.publishedAt || candidate.createdAt,
    dateLabel: formatPostDate(candidate.publishedAt || candidate.createdAt),
  }))
})

// Redirect to translated version when interface language changes
watch($getLocale, (newLocale) => {
  if (!post.value || newLocale === post.value.language) return
  const match = (translations.value || []).find(t => t.language === newLocale)
  if (match?.slug) {
    navigateTo(localizedPath(`/posts/${match.slug}`, newLocale))
  }
})

type LightboxImage = {
  src: string
  alt?: string
}

const lightboxImage = ref<LightboxImage | null>(null)
const lastImageOrigin = ref<{ x: number; y: number } | null>(null)
const lastImageRect = ref<DOMRect | null>(null)
let listenersAttached = false

const closeLightbox = () => {
  lightboxImage.value = null
  lastImageOrigin.value = null
}

const openImageLightbox = (image: HTMLImageElement) => {
  const src =
    image.currentSrc ||
    image.getAttribute('src') ||
    (image.dataset as Record<string, string | undefined>)['src'] ||
    (image.dataset as Record<string, string | undefined>)['lazySrc']

  if (!src) return

  if (import.meta.client) {
    const rect = image.getBoundingClientRect()
    lastImageOrigin.value = {
      x: Math.round(((rect.left + rect.width / 2) / window.innerWidth) * 100),
      y: Math.round(((rect.top + rect.height / 2) / window.innerHeight) * 100),
    }
    lastImageRect.value = rect
  } else {
    lastImageOrigin.value = null
    lastImageRect.value = null
  }

  lightboxImage.value = {
    src,
    alt: image.alt || undefined,
  }
}

const handleContentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target || target.tagName !== 'IMG') return

  event.preventDefault()
  openImageLightbox(target as HTMLImageElement)
}

const handleCoverClick = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLButtonElement
  const image = button.querySelector('img')
  if (image) openImageLightbox(image)
}

const lightboxImageStyle = computed(() => {
  if (!lastImageOrigin.value) {
    return { transformOrigin: 'center center' }
  }
  return {
    transformOrigin: `${lastImageOrigin.value.x}% ${lastImageOrigin.value.y}%`,
  }
})

const getTransitionParams = (img: HTMLImageElement | null) => {
  if (!img || !lastImageRect.value || !import.meta.client) return null
  const frame = img.closest('.lightbox-image-frame') as HTMLElement | null
  const finalWidth = frame?.clientWidth || img.clientWidth || 1
  const finalHeight = frame?.clientHeight || img.clientHeight || 1
  const scaleX = lastImageRect.value.width / finalWidth
  const scaleY = lastImageRect.value.height / finalHeight
  const startScale = Math.max(Math.min(Math.min(scaleX, scaleY), 1.5), 0.35)
  const deltaX = lastImageRect.value.left + lastImageRect.value.width / 2 - window.innerWidth / 2
  const deltaY = lastImageRect.value.top + lastImageRect.value.height / 2 - window.innerHeight / 2
  return { startScale, deltaX, deltaY }
}

const animateLightbox = (
  img: HTMLImageElement | null,
  from: { scale: number; deltaX: number; deltaY: number },
  to: { scale: number; deltaX: number; deltaY: number },
  done: () => void
) => {
  if (!img) {
    done()
    return
  }

  // Pre-set the starting transform so there is no blank frame before WA kicks in
  img.style.transform = `translate(${from.deltaX}px, ${from.deltaY}px) scale(${from.scale})`
  img.style.opacity = '1'

  const animation = img.animate(
    [
      {
        transform: `translate(${from.deltaX}px, ${from.deltaY}px) scale(${from.scale})`,
        opacity: 1,
      },
      {
        transform: `translate(${to.deltaX}px, ${to.deltaY}px) scale(${to.scale})`,
        opacity: 1,
      },
    ],
    {
      duration: 280,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    }
  )
  animation.onfinish = done
  animation.oncancel = done
}

const handleLightboxEnter = (el: Element, done: () => void) => {
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done()
    return
  }

  const img = el.querySelector<HTMLImageElement>('.lightbox-image')
  const params = getTransitionParams(img)
  if (!params) {
    done()
    return
  }
  animateLightbox(
    img,
    { scale: params.startScale, deltaX: params.deltaX, deltaY: params.deltaY },
    { scale: 1, deltaX: 0, deltaY: 0 },
    done
  )
}

const handleLightboxLeave = (el: Element, done: () => void) => {
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lastImageRect.value = null
    done()
    return
  }

  const img = el.querySelector<HTMLImageElement>('.lightbox-image')
  const params = getTransitionParams(img)
  if (!params) {
    done()
    return
  }
  animateLightbox(
    img,
    { scale: 1, deltaX: 0, deltaY: 0 },
    { scale: params.startScale, deltaX: params.deltaX, deltaY: params.deltaY },
    () => {
      lastImageRect.value = null
      done()
    }
  )
}

const handleDocumentScroll = () => {
  if (!lightboxImage.value) return
  closeLightbox()
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeLightbox()
  }
}

const addLightboxListeners = () => {
  if (listenersAttached || !import.meta.client) return
  listenersAttached = true
  window.addEventListener('scroll', handleDocumentScroll, { passive: true })
  window.addEventListener('wheel', handleDocumentScroll, { passive: true })
  window.addEventListener('touchmove', handleDocumentScroll, { passive: true })
  window.addEventListener('keydown', handleEscape, true)
}

const removeLightboxListeners = () => {
  if (!listenersAttached || !import.meta.client) return
  window.removeEventListener('scroll', handleDocumentScroll)
  window.removeEventListener('wheel', handleDocumentScroll)
  window.removeEventListener('touchmove', handleDocumentScroll)
  window.removeEventListener('keydown', handleEscape, true)
  listenersAttached = false
}

watch(lightboxImage, (value) => {
  if (!import.meta.client) return
  if (value) addLightboxListeners()
  else removeLightboxListeners()
})

onBeforeUnmount(() => {
  removeLightboxListeners()
})

if (import.meta.client) {
  useEventListener(document, 'keydown', handleEditShortcut)
  useEventListener(document, 'pointerdown', closeExtraTagsOnOutsideClick)
}

const config = useRuntimeConfig()
const ogImageUrl = computed(() => {
  const v = encodeURIComponent((post.value?.updatedAt as string) || new Date().toISOString())
  return `${config.public.siteUrl}/og/post/${route.params.slug}.png?v=${v}`
})

const { article, breadcrumbList } = useJsonld()

useSeoMeta({
  title: post.value.name,
  description: post.value.description || '',
  ogTitle: post.value.name,
  ogDescription: post.value.description || '',
  ogImage: ogImageUrl.value,
  ogUrl: `${config.public.siteUrl}/posts/${route.params.slug}`,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl.value,
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/posts/${route.params.slug}` }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(article(post.value!)),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(breadcrumbList([
        { name: 'Posts', url: '/posts' },
        { name: post.value!.name, url: `/posts/${route.params.slug}` },
      ])),
    },
  ],
})
</script>

<style scoped>
@layer components {

.social-btn {
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
}

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 6, 6, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 1.5rem;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 12px;
  background: rgb(20 20 20 / 78%);
  color: #fff;
  cursor: pointer;
  font-size: 20px;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.lightbox-close:hover {
  border-color: rgb(255 255 255 / 58%);
  background: rgb(45 45 45 / 92%);
}

.lightbox-close:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 3px;
}

.lightbox-image-frame {
  max-width: min(90vw, 1200px);
  max-height: 90vh;
  overflow: hidden;
  border-radius: var(--site-radius-cover);
  box-shadow: 0 25px 75px rgba(0, 0, 0, 0.45);
}

.lightbox-image {
  max-width: min(90vw, 1200px);
  max-height: 90vh;
  width: auto;
  height: auto;
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-close { transition: none; }
}
}
</style>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-preview-topic-nav .site-post-nav-spacer { display: block; width: 28px; height: 28px; flex: none; }
.site-shell .site-post-tag-group { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.site-shell .site-post-extra-tags { position: relative; flex: none; }
.site-shell .site-post-extra-tags-trigger { display: grid; min-width: 28px; height: 28px; padding-inline: 6px; place-items: center; border: 1px solid var(--site-color-social-border); border-radius: var(--site-radius-tag); background: transparent; color: var(--site-color-muted); cursor: pointer; font-size: 12px; font-weight: 600; line-height: 1; transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease; }
.site-shell .site-post-extra-tags-trigger:hover,
.site-shell .site-post-extra-tags-trigger:focus-visible,
.site-shell .site-post-extra-tags-trigger.is-open { border-color: var(--site-color-border); background: var(--site-color-hover-background); color: var(--site-color-heading); }
.site-shell .site-post-extra-tags-trigger:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.site-shell .site-post-extra-tags-menu { position: absolute; z-index: 10; top: calc(100% + 8px); left: 50%; display: grid; min-width: max-content; gap: 6px; padding: 8px; translate: -50% 0; border: 1px solid var(--site-color-border); border-radius: var(--site-radius-card); background: var(--site-color-background); box-shadow: 0 10px 30px rgb(0 0 0 / 16%); transform-origin: top center; }
.site-shell .site-extra-tags-enter-active,
.site-shell .site-extra-tags-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.site-shell .site-extra-tags-enter-from,
.site-shell .site-extra-tags-leave-to { opacity: 0; transform: translateY(-5px) scale(.97); }
.site-shell .site-post-extra-tags-menu > a { display: inline-flex; align-items: center; gap: 7px; padding: 5px 8px; border-radius: var(--site-radius-control); color: var(--post-tag-color); font-size: 13px; font-weight: 550; text-decoration: none; white-space: nowrap; transition: background-color 160ms ease, color 160ms ease; }
.site-shell .site-post-extra-tags-menu > a:hover,
.site-shell .site-post-extra-tags-menu > a:focus-visible { background: var(--site-color-hover-background); color: var(--site-color-heading); }
.site-shell .site-post-extra-tags-menu .site-preview-tag-mark { display: inline-grid; width: 18px; height: 18px; flex: none; place-items: center; border-radius: 5px; background: color-mix(in srgb, var(--post-tag-color) 14%, var(--site-color-surface)); font-size: 10px; font-weight: 650; line-height: 1; }
.site-shell .site-post-extra-tags-menu .site-preview-tag-icon { font-size: 11px; }
.site-shell .site-preview-topic-nav > .site-post-nav-link { position: relative; display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid transparent; border-radius: var(--site-radius-control); color: var(--site-color-muted); transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease; }
.site-shell .site-preview-topic-nav > .site-post-nav-link:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--site-color-text) 12%, transparent); background: color-mix(in srgb, var(--site-color-text) 5%, transparent); color: var(--site-color-heading); }
.site-shell .site-post-nav-link:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.site-shell .site-preview-cover-trigger { display: block; overflow: hidden; padding: 0; border: 0; border-radius: var(--site-radius-cover); background: transparent; cursor: zoom-in; }
.site-shell .site-preview-cover-trigger:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 4px; }
.site-shell .site-preview-cover-image { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.site-shell .site-post-author-heading { display: flex; width: fit-content; align-items: center; gap: 12px; color: var(--site-color-heading); font-size: 16px; font-weight: 550; }
.site-shell .site-post-author-heading > img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.site-shell .site-post-author-bio { margin: 14px 0 0; color: var(--site-color-muted); font-size: 14px; line-height: 1.55; }
.site-shell .site-post-actions-row { display: flex; width: min(700px, calc(100% - 32px)); align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: 20px auto 0; }
.site-shell .site-post-language-trigger { display: inline-flex; min-height: 36px; align-items: center; padding: 6px 10px; border: 1px solid var(--site-color-social-border); border-radius: var(--site-radius-control); background: transparent; color: var(--site-color-muted); font-size: 13px; transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.site-shell .site-post-language-trigger:hover,
.site-shell .site-post-language-trigger:focus-visible { border-color: var(--site-color-border); background: var(--site-color-hover-background); color: var(--site-color-heading); }
.site-shell .site-post-language-trigger:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.site-shell .site-post-language-trigger-content { display: inline-flex; align-items: center; gap: 8px; }
.site-shell .site-post-language-trigger-content .i-ph-caret-down { width: 14px; height: 14px; }
.site-post-language-menu { overflow: hidden; border: 1px solid var(--site-color-border); border-radius: var(--site-radius-control); background: var(--site-color-background); color: var(--site-color-text); box-shadow: 0 10px 30px rgb(0 0 0 / 14%); }
.site-post-language-menu .combobox-viewport { padding: 8px; }
.site-shell .site-post-language-option { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; }
.site-shell .site-post-edit-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid transparent; border-radius: var(--site-radius-control); transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease; }
.site-shell .site-post-edit-link:hover { border-color: var(--site-color-border); background: var(--site-color-hover-background); color: var(--site-color-heading); }
@media (max-width: 640px) {
  .site-shell .site-post-author-heading { gap: 10px; }
}
@media (max-width: 640px) {
  .site-shell .site-post-actions-row { gap: 8px; margin-top: 16px; }
  .site-shell .site-post-actions-row .site-post-share-actions { gap: 4px; }
  .site-shell .site-post-actions-row .site-post-share-actions > a,
  .site-shell .site-post-actions-row .site-post-share-actions > button { width: 32px; height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-preview-topic-nav > .site-post-nav-link { transition: none; }
  .site-shell .site-post-language-trigger { transition: none; }
  .site-shell .site-post-extra-tags-trigger,
  .site-shell .site-extra-tags-enter-active,
  .site-shell .site-extra-tags-leave-active { transition: none; }
  .site-shell .site-post-extra-tags-menu > a { transition: none; }
}
}
</style>
