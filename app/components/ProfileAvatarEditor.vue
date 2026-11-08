<template>
  <div class="site-profile-avatar-wrap">
    <NDropdownMenu :items="avatarMenuItems" :_dropdownMenuContent="{ side: 'right', align: 'center', sideOffset: 8 }">
      <button
        type="button"
        class="site-profile-avatar relative group overflow-hidden flex items-center justify-center transition-all duration-300 focus:outline-none"
        :class="avatarDragOver ? 'site-profile-avatar--dragging scale-105' : ''"
        :disabled="avatarBusy"
        :aria-label="$t('pages.profile.editAvatar')"
        :aria-busy="avatarBusy"
        @dragover.prevent="avatarDragOver = true"
        @dragleave.prevent="avatarDragOver = false"
        @drop.prevent="onAvatarDrop"
      >
        <NuxtImg
          v-if="displayAvatar.startsWith('/users/')"
          provider="hubblob"
          :src="displayAvatar"
          :alt="name"
          class="object-cover w-full h-full"
        />
        <img v-else-if="displayAvatar" :src="displayAvatar" :alt="name" class="object-cover w-full h-full" />
        <span v-else class="site-profile-avatar-fallback w-full h-full flex items-center justify-center font-semibold">
          {{ initials }}
        </span>
        <span v-if="avatarUploading" class="absolute left-0 bottom-0 w-full h-1.5 bg-black/20 overflow-hidden">
          <span class="site-profile-progress block h-full transition-all duration-300" :style="{ width: avatarUploadProgress + '%' }" />
        </span>
      </button>
    </NDropdownMenu>

    <input ref="avatarFileInput" type="file" accept="image/*" class="hidden" :disabled="avatarBusy" @change="handleAvatarFileChange" />
    <span class="site-profile-avatar-hint">{{ $t('pages.profile.editAvatar') }}</span>

    <NDialog v-model:open="deleteAvatarDialogOpen" :closeOnEsc="true">
      <NDialogContent class="max-w-sm">
        <NDialogHeader>
          <NDialogTitle>{{ $t('pages.profile.removeAvatarTitle') }}</NDialogTitle>
        </NDialogHeader>

        <div class="p-6 text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.profile.removeAvatarConfirm') }}</div>

        <NDialogFooter class="flex items-center gap-2 justify-end p-0">
          <NButton @click="deleteAvatarDialogOpen = false" btn="ghost-gray" size="xs" :disabled="isDeletingAvatar">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton @click="confirmDeleteAvatar" :disabled="isDeletingAvatar" btn="soft-pink" size="xs" color="danger">
            <NIcon :name="isDeletingAvatar ? 'i-lucide-loader' : 'i-lucide-trash'" :class="{ 'animate-spin': isDeletingAvatar }" />
            <span class="ml-2">{{ $t('common.remove') }}</span>
          </NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { troncheAvatarUrl } from '~/utils/troncheAvatar'

const props = defineProps<{
  avatar: string
  name: string
}>()

const emit = defineEmits<{
  'update:avatar': [avatar: string]
  saved: [avatar: string, message: string]
  error: [message: string]
}>()

const { $t } = useI18n()
const avatarFileInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const avatarUploadProgress = ref(0)
const avatarDragOver = ref(false)
const deleteAvatarDialogOpen = ref(false)
const isDeletingAvatar = ref(false)

const avatarBusy = computed(() => avatarUploading.value || isDeletingAvatar.value)
const displayAvatar = computed(() => props.avatar || troncheAvatarUrl(props.name, 96))
const initials = computed(() => props.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase())

const avatarMenuItems = computed(() => [
  { label: `${$t('pages.profile.changeAvatar')} · Tronche`, leading: 'i-ph-sparkle', disabled: avatarBusy.value, onSelect: useTroncheAvatar },
  { label: $t('pages.profile.addAvatar'), leading: 'i-ph-upload-simple', disabled: avatarBusy.value, onSelect: triggerAvatarFileInput },
  ...(props.avatar ? [{ label: $t('pages.profile.removeAvatar'), leading: 'i-ph-trash', disabled: avatarBusy.value, onSelect: () => { deleteAvatarDialogOpen.value = true } }] : []),
])

function triggerAvatarFileInput() {
  if (avatarBusy.value) return
  avatarFileInput.value?.click()
}

function useTroncheAvatar() {
  if (avatarBusy.value) return
  emit('error', '')
  emit('update:avatar', troncheAvatarUrl(props.name, 96))
}

async function onAvatarDrop(event: DragEvent) {
  avatarDragOver.value = false
  if (avatarBusy.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file) await uploadAvatarWithUi(file)
}

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && !avatarBusy.value) await uploadAvatarWithUi(file)
  input.value = ''
}

async function uploadAvatarWithUi(file: File) {
  if (avatarBusy.value) return
  avatarUploading.value = true
  avatarUploadProgress.value = 0
  emit('error', '')
  try {
    const response = await uploadAvatar(file)
    if (!response.success || !response.image?.src) throw new Error($t('pages.profile.avatarUploadFailed'))
    emit('update:avatar', response.image.src)
    emit('saved', response.image.src, $t('pages.profile.avatarUpdated'))
  } catch (error: any) {
    emit('error', error?.message || $t('pages.profile.avatarUploadFailed'))
    console.error('Failed to upload avatar:', error)
  } finally {
    avatarUploading.value = false
    avatarUploadProgress.value = 0
  }
}

function uploadAvatar(file: File) {
  return new Promise<{ success?: boolean; image?: { src?: string } }>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', '/api/user/avatar')
    request.timeout = 120_000
    request.onload = () => {
      try {
        const payload = JSON.parse(request.responseText || '{}')
        if (request.status >= 200 && request.status < 300) resolve(payload)
        else reject(new Error($t('pages.profile.avatarUploadFailed')))
      } catch {
        reject(new Error($t('pages.profile.avatarUploadFailed')))
      }
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) avatarUploadProgress.value = Math.round((event.loaded / event.total) * 100)
    }
    request.onerror = () => reject(new Error($t('pages.profile.avatarUploadNetworkError')))
    request.onabort = () => reject(new Error($t('pages.profile.avatarUploadCanceled')))
    request.ontimeout = () => reject(new Error($t('pages.profile.avatarUploadTimedOut')))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)
    request.send(formData)
  })
}

async function confirmDeleteAvatar() {
  if (avatarBusy.value) return
  isDeletingAvatar.value = true
  emit('error', '')
  try {
    const response: any = await $fetch('/api/user/avatar', { method: 'DELETE' })
    if (!response.success) throw new Error($t('pages.profile.avatarRemoveFailed'))

    emit('update:avatar', '')
    emit('saved', '', $t('pages.profile.avatarRemoved'))
    deleteAvatarDialogOpen.value = false
  } catch (error) {
    emit('error', $t('pages.profile.avatarRemoveFailed'))
    console.error('Failed to remove avatar:', error)
  } finally {
    isDeletingAvatar.value = false
  }
}
</script>
