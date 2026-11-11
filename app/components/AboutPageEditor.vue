<template>
  <NButton v-if="isAdmin" btn="outline-gray" size="xs" leading="i-ph-pencil-simple" class="about-page-edit-trigger" aria-haspopup="dialog" :aria-expanded="open" @click="openEditor">
    {{ labels.edit }}
  </NButton>

  <Teleport to="body">
    <section v-if="open" class="about-page-editor" role="dialog" aria-modal="false" aria-labelledby="about-page-editor-title" :style="positionStyle">
      <header class="about-page-editor__header">
        <h2 id="about-page-editor-title">{{ labels.title }}</h2>
        <NButton btn="ghost-gray" size="xs" icon label="i-lucide-x" :aria-label="labels.close" @click="close" />
      </header>

      <div class="about-page-editor__body">
        <div class="about-page-editor__tabs" role="group" :aria-label="labels.languages">
          <button v-for="language in languages" :key="language.code" type="button" :aria-pressed="activeLanguage === language.code" @click="activeLanguage = language.code">{{ language.label }}</button>
        </div>

        <label><span>{{ labels.heading }}</span><input v-model="draft[activeLanguage].heading" maxlength="120"></label>
        <label><span>{{ labels.mainTitle }}</span><textarea v-model="draft[activeLanguage].mainTitle" rows="2" maxlength="500" /></label>
        <label><span>{{ labels.intro }}</span><textarea v-model="draft[activeLanguage].intro" rows="4" maxlength="4000" /></label>
        <label><span>{{ labels.description }}</span><textarea v-model="draft[activeLanguage].description" rows="4" maxlength="4000" /></label>
        <label><span>{{ labels.openSourceHeading }}</span><input v-model="draft[activeLanguage].openSourceHeading" maxlength="200"></label>
        <label><span>{{ labels.openSourceText }}</span><textarea v-model="draft[activeLanguage].openSourceText" rows="4" maxlength="4000" /></label>
        <label><span>{{ labels.faqHeading }}</span><input v-model="draft[activeLanguage].faqHeading" maxlength="120"></label>

        <div class="about-page-editor__list-heading">
          <h3>{{ labels.faq }}</h3>
          <NButton btn="outline-gray" size="xs" leading="i-ph-plus" :disabled="draft[activeLanguage].faq.length >= 20" @click="addFaq">{{ labels.addQuestion }}</NButton>
        </div>

        <fieldset v-for="(item, index) in draft[activeLanguage].faq" :key="item.id" class="about-page-editor__faq-item">
          <legend>{{ item.question[activeLanguage] || labels.untitled }}</legend>
          <div class="about-page-editor__item-actions">
            <NButton btn="ghost-gray" size="xs" icon label="i-ph-arrow-up" :aria-label="labels.moveUp" :disabled="index === 0" @click="moveFaq(index, -1)" />
            <NButton btn="ghost-gray" size="xs" icon label="i-ph-arrow-down" :aria-label="labels.moveDown" :disabled="index === draft[activeLanguage].faq.length - 1" @click="moveFaq(index, 1)" />
            <NButton btn="ghost-gray" size="xs" icon label="i-ph-trash" :aria-label="labels.removeQuestion" @click="removeFaq(index)" />
          </div>
          <label><span>{{ labels.question }}</span><input v-model="item.question[activeLanguage]" maxlength="1000"></label>
          <label><span>{{ labels.answer }}</span><textarea v-model="item.answer[activeLanguage]" rows="4" maxlength="1000" /></label>
        </fieldset>

        <label><span>{{ labels.contactHeading }}</span><input v-model="draft[activeLanguage].contactHeading" maxlength="200"></label>
        <label><span>{{ labels.contactText }}</span><textarea v-model="draft[activeLanguage].contactText" rows="3" maxlength="2000" /></label>
        <p v-if="error" class="about-page-editor__message about-page-editor__message--error" role="alert">{{ error }}</p>
        <p v-if="success" class="about-page-editor__message" role="status">{{ success }}</p>
      </div>

      <footer class="about-page-editor__footer">
        <NButton btn="ghost-gray" size="sm" :disabled="saving" @click="close">{{ labels.cancel }}</NButton>
        <NButton btn="solid-black" size="sm" :loading="saving" :disabled="saving" @click="save">{{ saving ? labels.saving : labels.save }}</NButton>
      </footer>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AboutPageContent, SupportedContentLocale } from '~~/shared/types/public-page-content'

