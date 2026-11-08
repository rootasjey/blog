<template>
  <main class="site-page site-tags-directory" :class="{ 'is-admin': isAdmin }">
    <div class="site-tags-directory-content">
      <CollectionIntro
        :title="$t('pages.tags.heading')"
        :description="$t('pages.tags.description')"
      />

      <div v-if="isAdmin" class="site-tags-directory-tools">
        <div class="site-tags-directory-search">
          <NIcon name="i-ph-magnifying-glass" class="site-tags-directory-search-icon" aria-hidden="true" />
          <input
            ref="searchInput"
            v-model="search"
            type="search"
            :placeholder="$t('pages.tags.searchPlaceholder')"
            :aria-label="$t('pages.tags.searchPlaceholder')"
          />
        </div>
      </div>

      <section class="site-tags-directory-list" :aria-label="$t('common.tags')">
        <h2 class="site-tags-directory-visually-hidden">{{ $t('common.tags') }}</h2>
        <p v-if="!filteredTags.length" class="site-tags-directory-empty">
          {{ isAdmin && search.trim() ? $t('pages.tags.noTagsFound') : $t('pages.tags.noTopics') }}
        </p>

        <ul>
          <li v-if="isAdmin" class="site-tags-directory-row">
            <button
              type="button"
              class="site-tags-directory-tag site-tags-directory-create"
              @click="emit('create')"
            >
              <span class="site-tags-directory-icon site-tags-directory-create-icon" aria-hidden="true">
                <NIcon name="i-ph-plus" />
              </span>
              <span class="site-tags-directory-name">{{ $t('pages.tags.newTag') }}</span>
            </button>
          </li>
          <li v-for="tag in filteredTags" :key="tag.id" class="site-tags-directory-row">
            <NuxtLink
              class="site-tags-directory-tag site-tags-directory-tag-link"
              :to="tagHref(tag)"
              :style="{ '--tag-accent': postTagColor(tag.name) }"
            >
              <span class="site-tags-directory-icon" aria-hidden="true">
                <NIcon v-if="tag.icon" :name="tag.icon" />
                <span v-else>{{ tagInitial(tag.name) }}</span>
              </span>
              <span class="site-tags-directory-name">{{ tag.name }}</span>
              <span class="site-tags-directory-count">x{{ tag.count }}</span>
            </NuxtLink>

            <NDropdownMenu v-if="isAdmin" :items="menuItems(tag)">
              <template #default>
                <NButton
                  btn="ghost-gray"
                  size="xs"
                  icon
                  :aria-label="$t('pages.tags.tagActions', { name: tag.name })"
                  class="site-tags-directory-menu"
                >
                  <NIcon name="i-ph-dots-three-vertical" />
                </NButton>
              </template>
            </NDropdownMenu>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { ApiTag } from '~~/shared/types/tags'
import { localizedPath } from '~/utils/presentationPosts'
import { postTagColor } from '~/utils/postTagColor'

type DirectoryTag = ApiTag & { count: number }

const props = defineProps<{
  tags: DirectoryTag[]
  isAdmin: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [tag: DirectoryTag]
  delete: [tag: DirectoryTag]
}>()

const { $t, $getLocale } = useI18n()
const search = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const locale = computed(() => $getLocale())

const filteredTags = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()

  return props.tags
    .filter(tag => !query || [tag.name, tag.category ?? '', tag.description ?? ''].join(' ').toLocaleLowerCase().includes(query))
    .slice()
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, locale.value, { sensitivity: 'base' }))
})

function handleTypeToSearch(event: KeyboardEvent) {
  if (!props.isAdmin || event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key.length !== 1 || !event.key.trim()) return

  const target = event.target instanceof HTMLElement ? event.target : null
  const interactiveTarget = target?.closest(
    'input, textarea, select, button, a[href], [contenteditable="true"], [role="button"], [role="combobox"], [role="dialog"], [role="menu"], [role="menuitem"], [role="option"]',
  )
  if (target?.isContentEditable || interactiveTarget) return

  event.preventDefault()
  search.value = event.key
  nextTick(() => {
    const input = searchInput.value
    input?.focus()
    input?.setSelectionRange(input.value.length, input.value.length)
  })
}

onMounted(() => window.addEventListener('keydown', handleTypeToSearch))
onBeforeUnmount(() => window.removeEventListener('keydown', handleTypeToSearch))

function tagHref(tag: DirectoryTag) {
  return localizedPath('/posts', locale.value) + '?tag=' + encodeURIComponent(tag.name)
}

function tagInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() || '#'
}

function menuItems(tag: DirectoryTag) {
  return [
    { label: $t('common.edit'), onSelect: () => emit('edit', tag), leading: 'i-ph-pencil' },
    { label: $t('common.delete'), onSelect: () => emit('delete', tag), leading: 'i-ph-trash', color: 'danger' },
  ]
}
</script>

