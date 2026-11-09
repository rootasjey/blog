<template>
  <main class="site-page site-donate">
    <div class="site-donate-content">
      <header class="site-donate-intro">
        <h1>{{ $ts('pages.donate.heading') }}</h1>
        <p>{{ $ts('pages.donate.description') }}</p>
      </header>

      <p class="site-donate-status" role="status">
        <span aria-hidden="true" />
        {{ $ts('pages.donate.notAvailable') }}
      </p>

      <section class="site-donate-reasons" :aria-labelledby="reasonsHeadingId">
        <h2 :id="reasonsHeadingId">{{ $ts('pages.donate.whyDonate') }}</h2>
        <ul>
          <li>{{ $ts('pages.donate.supportAuthors') }}</li>
          <li>{{ $ts('pages.donate.fundImprovements') }}</li>
          <li>{{ $ts('pages.donate.perks') }}</li>
        </ul>
      </section>

      <NuxtLink class="site-donate-home" :to="localizedPath('/', locale)">
        {{ $ts('pages.donate.returnHome') }}
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { localizedPath } from '~/utils/presentationPosts'

const { $ts, $getLocale } = useI18n()
const locale = computed(() => $getLocale())
const reasonsHeadingId = 'donation-reasons-heading'
</script>

<style scoped>
.site-donate {
  min-height: calc(100vh - var(--site-header-height, 72px));
  padding: clamp(48px, 9vh, 96px) 24px 112px;
  background: var(--site-color-background);
  color: var(--site-color-text);
}

.site-donate-content {
  width: min(100%, 700px);
  margin-inline: auto;
}

.site-donate-intro {
  max-width: 680px;
}

.site-donate-intro h1 {
  margin: 0;
  color: var(--site-color-heading);
  font-family: var(--site-font-heading);
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 550;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.site-donate-intro p {
  margin: 18px 0 0;
  color: var(--site-color-muted);
  font-size: clamp(17px, 2vw, 20px);
  line-height: 1.55;
}

.site-donate-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 32px 0 0;
  padding: 14px 0;
  border-top: 1px solid var(--site-color-border);
  border-bottom: 1px solid var(--site-color-border);
  color: var(--site-color-muted);
  font-size: 15px;
}

.site-donate-status > span {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--site-color-muted);
}

.site-donate-reasons {
  margin-top: 44px;
}

.site-donate-reasons h2 {
  margin: 0;
  color: var(--site-color-heading);
  font-size: 20px;
  font-weight: 550;
  letter-spacing: -0.015em;
}

.site-donate-reasons ul {
  display: grid;
  gap: 0;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.site-donate-reasons li {
  padding: 14px 0;
  border-top: 1px solid var(--site-color-border);
  color: var(--site-color-text);
  line-height: 1.55;
}

.site-donate-home {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  padding: 0 15px;
  border: 1px solid var(--site-color-border);
  border-radius: var(--site-radius-control);
  color: var(--site-color-heading);
  font-weight: 500;
  text-decoration: none;
  transition: background-color var(--site-motion-fast) ease, border-color var(--site-motion-fast) ease;
}

.site-donate-home:hover {
  border-color: var(--site-color-focus-ring);
  background: var(--site-color-hover-background);
}

.site-donate-home:focus-visible {
  outline: 2px solid var(--site-color-focus-ring);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .site-donate {
    padding: 40px 20px 96px;
  }

  .site-donate-status {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-donate-home {
    transition: none;
  }
}
</style>
