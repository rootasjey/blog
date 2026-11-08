<template>
  <section class="site-page site-profile min-h-screen">
    <!-- Sticky toolbar -->
    <div class="sticky top-0 z-30 site-profile-toolbar">
      <div class="container mx-auto px-4 md:px-8 py-3 sm:py-4">
        <div class="flex items-center justify-between gap-3">
          <!-- Mobile: compact layout with title in center -->
          <NButton link :to="localizedPath('/', $getLocale())" btn="ghost-gray" size="sm" icon label="i-lucide-arrow-left" class="md:hidden" />
          <NButton link :to="localizedPath('/', $getLocale())" btn="ghost-gray" size="sm" class="hidden md:flex">
            <NIcon name="i-lucide-arrow-left" />
            <span class="ml-2">{{ $t('common.back') }}</span>
          </NButton>
          
          <div class="flex-1 text-center">
            <div class="text-base font-semibold text-gray-900 dark:text-gray-100 lowercase">{{ $t('pages.profile.heading') }}</div>
          </div>
          
          <div class="flex items-center gap-2">
            <NButton
              v-if="hasChanges"
              @click="resetForm"
              btn="ghost-gray"
              size="sm"
              class="hidden md:flex"
              :disabled="isSaving"
            >{{ $t('pages.profile.resetChanges') }}</NButton>
            <NButton 
              :disabled="!hasChanges || isSaving" 
              @click="onSubmit" 
              btn="solid-black"
              class="site-profile-save hidden md:flex"
              size="sm"
            >
              <NIcon :name="isSaving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': isSaving }" />
              <span class="ml-2">{{ isSaving ? $t('common.saving') : $t('common.save') }}</span>
            </NButton>
          </div>
        </div>
        
        <!-- Status messages below toolbar on mobile -->
        <div v-if="successMessage || errorMessage" class="mt-3 md:mt-0 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
          <div v-if="successMessage" class="text-xs sm:text-sm text-center text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
            {{ successMessage }}
          </div>
          <div v-else-if="errorMessage" class="text-xs sm:text-sm text-center text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="container mx-auto px-4 sm:px-6 max-w-7xl py-4 sm:py-6 md:py-10 pb-24 md:pb-10">
      <h1 class="site-profile-visually-hidden">{{ $t('pages.profile.heading') }}</h1>
      <section class="site-profile-identity animate-entrance" :aria-label="$t('pages.profile.heading')" style="animation-delay:80ms;">
        <div class="site-profile-identity-header">
          <ProfileAvatarEditor
            v-model:avatar="form.avatar"
            :name="form.name"
            @saved="onAvatarSaved"
            @error="errorMessage = $event"
          />

          <div class="site-profile-identity-copy">
            <textarea
              ref="nameTextarea"
              v-model="form.name"
              rows="1"
              class="site-profile-name w-full resize-none overflow-hidden leading-tight bg-transparent outline-none focus:outline-none"
              :placeholder="$t('pages.profile.namePlaceholder')"
              :aria-label="$t('pages.profile.namePlaceholder')"
              @input="autoResizeName"
            />
            <NInput
              v-model="form.job"
              :placeholder="$t('pages.profile.jobTitlePlaceholder')"
              :aria-label="$t('pages.profile.job')"
              input="~"
              class="site-profile-job"
            />
          </div>
        </div>

        <NInput
          v-model="form.biography"
          type="textarea"
          :rows="2"
          input="~"
          class="site-profile-biography"
          :aria-label="$t('pages.profile.biography')"
          :placeholder="$t('pages.profile.bioPlaceholder')"
        />
        <NButton @click="openSocialsDialog" btn="ghost-gray" size="sm" class="site-profile-socials-action">
          <NIcon name="i-lucide-link" />
          <span class="ml-2">{{ $t('pages.profile.editSocials') }}</span>
        </NButton>
      </section>

      <div class="site-profile-form-wrap">
        <form @submit.prevent="onSubmit">
          <div class="site-profile-fields">
            <!-- Email -->
            <div class="site-profile-field">
              <label for="profile-email" class="site-profile-field-label">{{ $t('pages.profile.email') }}</label>
              <NInput
                id="profile-email"
                v-model="form.email"
                :placeholder="$t('pages.profile.emailPlaceholder')"
                input="outline"
                type="email"
                class="w-full"
                size="md"
              />
            </div>

            <!-- Location -->
            <div class="site-profile-field">
              <label for="profile-location" class="site-profile-field-label">{{ $t('pages.profile.location') }}</label>
              <NInput
                id="profile-location"
                v-model="form.location"
                :placeholder="$t('pages.profile.locationPlaceholder')"
                input="outline"
                class="w-full"
                size="md"
              />
            </div>

            <!-- Language -->
            <div class="site-profile-field">
              <label for="profile-language" class="site-profile-field-label">{{ $t('pages.profile.language') }}</label>
              <NSelect
                id="profile-language"
                v-model="selectedLanguage"
                :items="languageOptions"
                item-key="label"
                value-key="label"
                :placeholder="$t('pages.profile.languagePlaceholder')"
                :aria-label="$t('pages.profile.language')"
                class="w-full"
              />
            </div>

          </div>
        </form>
      </div>

      <!-- Mobile sticky bottom action bar (outside form for proper fixed positioning) -->
      <div class="site-profile-mobile-actions fixed bottom-0 left-0 right-0 z-2 p-4 backdrop-blur-lg md:hidden">
        <div class="container mx-auto max-w-7xl">
          <div class="flex gap-2">
            <NTooltip :content="$t('pages.profile.resetChanges')">
              <NButton 
                @click="resetForm" 
                btn="soft-gray" 
                size="md"
                icon
                label="i-ph-arrow-arc-left"
                :disabled="isSaving || !hasChanges"
              />
            </NTooltip>
            <NButton 
              :disabled="isSaving || !hasChanges" 
              @click="onSubmit" 
              btn="solid-black"
              size="md"
              class="site-profile-save flex-1"
              :aria-label="isSaving ? $t('common.saving') : $t('pages.profile.saveChanges')"
            >
              <NIcon :name="isSaving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': isSaving }" />
              <span class="ml-2">{{ isSaving ? $t('common.saving') : $t('common.save') }}</span>
            </NButton>
          </div>
        </div>
      </div>

      <ProfileSocialsDialog
        v-model:open="socialsDialogOpen"
        :model-value="form.socials"
        :saving="socialsSaving"
        @save="saveSocialsDialog"
      />

    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { $t, $getLocale } = useI18n()
