<template>
  <section class="site-page site-profile min-h-screen">
    <div class="container mx-auto px-4 sm:px-6 max-w-7xl py-8 sm:py-10 md:py-14">
      <header class="site-profile-page-header animate-entrance">
        <NuxtLink :to="localizedPath('/', $getLocale())" class="site-profile-back">
          <NIcon name="i-lucide-arrow-left" aria-hidden="true" />
          <span>{{ $ts('common.back') }}</span>
        </NuxtLink>

        <div class="site-profile-title-row">
          <div class="site-profile-title-copy">
            <h1>{{ $ts('pages.profile.settingsTitle') }}</h1>
            <p>{{ $ts('pages.profile.settingsDescription') }}</p>
          </div>
          <div v-if="hasChanges" class="site-profile-actions">
            <NButton @click="resetForm" btn="ghost-gray" size="sm" :disabled="isSaving">
              {{ $ts('pages.profile.resetChanges') }}
            </NButton>
            <NButton @click="onSubmit" btn="solid-black" size="sm" class="site-profile-save" :disabled="isSaving">
              <NIcon :name="isSaving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': isSaving }" />
              <span class="ml-2">{{ isSaving ? $ts('common.saving') : $ts('pages.profile.saveChanges') }}</span>
            </NButton>
          </div>
        </div>

        <p v-if="successMessage" class="site-profile-status site-profile-status--success" role="status">{{ successMessage }}</p>
        <p v-else-if="errorMessage" class="site-profile-status site-profile-status--error" role="alert">{{ errorMessage }}</p>
      </header>

      <form id="profile-form" class="site-profile-form" @submit.prevent="onSubmit">
        <section class="site-profile-panel site-profile-identity" aria-labelledby="profile-identity-heading">
          <h2 id="profile-identity-heading" class="site-profile-section-heading">{{ $ts('pages.profile.publicIdentity') }}</h2>
          <div class="site-profile-identity-header">
          <ProfileAvatarEditor
            v-model:avatar="form.avatar"
            :name="form.name"
            @saved="onAvatarSaved"
            @error="errorMessage = $event"
          />

          <div class="site-profile-identity-copy">
            <label for="profile-name" class="site-profile-field-label">{{ $ts('pages.profile.namePlaceholder') }}</label>
            <textarea
              ref="nameTextarea"
              id="profile-name"
              v-model="form.name"
              rows="1"
              class="site-profile-name w-full resize-none overflow-hidden leading-tight bg-transparent outline-none focus:outline-none"
              :placeholder="$ts('pages.profile.namePlaceholder')"
              :aria-label="$ts('pages.profile.namePlaceholder')"
              @input="autoResizeName"
            />
            <label for="profile-job" class="site-profile-field-label">{{ $ts('pages.profile.job') }}</label>
            <NInput
              id="profile-job"
              v-model="form.job"
              :placeholder="$ts('pages.profile.jobTitlePlaceholder')"
              :aria-label="$ts('pages.profile.job')"
              input="~"
              class="site-profile-job"
            />
          </div>
        </div>

          <label for="profile-biography" class="site-profile-field-label">{{ $ts('pages.profile.biography') }}</label>
          <NInput
            id="profile-biography"
            v-model="form.biography"
            type="textarea"
            :rows="4"
            input="outline"
            class="site-profile-biography"
            :placeholder="$ts('pages.profile.bioPlaceholder')"
          />
        </section>

        <div class="site-profile-groups">
          <section class="site-profile-panel site-profile-group" aria-labelledby="profile-contact-heading">
            <h2 id="profile-contact-heading">{{ $ts('pages.profile.contactHeading') }}</h2>
            <div class="site-profile-group-fields">
              <div class="site-profile-field">
                <label for="profile-email" class="site-profile-field-label">{{ $ts('pages.profile.email') }}</label>
                <NInput id="profile-email" v-model="form.email" :placeholder="$ts('pages.profile.emailPlaceholder')" input="outline" type="email" class="w-full" size="md" />
              </div>
              <div class="site-profile-field">
                <label for="profile-location" class="site-profile-field-label">{{ $ts('pages.profile.location') }}</label>
                <NInput id="profile-location" v-model="form.location" :placeholder="$ts('pages.profile.locationPlaceholder')" input="outline" class="w-full" size="md" />
              </div>
            </div>
          </section>

          <section class="site-profile-panel site-profile-group" aria-labelledby="profile-preferences-heading">
            <h2 id="profile-preferences-heading">{{ $ts('pages.profile.preferencesHeading') }}</h2>
            <div class="site-profile-group-fields">
              <div class="site-profile-field">
                <label for="profile-language" class="site-profile-field-label">{{ $ts('pages.profile.language') }}</label>
                <NSelect id="profile-language" v-model="selectedLanguage" :items="languageOptions" :placeholder="$ts('pages.profile.languagePlaceholder')" :aria-label="$ts('pages.profile.language')" class="w-full" />
              </div>
            </div>
          </section>
        </div>
      </form>

      <section class="site-profile-socials" aria-labelledby="profile-socials-heading">
        <div>
          <h2 id="profile-socials-heading">{{ $ts('pages.profile.socials') }}</h2>
          <p>{{ $ts('pages.profile.socialsDescription') }}</p>
        </div>
        <NButton @click="openSocialsDialog" btn="outline-gray" size="sm" class="site-profile-socials-action">
          <NIcon name="i-lucide-link" aria-hidden="true" />
          <span class="ml-2">{{ $ts('pages.profile.editSocials') }}</span>
          <NIcon name="i-lucide-arrow-right" class="ml-2" aria-hidden="true" />
        </NButton>
      </section>

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
import { localizedPath } from '~/utils/presentationPosts'

import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { $ts, $getLocale } = useI18n()
useHead({ title: `${$ts('pages.profile.settingsTitle')} - ${$ts('seo.siteName')}` })
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
const languages = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
]
const languageOptions = languages.map(language => language.label)
const selectedLanguage = computed({
  get: () => languages.find(language => language.value === form.language)?.label ?? '',
  set: (language: string) => {
    form.language = languages.find(option => option.label === language)?.value ?? ''
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
    showSuccess($ts('pages.profile.socialsUpdated'))
    // Refresh session/profile data
    await refreshSession()
    initialForm.value = { ...form }
    socialsDialogOpen.value = false
  } catch (error: any) {
    console.error('Failed to update social links:', error)
    errorMessage.value = $ts('pages.profile.socialsUpdateFailed')
    // keep dialog open so user can retry
  } finally {
    socialsSaving.value = false
  }
}

function validateForm() {
  errorMessage.value = ''
  // Simple validation: name required
  if (!form.name || !form.name.trim()) {
    errorMessage.value = $ts('pages.profile.nameRequired')
    return false
  }
  if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errorMessage.value = $ts('pages.profile.emailValid')
    return false
  }
  if (form.socials && form.socials.trim().length) {
    try { JSON.parse(form.socials) } catch { errorMessage.value = $ts('pages.profile.socialsJson'); return false }
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
    showSuccess($ts('pages.profile.updatedSuccess'))
    if (userProfile.value) Object.assign(userProfile.value, payload)
    // refresh session data if available
    await refreshSession()
    initialForm.value = { ...form }
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    errorMessage.value = $ts('pages.profile.updateFailed')
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
