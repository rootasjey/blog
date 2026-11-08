<template>
  <NDialog v-model:open="isOpen" :draggable="false">
    <NDialogContent class="max-w-lg">
      <NDialogHeader>
        <NDialogTitle>Configure AI provider</NDialogTitle>
        <NDialogDescription>Select which backend to use for AI writing. This affects the post editor only.</NDialogDescription>
      </NDialogHeader>

      <div class="grid gap-3 mt-4">
        <button
          type="button"
          class="provider-tile"
          :class="{ 'is-active': internalProvider === 'cloudflare' }"
          @click="setProvider('cloudflare')"
        >
          <div class="flex items-center gap-3">
            <span class="i-lucide-cloud" />
            <div class="text-left">
              <div class="font-semibold">Cloudflare Workers AI</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Fast defaults; translation/summarize stay on Cloudflare.</div>
            </div>
          </div>
          <span v-if="internalProvider === 'cloudflare'" class="provider-check i-ph-check-fat" />
        </button>

        <button
          type="button"
          class="provider-tile"
          :class="{ 'is-active': internalProvider === 'openrouter' }"
          @click="setProvider('openrouter')"
        >
          <div class="flex items-center gap-3">
            <span class="i-lucide-network" />
            <div class="text-left">
              <div class="font-semibold">OpenRouter</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Community models via OpenRouter (streaming completions).</div>
            </div>
          </div>
          <span v-if="internalProvider === 'openrouter'" class="provider-check i-ph-check-fat" />
        </button>
      </div>

      <NDialogFooter class="flex items-center justify-between gap-2 mt-6">
        <NuxtLink :to="localizedPath('/settings/ai', $getLocale())" class="text-sm text-slate-500 dark:text-slate-400 hover:underline">
          Manage models per action
        </NuxtLink>
        <div class="flex items-center gap-2">
          <NButton btn="ghost-gray" size="sm" @click="emit('update:open', false)">Cancel</NButton>
          <NButton btn="solid-black" size="sm" class="min-w-24 font-600" @click="confirm">Save</NButton>
        </div>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const { $getLocale } = useI18n()

const props = defineProps<{ open: boolean; provider: 'cloudflare' | 'openrouter' }>()
const emit = defineEmits<{ 'update:open': [boolean]; 'update:provider': ['cloudflare' | 'openrouter'] }>()

const internalProvider = ref<'cloudflare' | 'openrouter'>(props.provider || 'cloudflare')

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val),
})

watch(() => props.provider, (val) => {
  if (!val) return
  internalProvider.value = val
})

function setProvider(p: 'cloudflare' | 'openrouter') {
  internalProvider.value = p
}

function confirm() {
  emit('update:provider', internalProvider.value)
  emit('update:open', false)
}
</script>

<style scoped>
@layer components {

.provider-tile {
  @apply flex items-center justify-between gap-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-left hover:shadow-sm;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.provider-tile:hover,
.provider-tile:focus-visible {
  border-color: color-mix(in srgb, var(--site-color-accent) 45%, var(--site-color-border));
}
.provider-tile.is-active {
  border-color: var(--site-color-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--site-color-accent) 35%, transparent);
}
.provider-check {
  color: var(--site-color-accent);
}
}
</style>
