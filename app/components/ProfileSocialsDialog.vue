<template>
  <NDialog v-model:open="open" :closeOnEsc="true">
    <NDialogContent class="max-w-full sm:max-w-2xl">
      <NDialogHeader>
        <NDialogTitle>{{ $t('pages.profile.editSocialsTitle') }}</NDialogTitle>
      </NDialogHeader>

      <div class="p-6 space-y-4">
        <p v-if="!draft.length" class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('pages.profile.noSocials') }}
        </p>
        <div v-for="(social, index) in draft" :key="index" class="flex items-center gap-3">
          <NIcon :name="platformIcon(social.platform)" class="text-2xl text-gray-500" aria-hidden="true" />
          <NInput
            ref="platformInputs"
            v-model="social.platform"
            :placeholder="$t('pages.profile.socialPlatformPlaceholder')"
            :aria-label="$t('pages.profile.socialPlatformPlaceholder')"
            input="~"
            class="w-28 sm:w-40"
          />
          <NInput
            v-model="social.url"
            :placeholder="$t('pages.profile.socialUrlPlaceholder')"
            :aria-label="$t('pages.profile.socialUrlPlaceholder')"
            input="~"
            class="min-w-0 flex-1"
          />
          <NButton
            btn="ghost"
            size="xs"
            icon
            label="i-lucide-x"
            :aria-label="$t('common.remove')"
            @click="removeRow(index)"
          />
        </div>
      </div>

      <NDialogFooter class="flex items-center gap-2 justify-end p-0">
        <NButton btn="soft" size="xs" class="px-6" @click="addRow">
          {{ $t('common.add') }}
        </NButton>
        <div class="ml-auto flex items-center gap-2">
          <NButton btn="ghost-gray" size="xs" :disabled="saving" @click="open = false">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton btn="solid-black" size="xs" class="site-profile-save" :disabled="saving" @click="save">
            <NIcon :name="saving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': saving }" />
            <span class="ml-2">{{ $t('common.save') }}</span>
          </NButton>
        </div>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

type SocialLink = { platform: string; url: string }

const props = defineProps<{
  open: boolean
  modelValue: string | null
  saving: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  save: [socials: string]
}>()

const { $t } = useI18n()
const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
const draft = ref<SocialLink[]>([])
const platformInputs = ref<any[]>([])

watch(() => props.open, (isOpen) => {
  if (!isOpen) return

  try {
    const parsed = props.modelValue ? JSON.parse(props.modelValue) : []
    draft.value = Array.isArray(parsed)
      ? parsed.map((social: Partial<SocialLink>) => ({
          platform: social.platform || '',
          url: social.url || '',
        }))
      : []
  } catch {
    draft.value = []
  }
}, { immediate: true })

function addRow() {
  draft.value.push({ platform: '', url: '' })
  nextTick(() => {
    const lastInput = platformInputs.value.at(-1)
    const wrapper = lastInput?.$el ?? lastInput
    const input = wrapper?.querySelector?.('input') ?? wrapper
    input?.focus?.()
  })
}

function removeRow(index: number) {
  draft.value.splice(index, 1)
}

function platformIcon(platform?: string) {
  if (!platform) return 'i-lucide-link'
  let value = platform.toLowerCase().trim()
  if (value.startsWith('http')) {
    try {
      value = new URL(value).hostname.replace(/^www\./, '')
    } catch {}
  }
  if (value.includes('twitter') || value === 'x' || value.includes('x.com')) return 'i-lucide-twitter'
  if (value.includes('github')) return 'i-lucide-github'
  if (value.includes('linkedin')) return 'i-lucide-linkedin'
  if (value.includes('instagram')) return 'i-lucide-instagram'
  if (value.includes('facebook')) return 'i-lucide-facebook'
  if (value.includes('tiktok')) return 'i-lucide-music'
  if (value.includes('youtube') || value.includes('youtu.be')) return 'i-lucide-youtube'
  if (value.includes('website') || value.includes('site') || value.includes('blog') || value.includes('homepage')) return 'i-lucide-globe'
  return 'i-lucide-link'
}

function save() {
  const sanitized = draft.value
    .map(social => ({ platform: social.platform.trim(), url: social.url.trim() }))
    .filter(social => social.platform || social.url)

  emit('save', sanitized.length ? JSON.stringify(sanitized) : '')
}
</script>
