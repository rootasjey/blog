<template>
  <div class="site-home min-h-screen">
    <section class="site-intro" :data-public-page-edit-target="isAdmin && isEditMode ? 'home-intro' : undefined">
      <HomeIntroEditor :identity="identity" :is-admin="isAdmin" :is-edit-mode="isEditMode" @saved="emit('saved', $event)" />
      <img class="site-intro-mark" :src="identity.avatar" :alt="localizedIdentity.name" width="100" height="100">
      <h1>{{ localizedIdentity.name }}</h1>
      <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
      <a class="site-interactive-hover site-outline-action site-intro-subscribe" href="#newsletter">{{ $ts('common.subscribe') }}</a>
    </section>

    <FeaturedPostsGrid />

    <!-- Stepped scroll content -->
    <section class="space-y-10 px-4 pb-16 animate-entrance">
      <MobileProjectsGrid />
      <RecentPostsGrid />
      <NewsletterSubscription />

      <div>
        <NButton btn="solid-blue" :to="localizedPath('/donate', $getLocale())" class="w-full py-6" rounded="6" :label="$ts('components.mobileIndex.donateNow')" trailing="i-ph-cursor-click-duotone" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { localizedPath } from '~/utils/presentationPosts'
import type { HomeIdentity } from '~~/shared/types/home-identity'

const { $getLocale, $ts } = useI18n()
const props = defineProps<{ identity: HomeIdentity; isAdmin: boolean; isEditMode: boolean }>()
const emit = defineEmits<{ saved: [identity: HomeIdentity] }>()
const localizedIdentity = computed(() => props.identity[$getLocale() === 'en' ? 'en' : 'fr'])
const paragraphs = computed(() => localizedIdentity.value.description.split(/\n\s*\n/).filter(Boolean))
</script>