const props = defineProps<{ content: AboutPageContent; isAdmin: boolean }>()
const emit = defineEmits<{ saved: [content: AboutPageContent] }>()
const { $getLocale } = useI18n()
const locale = computed(() => $getLocale())
const labels = computed(() => locale.value === 'fr' ? {
  edit: 'Modifier À propos', title: 'Modifier À propos', close: 'Fermer', languages: 'Langue du contenu',
  heading: 'Titre', mainTitle: 'Accroche', intro: 'Introduction', description: 'Description', openSourceHeading: 'Titre open source',
  openSourceText: 'Texte open source', faqHeading: 'Titre de la FAQ', faq: 'Questions fréquentes', addQuestion: 'Ajouter une question', untitled: 'Sans titre',
  question: 'Question', answer: 'Réponse', moveUp: 'Monter', moveDown: 'Descendre', removeQuestion: 'Supprimer la question',
  contactHeading: 'Titre du contact', contactText: 'Texte du contact', cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement…',
  saved: 'Modifications enregistrées', saveError: 'Enregistrement impossible',
} : {
  edit: 'Edit About page', title: 'Edit About page', close: 'Close', languages: 'Content language',
  heading: 'Heading', mainTitle: 'Lead', intro: 'Introduction', description: 'Description', openSourceHeading: 'Open source heading',
  openSourceText: 'Open source text', faqHeading: 'FAQ heading', faq: 'Frequently asked questions', addQuestion: 'Add question', untitled: 'Untitled',
  question: 'Question', answer: 'Answer', moveUp: 'Move up', moveDown: 'Move down', removeQuestion: 'Remove question',
  contactHeading: 'Contact heading', contactText: 'Contact text', cancel: 'Cancel', save: 'Save', saving: 'Saving…',
  saved: 'Changes saved', saveError: 'Could not save changes',
})
const languages: { code: SupportedContentLocale; label: string }[] = [{ code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }]
const activeLanguage = ref<SupportedContentLocale>('fr')
const open = ref(false)
const draft = ref<AboutPageContent>(structuredClone(props.content))
const saving = ref(false)
const success = ref('')
const error = ref('')
const x = ref(0)
const y = ref(0)
const positionStyle = computed(() => ({ left: `${x.value}px`, top: `${y.value}px` }))

function openEditor() {
  draft.value = structuredClone(props.content)
  activeLanguage.value = locale.value === 'en' ? 'en' : 'fr'
  success.value = ''
  error.value = ''
  open.value = true
}

function close() {
  if (!saving.value) open.value = false
}

function addFaq() {
  const id = `faq-${Date.now().toString(36)}`
  draft.value.fr.faq.push({ id, question: { fr: '', en: '' }, answer: { fr: '', en: '' } })
  draft.value.en.faq.push({ id, question: { fr: '', en: '' }, answer: { fr: '', en: '' } })
}

function removeFaq(index: number) {
  draft.value.fr.faq.splice(index, 1)
  draft.value.en.faq.splice(index, 1)
}

function moveFaq(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= draft.value[activeLanguage.value].faq.length) return
  for (const language of languages) {
    const [item] = draft.value[language.code].faq.splice(index, 1)
    if (item) draft.value[language.code].faq.splice(target, 0, item)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

async function save() {
  saving.value = true
  success.value = ''
  error.value = ''
  try {
    await $fetch('/api/admin/site-settings', { method: 'PUT', body: { aboutPageContent: draft.value } })
    emit('saved', structuredClone(draft.value))
    success.value = labels.value.saved
  } catch {
    error.value = labels.value.saveError
  } finally {
    saving.value = false
  }
}

watch(open, (isOpen) => {
  if (!isOpen || !import.meta.client) return
  x.value = Math.max(16, window.innerWidth - 392)
  y.value = 88
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
@layer components {
.about-page-edit-trigger:focus-visible,
.about-page-editor :deep(button:focus-visible),
.about-page-editor input:focus-visible,
.about-page-editor textarea:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 3px; }
.about-page-editor {
  position: fixed;
  z-index: 100;
  display: flex;
  width: min(24rem, calc(100vw - 2rem));
  max-height: min(46rem, calc(100dvh - 7rem));
  flex-direction: column;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-card);
  background: var(--site-color-surface);
  color: var(--site-color-text);
}
.about-page-editor__header,
.about-page-editor__footer,
.about-page-editor__list-heading,
.about-page-editor__item-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--site-space-2); }
.about-page-editor__header,
.about-page-editor__footer { padding: var(--site-space-4); }
.about-page-editor__header { border-bottom: 1px solid var(--site-color-border); }
.about-page-editor__footer { border-top: 1px solid var(--site-color-border); }
.about-page-editor__header h2,
.about-page-editor__list-heading h3 { margin: 0; color: var(--site-color-heading); font-size: 1rem; font-weight: 550; }
.about-page-editor__body { display: grid; gap: var(--site-space-4); padding: var(--site-space-4); overflow-y: auto; }
.about-page-editor__body > label,
.about-page-editor__faq-item > label { display: grid; gap: var(--site-space-1); color: var(--site-color-text); font-size: 0.875rem; }
.about-page-editor input,
.about-page-editor textarea {
  width: 100%; box-sizing: border-box; padding: 0.625rem 0.75rem; border: 1px solid var(--site-color-border);
  border-radius: 0.625rem; background: var(--site-color-background); color: var(--site-color-text); font: inherit;
}
.about-page-editor textarea { resize: vertical; }
.about-page-editor__tabs { display: flex; gap: var(--site-space-2); }
.about-page-editor__tabs button {
  padding: 0.375rem 0.625rem; border: 1px solid var(--site-color-border); border-radius: 0.5rem;
  background: transparent; color: var(--site-color-text); cursor: pointer;
}
.about-page-editor__tabs button[aria-pressed="true"] { border-color: var(--site-color-heading); color: var(--site-color-heading); }
.about-page-editor__faq-item { display: grid; gap: var(--site-space-3); padding: var(--site-space-3); border: 1px solid var(--site-color-border); border-radius: 0.75rem; }
.about-page-editor__faq-item legend { padding-inline: 0.25rem; color: var(--site-color-heading); font-size: 0.875rem; }
.about-page-editor__item-actions { justify-content: flex-end; }
.about-page-editor__message { margin: 0; color: var(--site-color-heading); font-size: 0.875rem; }
.about-page-editor__message--error { color: var(--site-color-danger); }
}
</style>
