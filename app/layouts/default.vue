<template>
  <div class="min-h-screen flex flex-col font-text site-shell" :class="{ 'site-edit-mode-active': isContentEditMode }">
    <header
      class="site-banner relative z-10"
      :class="{ 'site-banner--hidden': isScrolled && isScrollingDown }"
      role="banner"
    >
      <AppHeader />
    </header>
    <PublicPageEditContextMenu :is-admin="isAdmin" :is-edit-mode="isContentEditMode" />
    <main class="flex-1 pb-20 md:pb-0">
      <slot />
    </main>
    <BottomPageBlur />
    <AppFooter class="hidden md:block" />
    <MobileBottomNav class="lg:hidden" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { localizedPath } from '~/utils/presentationPosts'
import { getPublicPostEditIdentifier, PUBLIC_PAGE_EDIT_REQUEST_EVENT, type PublicPageEditTarget } from '~/utils/publicPageEditRequests'

const { user, loggedIn } = useUserSession()
const siteEditMode = usePublicPageEditMode()
const isAdmin = computed(() => !!(loggedIn.value && user.value?.role === 'admin'))
const isContentEditMode = computed(() => !!(loggedIn.value && user.value?.role === 'admin' && siteEditMode.value))
const { isScrolled, isScrollingDown } = useHeaderScroll()
const { $getLocale } = useI18n()
const router = useRouter()
useEditModeGridCursor(isContentEditMode)

function onPublicPageEditRequest(event: Event) {
  if (!isContentEditMode.value) return

  const target = (event as CustomEvent<PublicPageEditTarget>).detail
  const identifier = getPublicPostEditIdentifier(target)
  if (!identifier) return

  void router.push(localizedPath(`/posts/edit/${identifier}`, $getLocale()))
}

onMounted(() => window.addEventListener(PUBLIC_PAGE_EDIT_REQUEST_EVENT, onPublicPageEditRequest))
onBeforeUnmount(() => window.removeEventListener(PUBLIC_PAGE_EDIT_REQUEST_EVENT, onPublicPageEditRequest))
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell > main:has(> .site-auth-page),
.site-shell > main:has(> .site-error-page) {
  display: flex;
  flex-direction: column;
}
}
</style>
