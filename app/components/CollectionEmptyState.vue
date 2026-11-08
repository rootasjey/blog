<template>
  <section class="site-collection-empty-state" aria-labelledby="site-collection-empty-state-title">
    <h2 id="site-collection-empty-state-title">{{ title }}</h2>
    <p>{{ description }}</p>
    <NButton
      v-if="actionLabel"
      btn="primary"
      size="xs"
      leading="i-ph-plus-bold"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </NButton>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<style scoped>
.site-collection-empty-state {
  width: min(560px, calc(100% - 32px));
  margin: 48px auto 72px;
  text-align: center;
}

.site-collection-empty-state h2 {
  margin: 0;
  color: var(--site-color-heading);
  font-size: clamp(22px, 3vw, 26px);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.site-collection-empty-state p {
  margin: 12px 0 20px;
  color: var(--site-color-muted);
  font-size: 15px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .site-collection-empty-state {
    margin-block: 36px 56px;
  }
}
</style>