useHead({ title: `${$t('pages.profile.heading')} - ${$t('seo.siteName')}` })
const { user, loggedIn, fetch: refreshSession } = useUserSession()

// Redirect unauthenticated users on client-side
if (typeof loggedIn !== 'boolean' ? !loggedIn.value : !loggedIn) {
  router.push(localizedPath('/signin', $getLocale()))
}

type UserProfile = {
  id: number
  name: string
  email: string
  avatar: string | null
  biography: string | null
  job: string | null
  location: string | null
  language: string | null
  socials: string | null
  created_at: string
  updated_at: string
}

const { data: profileData, pending, error } = await useFetch<UserProfile>('/api/user/profile', { server: false })
const userProfile = computed(() => {
  const payload = profileData.value as any
  if (payload?.data) return payload.data
  return payload ?? (user.value as any)
})

const form = reactive({
  name: '',
  email: '',
  avatar: '',
  biography: '',
  job: '',
  location: '',
  language: '',
  socials: '' as string | null,
})
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
]
const selectedLanguage = computed({
  get: () => languageOptions.find(option => option.value === form.language) ?? null,
  set: (option: typeof languageOptions[number] | null) => {
    form.language = option?.value ?? ''
  },
})

const initialForm = ref({} as Record<string, any>)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
// Auto-hide timeout for success messages
const successTimeout = ref<number | null>(null)

watch(userProfile, (val) => {
  if (!val) return
  form.name = val.name ?? ''
  form.email = val.email ?? ''
  form.avatar = val.avatar ?? ''
  form.biography = val.biography ?? ''
  form.job = val.job ?? ''
  form.location = val.location ?? ''
  form.language = val.language ?? ''
  form.socials = typeof val.socials === 'string' ? val.socials : JSON.stringify(val.socials ?? '')
  initialForm.value = { ...form }
  // Ensure textarea is sized after we update the form value
  nextTick(() => autoResizeName(nameTextarea.value))
}, { immediate: true })

// If fetching the profile returns a 401 (unauthenticated), redirect to signin
if (error?.value?.statusCode === 401) {
  router.push(localizedPath('/signin', $getLocale()))
}

const nameTextarea = ref<HTMLTextAreaElement | null>(null)

function autoResizeName(eventOrEl?: Event | HTMLTextAreaElement | null) {
  let t: HTMLTextAreaElement | null = null
  if (!eventOrEl) t = nameTextarea.value
  else if ((eventOrEl as Event).target) t = (eventOrEl as Event).target as HTMLTextAreaElement
  else t = eventOrEl as HTMLTextAreaElement
  if (!t) return
  t.style.height = 'auto'
  t.style.height = `${t.scrollHeight}px`
}

