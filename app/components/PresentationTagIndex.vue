<template>
  <section class="site-page site-demo-tag-index">
    <div class="site-demo-tag-content">
      <CollectionIntro :title="copy.title" :description="copy.description" />
      <nav :aria-label="copy.title">
        <NuxtLink
          v-for="item in tags"
          :key="item.name"
          :to="`${localizedPath('/posts', locale)}?tag=${encodeURIComponent(item.name)}`"
          :aria-label="`${item.name} x${item.count}`"
          :style="{ '--tag-accent': item.color }"
        >
          <span class="site-demo-tag-icon" aria-hidden="true">
            <svg v-if="item.icon === 'triangle'" viewBox="0 0 24 24"><path d="M10.71 5.49a1.5 1.5 0 0 1 2.58 0l8.09 14a1.5 1.5 0 0 1-1.29 2.25H3.91a1.5 1.5 0 0 1-1.29-2.25z" /></svg>
            <svg v-else-if="item.icon === 'heart'" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78" /></svg>
            <svg v-else-if="item.icon === 'crown'" viewBox="0 0 24 24"><path d="m2.5 7.1 5.2 4.1 4.3-7 4.3 7 5.2-4.1-2.2 12.4H4.7z" /></svg>
            <svg v-else-if="item.icon === 'bookmark'" viewBox="0 0 24 24"><path d="M6 3.75h12a1 1 0 0 1 1 1v16l-7-4.4-7 4.4v-16a1 1 0 0 1 1-1" /></svg>
            <span v-else>{{ item.name.slice(0, 1).toUpperCase() }}</span>
          </span>
          <span class="site-demo-tag-name">
            {{ item.name }}
            <span class="site-demo-tag-count">x{{ item.count }}</span>
          </span>
        </NuxtLink>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import { localizedPath, PRESENTATION_POSTS } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

type TagItem = { name: string; count: number }

const props = defineProps<{ tags?: TagItem[] }>()

const { $getLocale } = useI18n()
const locale = computed(() => $getLocale() === 'fr' ? 'fr' : 'en')
const tagIcons = ['triangle', 'heart', 'crown', 'bookmark'] as const
const copy = computed(() => locale.value === 'fr'
  ? {
      title: 'Thèmes & sujets',
      description: 'Un index des thèmes qui reviennent dans le journal, des systèmes d’interface et du langage visuel à la direction créative, aux processus et à l’avenir des expériences numériques.',
    }
  : {
      title: 'Topics & Threads',
      description: 'An index of recurring themes across the journal, from interface systems and visual language to creative direction, process, and the future of digital experiences.',
    })
const tags = computed(() => {
  if (props.tags) {
    return props.tags.map((item, index) => ({
      ...item,
      color: postTagColor(item.name),
      icon: tagIcons[index],
    }))
  }

  const posts = PRESENTATION_POSTS.filter(post => !post.isProject)
  return [...new Set(posts.map(post => post.tag[locale.value]))].map((name, index) => ({
    name,
    count: posts.filter(post => post.tag[locale.value] === name).length,
    color: postTagColor(name),
    icon: tagIcons[index],
  }))
})
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-demo-tag-index { padding: 68px 0 64px; }
.site-shell .site-demo-tag-content { width: min(700px, calc(100vw - 32px)); margin-inline: auto; }
.site-shell .site-demo-tag-content .site-collection-intro { margin-bottom: 82px; }
.site-shell .site-demo-tag-content nav { display: grid; width: 720px; max-width: calc(100vw - 32px); gap: 12px; margin-left: -10px; }
.site-shell .site-demo-tag-content nav a { display: flex; min-height: 44px; box-sizing: border-box; align-items: center; gap: 12px; padding: 0; border: 0; border-radius: 12px; color: var(--site-color-heading); font-size: 16px; line-height: 20px; text-decoration: none; transition: background-color .2s ease; }
.site-shell .site-demo-tag-icon { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--tag-accent) 30%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--tag-accent) 5%, transparent); color: var(--tag-accent); font-size: 15px; font-weight: 500; transform: scale(1); transition: background-color .2s ease, border-color .2s ease, transform 220ms var(--site-ease-standard); }
.site-shell .site-demo-tag-icon svg { width: 16px; height: 16px; fill: currentColor; }
.site-shell .site-demo-tag-content nav a .site-demo-tag-name { min-width: 0; color: var(--site-color-heading); font-weight: 500; transition: transform .18s ease-out, font-weight .2s ease; }
.site-shell .site-demo-tag-content nav a .site-demo-tag-count { margin-left: 4px; color: var(--site-color-muted); font-size: 12px; }
.site-shell .site-demo-tag-content nav a:hover,
.site-shell .site-demo-tag-content nav a:focus-visible { background: transparent; color: var(--site-color-heading); }
.site-shell .site-demo-tag-content nav a:hover .site-demo-tag-icon,
.site-shell .site-demo-tag-content nav a:focus-visible .site-demo-tag-icon { background: color-mix(in srgb, var(--tag-accent) 6%, transparent); border-color: transparent; transform: scale(1.05); }
.site-shell .site-demo-tag-content nav a:hover .site-demo-tag-name,
.site-shell .site-demo-tag-content nav a:focus-visible .site-demo-tag-name { font-weight: 600; transform: translateX(2px); }
.site-shell .site-demo-tag-content nav a:focus-visible { outline: 2px solid var(--tag-accent); outline-offset: 2px; }
@media (max-width: 1023px) {
  .site-shell .site-demo-tag-index { padding-top: 40px; }
}
@media (max-width: 1023px) {
  .site-shell .site-demo-tag-content .site-collection-intro { margin-bottom: 44px; }
}
@media (max-width: 1023px) {
  .site-shell .site-demo-tag-content nav { width: 100%; max-width: 100%; margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-demo-tag-content nav a .site-demo-tag-icon,
.site-shell .site-demo-tag-content nav a .site-demo-tag-name { transition: none; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-demo-tag-content nav a:hover .site-demo-tag-icon,
.site-shell .site-demo-tag-content nav a:focus-visible .site-demo-tag-icon { transform: none; }
}
}
</style>
