<template>
  <main class="site-page site-donate">
    <div class="site-donate-content">
      <header class="site-donate-intro">
        <h1>{{ $ts('pages.donate.heading') }}</h1>
        <p>{{ $ts('pages.donate.description') }}</p>
      </header>

      <p class="site-donate-status" role="status">{{ $ts('pages.donate.notAvailable') }}</p>

      <section class="site-donate-reasons" :aria-labelledby="reasonsHeadingId">
        <h2 :id="reasonsHeadingId">{{ $ts('pages.donate.whyDonate') }}</h2>
        <ol>
          <li>
            <span aria-hidden="true">01</span>
            <p>{{ $ts('pages.donate.supportAuthors') }}</p>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <p>{{ $ts('pages.donate.fundImprovements') }}</p>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <p>{{ $ts('pages.donate.perks') }}</p>
          </li>
        </ol>
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
  margin: 32px 0 0;
  padding: 14px 0;
  border-top: 1px solid var(--site-color-border);
  border-bottom: 1px solid var(--site-color-border);
  color: var(--site-color-muted);
  font-size: 15px;
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

.site-donate-reasons ol {
  display: grid;
  gap: 18px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.site-donate-reasons li {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  gap: 10px;
  color: var(--site-color-text);
  line-height: 1.55;
}

.site-donate-reasons li > span {
  padding-top: 0.15em;
  color: var(--site-color-muted);
  font-size: 0.9em;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.site-donate-reasons li > p {
  margin: 0;
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

}

@media (prefers-reduced-motion: reduce) {
  .site-donate-home {
    transition: none;
  }
}
</style>
