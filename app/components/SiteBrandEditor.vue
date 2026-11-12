<template>
  <NDialog v-model:open="dialogOpen">
    <NDialogContent class="site-brand-editor">
      <NDialogHeader>
        <NDialogTitle>{{ labels.title }}</NDialogTitle>
      </NDialogHeader>

      <form class="site-brand-editor__form" @submit.prevent="submit">
        <label class="site-brand-editor__field">
          <span>{{ labels.field }}</span>
          <input v-model="draft" maxlength="80" required autofocus>
        </label>
        <p v-if="error" class="site-brand-editor__error" role="alert">{{ error }}</p>

        <NDialogFooter class="site-brand-editor__footer">
          <NButton btn="ghost-gray" size="sm" type="button" :disabled="saving" @click="dialogOpen = false">
            {{ labels.cancel }}
          </NButton>
          <NButton btn="solid-black" size="sm" type="submit" :loading="saving" :disabled="!draft.trim() || saving">
            {{ labels.save }}
          </NButton>
        </NDialogFooter>
      </form>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; brandName: string; saving: boolean; error: string }>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  save: [brandName: string]
}>()

const { $getLocale } = useI18n()
const dialogOpen = computed({
  get: () => props.open,
  set: (open: boolean) => emit('update:open', open),
})
const draft = ref(props.brandName)
const labels = computed(() => $getLocale() === 'fr'
  ? { title: 'Modifier le nom du site', field: 'Nom du site', cancel: 'Annuler', save: 'Enregistrer' }
  : { title: 'Edit site title', field: 'Site title', cancel: 'Cancel', save: 'Save' })

watch(() => props.open, (isOpen) => {
  if (isOpen) draft.value = props.brandName
})

function submit() {
  const brandName = draft.value.trim()
  if (!brandName || props.saving) return
  emit('save', brandName)
}
</script>

<style scoped>
@layer components {
.site-brand-editor { width: min(28rem, calc(100vw - 2rem)); }
.site-brand-editor__form { display: grid; gap: 1rem; }
.site-brand-editor__field { display: grid; gap: 0.5rem; color: var(--site-color-text); font-size: 0.875rem; }
.site-brand-editor__field input { min-width: 0; padding: 0.75rem; border: 1px solid var(--site-color-border); border-radius: var(--site-radius-control); background: var(--site-color-background); color: var(--site-color-text); font: inherit; }
.site-brand-editor__field input:focus-visible { outline: 2px solid var(--site-color-focus-ring); outline-offset: 2px; }
.site-brand-editor__error { margin: 0; color: var(--site-color-danger); font-size: 0.875rem; }
.site-brand-editor__footer { gap: 0.5rem; }
}
</style>
