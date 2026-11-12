<template>
  <section v-if="authors.length" class="site-editor-authors" :aria-label="authorsLabel">
    <span class="site-editor-authors-label">{{ authorsLabel }}</span>
    <div class="site-editor-authors-list">
      <button
        v-for="author in authors"
        :key="author.id"
        type="button"
        class="site-editor-author-option"
        :class="{ 'is-selected': selectedIds.includes(author.id) }"
        :aria-pressed="selectedIds.includes(author.id)"
        :disabled="saving || author.id === ownerId"
        @click="toggleAuthor(author.id)"
      >
        <NuxtImg
          v-if="author.avatar"
          provider="hubblob"
          :src="author.avatar"
          :alt="''"
          width="24"
          height="24"
          loading="lazy"
        />
        <span v-else class="site-editor-author-initial" aria-hidden="true">{{ author.name.slice(0, 1).toUpperCase() }}</span>
        <span>{{ author.name }}</span>
        <NIcon v-if="selectedIds.includes(author.id)" name="i-ph-check" aria-hidden="true" />
      </button>
    </div>
    <span v-if="saving" class="site-editor-authors-status" role="status">{{ savingLabel }}</span>
    <span v-else-if="saveError" class="site-editor-authors-status" role="status">{{ saveError }}</span>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PostAuthor } from '~~/shared/types/post'

type AuthorOption = PostAuthor & { postCount?: number }

const props = defineProps<{
  postIdentifier: string
  ownerId: number
  modelValue: PostAuthor[]
}>()

const emit = defineEmits<{
  'update:modelValue': [authors: PostAuthor[]]
}>()

const { $getLocale } = useI18n()
const authors = ref<AuthorOption[]>([])
const selectedIds = ref<number[]>([])
const saving = ref(false)
const saveError = ref('')
const authorsLabel = computed(() => $getLocale() === 'fr' ? 'Auteurs' : 'Authors')
const savingLabel = computed(() => $getLocale() === 'fr' ? 'Enregistrement…' : 'Saving…')

watch(() => props.modelValue, (value) => {
  selectedIds.value = (value ?? []).map(author => author.id)
}, { immediate: true })

const loadAuthors = async () => {
  try {
    authors.value = await $fetch<AuthorOption[]>('/api/authors')
  } catch (error) {
    console.error('Unable to load authors for the post editor:', error)
  }
}

const toggleAuthor = async (authorId: number) => {
  if (saving.value || authorId === props.ownerId) return

  const nextIds = selectedIds.value.includes(authorId)
    ? selectedIds.value.filter(id => id !== authorId)
    : [...selectedIds.value, authorId]

  await saveAuthors(nextIds)
}

const saveAuthors = async (authorIds: number[]) => {
  saving.value = true
  saveError.value = ''

  try {
    const response = await $fetch<{ post: { authors: PostAuthor[] } }>(`/api/posts/${encodeURIComponent(props.postIdentifier)}`, {
      method: 'PUT',
      body: { authorIds },
    })
    selectedIds.value = response.post.authors.map(author => author.id)
    emit('update:modelValue', response.post.authors)
  } catch (error) {
    saveError.value = $getLocale() === 'fr' ? 'Échec de l’enregistrement' : 'Could not save authors'
    console.error('Unable to save post authors:', error)
  } finally {
    saving.value = false
  }
}

await loadAuthors()
</script>

<style scoped>
.site-editor-authors { display: flex; width: min(700px, calc(100% - 32px)); align-items: center; flex-wrap: wrap; gap: 10px; margin: 12px auto 32px; }
.site-editor-authors-label { color: var(--site-color-muted); font-size: 12px; font-weight: 600; }
.site-editor-authors-list { display: flex; flex-wrap: wrap; gap: 6px; }
.site-editor-author-option { display: inline-flex; min-height: 32px; align-items: center; gap: 6px; padding: 3px 8px 3px 3px; border: 1px solid var(--site-color-social-border); border-radius: 999px; background: transparent; color: var(--site-color-muted); cursor: pointer; font: inherit; font-size: 12px; transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease; }
.site-editor-author-option:hover:not(:disabled), .site-editor-author-option.is-selected { border-color: var(--site-color-border); background: var(--site-color-hover-background); color: var(--site-color-heading); }
.site-editor-author-option:disabled { cursor: default; }
.site-editor-author-option img, .site-editor-author-initial { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.site-editor-author-initial { display: grid; place-items: center; background: var(--site-color-hover-background); font-size: 11px; }
.site-editor-authors-status { color: var(--site-color-muted); font-size: 11px; }
@media (prefers-reduced-motion: reduce) { .site-editor-author-option { transition: none; } }
</style>