let nameResizeObserver: ResizeObserver | null = null
onMounted(() => {
  // Initial sizing after mount
  nextTick(() => autoResizeName(nameTextarea.value))
  if (nameTextarea.value && typeof ResizeObserver !== 'undefined') {
    nameResizeObserver = new ResizeObserver(() => autoResizeName(nameTextarea.value))
    nameResizeObserver.observe(nameTextarea.value)
  }
  // Global keyboard shortcut: Cmd/Ctrl + Enter to save
  if (import.meta.client) window.addEventListener('keydown', handleGlobalKeydown)
})
onBeforeUnmount(() => {
  nameResizeObserver?.disconnect(); nameResizeObserver = null
  if (import.meta.client) window.removeEventListener('keydown', handleGlobalKeydown)
  if (successTimeout.value) { clearTimeout(successTimeout.value); successTimeout.value = null }
})

const hasChanges = computed(() => {
  return Object.keys(initialForm.value).some((k) => (initialForm.value as any)[k] !== (form as any)[k])
})

function resetForm() {
  Object.assign(form, initialForm.value)
  errorMessage.value = ''
  successMessage.value = ''
}

async function onAvatarSaved(avatar: string, message: string) {
  form.avatar = avatar
  if (userProfile.value) userProfile.value.avatar = avatar
  errorMessage.value = ''
  showSuccess(message)
  await refreshSession()
  initialForm.value = { ...form }
}

const socialsDialogOpen = ref(false)
const socialsSaving = ref(false)

function openSocialsDialog() {
  socialsDialogOpen.value = true
}

async function saveSocialsDialog(socials: string) {
  form.socials = socials
  socialsSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const payload: any = { socials: form.socials }
    await $fetch('/api/user/profile', { method: 'PUT', body: payload })
    showSuccess($t('pages.profile.socialsUpdated'))
    // Refresh session/profile data
    await refreshSession()
    initialForm.value = { ...form }
    socialsDialogOpen.value = false
  } catch (error: any) {
    console.error('Failed to update social links:', error)
    errorMessage.value = $t('pages.profile.socialsUpdateFailed')
    // keep dialog open so user can retry
  } finally {
    socialsSaving.value = false
  }
}

function validateForm() {
  errorMessage.value = ''
  // Simple validation: name required
  if (!form.name || !form.name.trim()) {
    errorMessage.value = $t('pages.profile.nameRequired')
    return false
  }
  if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errorMessage.value = $t('pages.profile.emailValid')
    return false
  }
  if (form.socials && form.socials.trim().length) {
    try { JSON.parse(form.socials) } catch { errorMessage.value = $t('pages.profile.socialsJson'); return false }
  }
  return true
}

async function onSubmit() {
  if (!validateForm()) return
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload: any = {}
  for (const key of Object.keys(initialForm.value)) {
    if ((initialForm.value as any)[key] !== (form as any)[key]) {
      payload[key] = (form as any)[key]
    }
  }

  try {
    await $fetch('/api/user/profile', { method: 'PUT', body: payload })
    showSuccess($t('pages.profile.updatedSuccess'))
    if (userProfile.value) Object.assign(userProfile.value, payload)
    // refresh session data if available
    await refreshSession()
    initialForm.value = { ...form }
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    errorMessage.value = $t('pages.profile.updateFailed')
  } finally {
    isSaving.value = false
  }
}

// Helper: show a success message and auto-clear it after a timeout
function showSuccess(msg: string, ms = 5000) {
  // clear any previous timeout
  if (successTimeout.value) { clearTimeout(successTimeout.value); successTimeout.value = null }
  successMessage.value = msg
  if (import.meta.client) {
    successTimeout.value = window.setTimeout(() => {
      successMessage.value = ''
      successTimeout.value = null
    }, ms)
  }
}

// Global keyboard handler (Cmd/Ctrl + Enter triggers save)
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    // avoid re-triggering while saving
    if (isSaving.value) return
    e.preventDefault()
    onSubmit()
  }
}
</script>

<style scoped>
@layer components {

.animate-entrance {
  opacity: 0;
  transform: translateY(8px) scale(0.996);
  animation: entrance 640ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
}

@keyframes entrance {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-entrance {
    transition: none;
    animation: none;
    opacity: 1;
    transform: none;
  }
}
}
</style>