<style>
@layer components {
  .site-shell .site-tags-directory { padding: 68px 0 64px; }
  .site-shell .site-tags-directory-content { width: min(700px, calc(100vw - 32px)); margin-inline: auto; }
  .site-shell .site-tags-directory-content > .site-collection-intro { margin-bottom: 80px; }
  .site-shell .site-tags-directory.is-admin .site-tags-directory-content > .site-collection-intro { margin-bottom: 36px; }
  .site-shell .site-tags-directory-tools {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
  }
  .site-shell .site-tags-directory-tools input {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 6px 10px 6px 34px;
    border: 1px solid color-mix(in srgb, var(--site-color-text) 13%, transparent);
    border-radius: var(--site-radius-control);
    outline: none;
    background: transparent;
    color: var(--site-color-text);
    font: inherit;
    font-size: 14px;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .site-shell .site-tags-directory-tools input::placeholder { color: var(--site-color-muted); }
  .site-shell .site-tags-directory-tools input:focus-visible { border-color: var(--site-color-border); background: var(--site-color-hover-background); }
  .site-shell .site-tags-directory-search { position: relative; display: flex; width: min(280px, 100%); min-width: 0; align-items: center; }
  .site-shell .site-tags-directory-search-icon { position: absolute; left: 10px; color: var(--site-color-muted); pointer-events: none; }
  .site-shell .site-tags-directory-create { width: 100%; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; font: inherit; }
  .site-shell .site-tags-directory-create-icon { --tag-accent: var(--site-color-muted); }
  .site-shell .site-tags-directory-create:hover .site-tags-directory-icon,
  .site-shell .site-tags-directory-create:focus-visible .site-tags-directory-icon { border-color: var(--site-color-border); background: var(--site-color-hover-background); transform: scale(1.05); }
  .site-shell .site-tags-directory-create:hover .site-tags-directory-name,
  .site-shell .site-tags-directory-create:focus-visible .site-tags-directory-name { color: var(--site-color-heading); font-weight: 600; transform: translateX(2px); }
  .site-shell .site-tags-directory-list {
    width: 100%;
    margin-left: 0;
  }
  .site-shell .site-tags-directory-list ul {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .site-shell .site-tags-directory-row {
    position: relative;
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
  }
  .site-shell .site-tags-directory-tag {
    display: flex;
    min-width: 0;
    min-height: 44px;
    flex: 1;
    align-items: center;
    gap: 12px;
    color: var(--site-color-heading);
    text-decoration: none;
  }
  .site-shell .site-tags-directory.is-admin .site-tags-directory-tag-link { padding-inline-end: 48px; }
  .site-shell .site-tags-directory-icon {
    display: grid;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    place-items: center;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--tag-accent) 30%, transparent);
    border-radius: var(--site-radius-control);
    background: color-mix(in srgb, var(--tag-accent) 5%, transparent);
    color: var(--tag-accent);
    font-size: 15px;
    font-weight: 550;
    transform: scale(1);
    transition: background-color 200ms ease, border-color 200ms ease, transform 220ms var(--site-ease-standard);
  }
  .site-shell .site-tags-directory-name {
    min-width: 0;
    color: var(--site-color-heading);
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    transition: transform 180ms ease-out, font-weight 200ms ease;
  }
  .site-shell .site-tags-directory-count {
    flex: 0 0 auto;
    margin-left: -8px;
    color: var(--site-color-muted);
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    font-variant-numeric: tabular-nums;
  }
  .site-shell .site-tags-directory-tag:hover,
  .site-shell .site-tags-directory-tag:focus-visible { color: var(--site-color-heading); }
  .site-shell .site-tags-directory-tag:hover .site-tags-directory-icon,
  .site-shell .site-tags-directory-tag:focus-visible .site-tags-directory-icon {
    border-color: transparent;
    background: color-mix(in srgb, var(--tag-accent) 6%, transparent);
    transform: scale(1.05);
  }
  .site-shell .site-tags-directory-tag:hover .site-tags-directory-name,
  .site-shell .site-tags-directory-tag:focus-visible .site-tags-directory-name {
    font-weight: 600;
    transform: translateX(2px);
  }
  .site-shell .site-tags-directory-menu {
    position: absolute;
    top: 50%;
    right: 4px;
    display: grid;
    width: 44px;
    min-height: 44px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: var(--site-radius-icon);
    background: var(--site-color-background);
    color: var(--site-color-muted);
    opacity: 0;
    transform: translateY(-50%);
    transition: opacity 150ms ease, background-color 150ms ease, color 150ms ease;
  }
  .site-shell .site-tags-directory-row:hover .site-tags-directory-menu,
  .site-shell .site-tags-directory-row:focus-within .site-tags-directory-menu,
  .site-shell .site-tags-directory-menu:focus-visible { opacity: 1; }
  .site-shell .site-tags-directory-menu:hover,
  .site-shell .site-tags-directory-menu:focus-visible { background: var(--site-color-hover-background); color: var(--site-color-heading); }
  .site-shell .site-tags-directory-empty { margin: 0; color: var(--site-color-muted); }
  .site-shell .site-tags-directory-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }
  .site-shell .site-tags-directory-tag:focus-visible,
  .site-shell .site-tags-directory-menu:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
  @media (max-width: 767px) {
    .site-shell .site-tags-directory { padding-block: 36px 52px; }
    .site-shell .site-tags-directory-content > .site-collection-intro { margin-bottom: 44px; }
    .site-shell .site-tags-directory.is-admin .site-tags-directory-content > .site-collection-intro { margin-bottom: 20px; }
    .site-shell .site-tags-directory-search { width: 100%; }
    .site-shell .site-tags-directory-list { width: 100%; margin-left: 0; }
    .site-shell .site-tags-directory-menu { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .site-shell .site-tags-directory-tools input,
    .site-shell .site-tags-directory-create,
    .site-shell .site-tags-directory-icon,
    .site-shell .site-tags-directory-name,
    .site-shell .site-tags-directory-menu { transition: none; transform: none; }
  }
}
</style>
