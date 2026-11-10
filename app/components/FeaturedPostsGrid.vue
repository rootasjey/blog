<template>
  <section ref="section" class="home-featured-posts animate-entrance" :aria-label="$ts('components.featuredPosts.heading')">
    <div ref="track" class="home-featured-track" @scroll.passive="updateActivePost">
      <article
        v-for="(post, index) in posts"
        :key="post.slug"
        class="home-featured-card"
        :class="{ 'is-active': index === activeIndex }"
      >
        <NuxtLink :to="post.to">
          <div class="home-featured-image">
            <img v-if="post.image.startsWith('/images/')" :src="post.image" :alt="post.title" loading="lazy" decoding="async">
            <PostImage v-else :src="post.image" :alt="post.title" loading="lazy" />
          </div>
          <div class="home-featured-content">
            <h3>{{ post.title }}</h3>
            <p>{{ post.description }}</p>
            <span class="home-featured-meta">{{ post.date }}<template v-if="post.author"> — {{ post.author }}</template></span>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div class="home-featured-controls">
      <div v-if="posts.length > 1" role="group" class="home-featured-control-group" :aria-label="$ts('components.featuredPosts.heading')">
        <button type="button" :aria-label="$ts('common.previous')" @click="scroll('left')">
          <span class="i-ph-caret-left" aria-hidden="true" />
        </button>
        <button type="button" :aria-label="$ts('common.next')" @click="scroll('right')">
          <span class="i-ph-caret-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import type { Post } from '~~/shared/types/post'
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'

const { $ts, $getLocale } = useI18n()
const { enhancePost } = usePost()
const section = ref<HTMLElement>()
const track = ref<HTMLElement>()
const activeIndex = ref(0)

const { data } = await useFetch<Post[]>('/api/posts', {
  query: { limit: 50, language: $getLocale(), exclude: ['top pinned', 'featured project', 'project'].join(',') },
})

const posts = computed(() => {
  const published = (data.value ?? []).map(post => enhancePost(post))
  if (published.length) {
    const featured = published.filter(post => post.tags?.some(tag => tag.name.toLocaleLowerCase() === 'featured post'))
    const remaining = published.filter(post => !featured.includes(post))

    return [...featured, ...remaining].slice(0, 3).map(post => ({
      slug: post.slug,
      to: localizedPath(`/posts/${post.slug}`, $getLocale()),
      title: post.name,
      description: post.description,
      image: post.image?.src || '/images/corpinot-cover.jpeg',
      date: post.formattedDate,
      author: post.user?.name,
    }))
  }

  const locale = $getLocale() === 'fr' ? 'fr' : 'en'
  return PRESENTATION_POSTS.filter(post => !post.isProject).slice(0, 3).map(post => ({
    slug: post.slug,
    to: localizedPath(`/preview/${post.slug}`, $getLocale()),
    title: post.title[locale],
    description: post.description[locale],
    image: post.image,
    date: new Date(post.publishedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    author: $ts('nav.brand'),
  }))
})

function scroll(direction: 'left' | 'right') {
  const container = track.value
  const firstCard = container?.firstElementChild as HTMLElement | null
  if (!container || !firstCard) return

  const nextIndex = Math.max(0, Math.min(activeIndex.value + (direction === 'right' ? 1 : -1), container.children.length - 1))
  const targetCard = container.children[nextIndex] as HTMLElement | undefined
  if (!targetCard) return

  container.scrollTo({ left: targetCard.offsetLeft - firstCard.offsetLeft, behavior: 'smooth' })
}

function handleKeyboardNavigation(event: KeyboardEvent) {
  const isArrowKey = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
  const isOpenKey = event.key === 'Enter' || event.key.toLowerCase() === 'o'
  if (!isArrowKey && !isOpenKey) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (isArrowKey && posts.value.length < 2) return

  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || target.closest('[role="dialog"], [role="menu"]'))) return
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return

  const carousel = section.value
  if (!carousel) return

  if (isOpenKey && target instanceof HTMLElement) {
    const interactiveTarget = target.closest('a, button, [role="button"]')
    if (interactiveTarget && !carousel.contains(interactiveTarget)) return
  }

  const bounds = carousel.getBoundingClientRect()
  const isVisible = bounds.top < window.innerHeight && bounds.bottom > 0
  if (!isVisible) return

  event.preventDefault()

  if (isOpenKey) {
    const activePost = posts.value[activeIndex.value]
    if (activePost) void navigateTo(activePost.to)
    return
  }

  const isPartiallyVisible = bounds.top < 0 || bounds.bottom > window.innerHeight
  if (isPartiallyVisible) {
    carousel.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }

  if (event.key === 'ArrowLeft') {
    scroll('left')
    return
  }

  scroll('right')
}

function updateActivePost() {
  const container = track.value
  if (!container) return

  const center = container.getBoundingClientRect().left + container.clientWidth / 2
  let closestIndex = activeIndex.value
  let closestDistance = Number.POSITIVE_INFINITY

  Array.from(container.children).forEach((card, index) => {
    const rect = card.getBoundingClientRect()
    const distance = Math.abs(rect.left + rect.width / 2 - center)
    if (distance < closestDistance) {
      closestIndex = index
      closestDistance = distance
    }
  })

  activeIndex.value = closestIndex
}

