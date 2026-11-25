<template>
  <div class="space-y-4">
    <div v-if="!draft.length" class="text-sm text-gray-500 dark:text-gray-400">{{ $ts('components.socialsEditor.noSocials') }}</div>

    <div v-for="(s, i) in draft" :key="i" class="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
      <div class="flex items-center gap-3">
        <NIcon :name="platformIcon(s.platform)" />
        <NInput v-model="s.platform" :placeholder="$ts('components.socialsEditor.platformPlaceholder')" input="~" class="social-input w-42 focus:ring-0 border b-dashed focus:border-solid focus:shadow-sm transition-property-shadow" />
        <NInput v-model="s.url" :placeholder="$ts('components.socialsEditor.urlPlaceholder')" input="~" class="social-input flex-1 focus:ring-0 border b-dashed focus:border-solid focus:shadow-sm transition-property-shadow" />
        <NTooltip :content="$ts('components.socialsEditor.removeLink')">
          <NButton @click="removeRow(i)" btn="soft-gray" size="sm" icon label="i-ph-trash" />
        </NTooltip>
      </div>
      <div class="ml-8 flex gap-3 items-center">
        <NInput v-model="s.label" :placeholder="$ts('components.socialsEditor.labelPlaceholder')" input="~" class="social-input w-42 focus:ring-0 border b-dashed focus:border-solid focus:shadow-sm transition-property-shadow" />
        <NInput v-model.number="s.order" type="number" :placeholder="$ts('components.socialsEditor.orderPlaceholder')" input="~" class="social-input focus:ring-0 border b-dashed focus:border-solid focus:shadow-sm transition-property-shadow" />
        <div class="flex items-center gap-2">
          <NSwitch switch-checked="blue" v-model="s.enabled" />
          <span class="text-xs font-body uppercase font-700 text-gray-700 dark:text-gray-300">{{ s.enabled ? $ts('components.socialsEditor.enabled') : $ts('components.socialsEditor.disabled') }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <NButton @click="addRow" btn="soft" size="xs" class="px-6 font-600" :label="$ts('components.socialsEditor.addSocialLink')" leading="i-ph-plus-bold" />
      <div class="ml-auto flex items-center gap-2">
        <NButton v-if="isDirty" @click="emitCancel" btn="ghost-gray" size="xs" :disabled="saving" class="font-600">{{ $ts('common.cancel') }}</NButton>
        <NButton v-if="isDirty" @click="emitSave" :disabled="saving" btn="soft-pink" size="xs">
          <NIcon :name="saving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': saving }" />
          <span class="ml-2 font-600">{{ $ts('common.save') }}</span>
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

export type SocialLink = {
  platform: string
  url: string
  label?: string
  order?: number | null
  enabled?: boolean | null
}

const { $ts } = useI18n()
const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: Array as () => SocialLink[], default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save', 'cancel'])

const cloneSocials = (socials: SocialLink[]) => socials.map(social => ({ ...social }))
const draft = ref<SocialLink[]>(cloneSocials(props.modelValue))
const savedDraft = ref<SocialLink[]>(cloneSocials(props.modelValue))

watch(() => props.modelValue, (v) => {
  draft.value = cloneSocials(v)
  savedDraft.value = cloneSocials(v)
}, { deep: true })

const sanitizeSocials = (socials: SocialLink[]) => socials
  .map((social, index) => ({
    platform: social.platform?.trim() || '',
    url: social.url?.trim() || '',
    label: social.label?.trim() || undefined,
    order: social.order ?? index,
    enabled: social.enabled !== false,
  }))
  .filter(social => social.platform || social.url)

const sanitized = computed(() => sanitizeSocials(draft.value))
const isDirty = computed(() => JSON.stringify(sanitized.value) !== JSON.stringify(sanitizeSocials(savedDraft.value)))

function onKeydown(event: KeyboardEvent) {
  if (!props.open || event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey) || event.altKey || event.shiftKey || event.isComposing) return
  event.preventDefault()
  if (isDirty.value && !props.saving) emitSave()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function addRow() {
  draft.value.push({ platform: '', url: '', enabled: true, order: draft.value.length })
  nextTick(() => {
    // focus last input if needed (minimal; skip querying DOM to keep simple)
  })
}

function removeRow(i: number) {
  draft.value.splice(i, 1)
}

function platformIcon(platform?: string) {
  if (!platform) return 'i-lucide-link'
  let p = platform.toLowerCase().trim()
  if (p.startsWith('http')) {
    try { p = new URL(p).hostname.replace(/^www\./, '') } catch {}
  }
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'i-lucide-twitter'
  if (p.includes('github')) return 'i-lucide-github'
  if (p.includes('linkedin')) return 'i-lucide-linkedin'
  if (p.includes('instagram')) return 'i-lucide-instagram'
  if (p.includes('facebook')) return 'i-lucide-facebook'
  if (p.includes('tiktok')) return 'i-lucide-music'
  if (p.includes('youtube') || p.includes('youtu.be')) return 'i-lucide-youtube'
  if (p.includes('website') || p.includes('site') || p.includes('blog') || p.includes('homepage')) return 'i-lucide-globe'
  return 'i-lucide-link'
}

function emitSave() {
  if (!isDirty.value || props.saving) return
  emit('save', sanitized.value)
}

function emitCancel() {
  emit('cancel')
}
</script>

<style scoped>
@layer components {

:deep(.social-input) {
  &::selection {
    background-color: black;
  }
}
}
</style>