if (import.meta.client) {
  useEventListener(window, 'keydown', handleKeyboardNavigation)
}
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .home-featured-posts > div {
  width: min(700px, calc(100% - 32px));
  max-width: 700px;
  margin-inline: auto;
  padding-inline: 0;
}
.site-shell .home-featured-posts { overflow: hidden; padding: 52px 0 15px; background: var(--site-color-background); color: var(--site-color-text); }
.site-shell .home-featured-posts > div { overflow: visible; }
.site-shell .home-featured-posts > div > h2 {
  margin: 0 0 20px;
  color: var(--site-color-text);
  font-family: var(--site-font-body);
  font-size: 16px;
  font-weight: 550;
  letter-spacing: 0;
  text-transform: none;
}
.site-shell .home-featured-track {
  display: flex;
  width: 100%;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.site-shell .home-featured-posts > .home-featured-track {
  width: 100vw;
  max-width: 100vw;
  box-sizing: border-box;
  margin: 0;
  overflow-x: auto;
  padding: 0 max(16px, calc(50vw - 350px)) 8px;
}
.site-shell .home-featured-track::-webkit-scrollbar { display: none; }
.site-shell .home-featured-card { flex: 0 0 min(700px, calc(100vw - 32px)); scroll-snap-align: center; transform: scale(.9); transform-origin: center; transition: transform 300ms ease; }
.site-shell .home-featured-card.is-active { transform: scale(1); }
.site-shell .home-featured-card > a { display: block; color: inherit; text-decoration: none; }
.site-shell .home-featured-card .home-featured-image { width: calc(100% + 20px); aspect-ratio: 16 / 9; margin-left: -10px; overflow: hidden; border-radius: 24px; background: #2b2b30; }
.site-shell .home-featured-card .home-featured-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 250ms ease; }
.site-shell .home-featured-card > a:hover .home-featured-image img { transform: scale(1.025); }
.site-shell .home-featured-content { margin-top: 30px; }
.site-shell .home-featured-card h3 { margin: 0; color: var(--site-color-heading); font-size: 18px; font-weight: 550; line-height: 1.4; }
.site-shell .home-featured-card p { display: -webkit-box; max-width: 500px; margin: 12px 0 8px; overflow: hidden; color: var(--site-color-text); font-size: 16px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.site-shell .home-featured-card .home-featured-meta { display: block; color: var(--site-color-muted); font-size: 13px; }
.site-shell .home-featured-controls { display: flex; justify-content: flex-start; width: min(700px, calc(100% - 32px)); margin: 30px auto 0; overflow: visible; }
.site-shell .home-featured-control-group {
  display: flex;
  width: 86px;
  height: 44px;
  align-items: center;
  justify-content: space-between;
  padding-inline: 4px;
  border: 1px solid var(--site-color-border);
  border-radius: 999px;
}
.site-shell .home-featured-controls button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--site-color-heading);
}
.site-shell .home-featured-controls button span { width: 16px; height: 16px; }
@media (max-width: 1023px) {
  .site-shell .home-featured-card { flex-basis: min(88vw, 620px); }
  .site-shell .home-featured-card .home-featured-image { width: 100%; margin-left: 0; }
}
@media (max-width: 1023px) {
  .site-shell .home-featured-card:not(:first-child) { flex-basis: min(88vw, 620px); margin: 0; }
}
@media (max-width: 1023px) {
  .site-shell .home-featured-track { gap: 20px; padding-left: 16px; scroll-padding-left: 16px; }
}
@media (max-width: 600px) {
  .site-shell .home-featured-card .home-featured-image { border-radius: 16px; }
}
@media (max-width: 600px) {
  .site-shell .home-featured-posts { padding-bottom: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .home-featured-card .home-featured-image img { transition: none; }
}
}
</style>

<style>
/* Keep the hover-state override above UnoCSS's unlayered button defaults. */
.site-shell .home-featured-controls button {
  position: relative;
  isolation: isolate;
  transition: transform 100ms ease-out;
}
.site-shell .home-featured-controls button:active { transform: scale(.95); }
.site-shell .home-featured-controls button::before {
  position: absolute;
  z-index: 0;
  inset: 1px;
  display: block;
  border-radius: inherit;
  background-color: color-mix(in srgb, var(--site-color-text) 8%, transparent);
  content: "";
  opacity: 0;
  pointer-events: none;
  transform: scale(.9);
  transition: opacity 120ms ease-out, transform 140ms ease-out;
}
.site-shell .home-featured-controls button:hover::before,
.site-shell .home-featured-controls button:focus-visible::before {
  animation: carousel-control-fill-pop 320ms ease-out both;
}
.site-shell .home-featured-controls button span { position: relative; z-index: 1; }
@keyframes carousel-control-fill-pop {
  0% { opacity: .7; transform: scale(.9); }
  72% { opacity: 1; transform: scale(1.08); }
  88% { opacity: 1; transform: scale(.99); }
  100% { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .home-featured-controls button { transition: none; }
  .site-shell .home-featured-controls button::before { transition: none; }
  .site-shell .home-featured-controls button:hover::before,
  .site-shell .home-featured-controls button:focus-visible::before { animation: none; }
  .site-shell .home-featured-controls button:hover::before,
  .site-shell .home-featured-controls button:focus-visible::before { opacity: 1; transform: scale(1); }
}
</style>
