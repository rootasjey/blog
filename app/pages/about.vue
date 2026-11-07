<template>
  <main class="site-page site-about">
    <header class="site-about-header">
      <h1>{{ $t('pages.about.heading') }}</h1>
      <p>{{ $t('pages.about.mainTitle') }}</p>
    </header>

    <figure class="site-about-cover">
      <img
        src="/images/corpinot-cover.jpeg"
        :alt="$t('pages.about.coverAlt')"
      />
    </figure>

    <div class="site-about-content">
      <section class="site-about-introduction">
        <p>{{ intro }}</p>
        <p>{{ $t('pages.about.description') }}</p>
        <p class="site-about-links">
          <NuxtLink :to="localizedPath('/posts', $getLocale())">
            {{ $t('pages.about.browsePosts') }}
          </NuxtLink>
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/rootasjey/corpinot"
            target="_blank"
            rel="noopener"
          >
            {{ $t('pages.about.openSource') }}
          </a>
        </p>
      </section>

      <section class="site-about-section">
        <h2>{{ $t('pages.about.openSourceHeading') }}</h2>
        <p>{{ openSourceText }}</p>
      </section>

      <section class="site-about-section site-about-faq">
        <h2>{{ $t('pages.about.faqHeading') }}</h2>

        <NAccordion
          type="single"
          accordion="divider"
          class="site-about-accordion"
        >
          <NAccordionItem
            value="q1"
            :label="$t('pages.about.faqWhoLabel')"
            :una="accordionItemUna"
            :_accordion-trigger="accordionTriggerUna"
          >
            <template #content>
              <p>{{ $t('pages.about.faqWhoContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem
            value="q2"
            :label="$t('pages.about.faqTopicsLabel')"
            :una="accordionItemUna"
            :_accordion-trigger="accordionTriggerUna"
          >
            <template #content>
              <p>{{ $t('pages.about.faqTopicsContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem
            value="q3"
            :label="$t('pages.about.faqOpenSourceLabel')"
            :una="accordionItemUna"
            :_accordion-trigger="accordionTriggerUna"
          >
            <template #content>
              <p>{{ $t('pages.about.faqOpenSourceContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem
            value="q4"
            :label="$t('pages.about.faqContributeLabel')"
            :una="accordionItemUna"
            :_accordion-trigger="accordionTriggerUna"
          >
            <template #content>
              <p>{{ $t('pages.about.faqContributeContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem
            value="q5"
            :label="$t('pages.about.faqNewsletterLabel')"
            :una="accordionItemUna"
            :_accordion-trigger="accordionTriggerUna"
          >
            <template #content>
              <p>{{ $t('pages.about.faqNewsletterContent') }}</p>
            </template>
          </NAccordionItem>
        </NAccordion>
      </section>

      <section class="site-about-section site-about-contact">
        <h2>{{ $t('pages.about.contactHeading') }}</h2>
        <p>{{ $t('pages.about.contactText') }}</p>
      </section>
    </div>

    <NewsletterSubscription />
  </main>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'

const { $t, $getLocale } = useI18n()
const config = useRuntimeConfig()
const intro = computed(() => $t('pages.about.intro').replaceAll('**', ''))
const openSourceText = computed(() => $t('pages.about.openSourceText').replaceAll('**', ''))
const accordionItemUna = {
  accordionItem: 'border-[var(--site-color-border)]',
  accordionLeading: 'text-[var(--site-color-text)] hover:bg-[var(--site-color-hover-background)] hover:text-[var(--site-color-heading)]',
  accordionTrailing: 'text-[var(--site-color-muted)]',
  accordionContent: 'text-[var(--site-color-muted)]',
  accordionPanel: 'pb-4',
}
const accordionTriggerUna = {
  btn: 'w-full justify-between text-left text-[var(--site-color-text)] hover:bg-[var(--site-color-hover-background)] hover:text-[var(--site-color-heading)]',
  btnLabel: 'text-[var(--site-color-text)]',
}

useSeoMeta({
  title: $t('pages.about.metaTitle'),
  ogTitle: $t('pages.about.metaTitle'),
  description: $t('pages.about.metaDescription'),
  ogDescription: $t('pages.about.metaDescription'),
  ogUrl: `${config.public.siteUrl}/about`,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/about` }],
})
</script>

<style scoped>
@layer components {
  .site-about {
    padding-block: 60px 80px;
  }

  .site-about-header {
    width: min(700px, calc(100% - 32px));
    margin-inline: auto;
    text-align: center;
  }

  .site-about-header h1 {
    margin: 0;
    color: var(--site-color-heading);
    font-size: 20px;
    font-weight: 550;
    line-height: 28px;
  }

  .site-about-header p {
    max-width: 600px;
    margin: 16px auto 0;
    color: var(--site-color-text);
    font-size: 16px;
    line-height: 24px;
  }

  .site-about-cover {
    width: min(720px, calc(100% - 32px));
    margin: 80px auto 0;
    overflow: hidden;
    border-radius: var(--site-radius-cover);
    aspect-ratio: 16 / 9;
  }

  .site-about-cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .site-about-content {
    width: min(700px, calc(100% - 32px));
    margin: 72px auto 0;
    color: var(--site-color-text);
    font-size: 16px;
    line-height: 24px;
  }

  .site-about-content p {
    margin: 0 0 20px;
  }

  .site-about-content .site-about-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 28px;
  }

  .site-about-links a {
    color: var(--site-color-accent);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .site-about-section {
    padding-top: 32px;
    margin-top: 40px;
    border-top: 1px solid var(--site-color-border);
  }

  .site-about-section h2 {
    margin: 0 0 16px;
    color: var(--site-color-heading);
    font-size: 18px;
    font-weight: 550;
    line-height: 25px;
  }

  .site-about-faq :deep(.accordion-item) {
    margin-bottom: 8px;
    overflow: hidden;
    border: 1px solid var(--site-color-border);
    border-radius: 12px;
  }

  .site-about-faq :deep(.accordion-item:last-child) {
    margin-bottom: 0;
  }

  .site-about-faq :deep(.accordion-trigger) {
    min-height: 48px;
    padding: 12px 16px;
    border-radius: inherit;
    font: inherit;
  }

  .site-about-faq :deep(.accordion-panel p) {
    margin: 0;
    color: var(--site-color-muted);
  }

  .site-about-contact {
    margin-bottom: 0;
  }

  .site-about-contact a {
    color: var(--site-color-accent);
  }

  @media (max-width: 600px) {
    .site-about {
      padding-block: 48px 56px;
    }

    .site-about-cover {
      margin-top: 48px;
      border-radius: var(--site-radius-card);
    }

    .site-about-content {
      margin-top: 48px;
    }

    .site-about-section {
      padding-top: 24px;
      margin-top: 32px;
    }

    .site-about-faq :deep(.accordion-trigger) {
      min-height: 48px;
      padding: 12px;
    }
  }
}

@layer theme-overrides {
  .site-about-faq :deep(.accordion-trigger),
  .site-about-faq :deep(.accordion-trigger-label),
  .site-about-faq :deep(.accordion-trailing) {
    color: var(--site-color-text);
  }

  .site-about-faq :deep(.accordion-trigger:hover) {
    background-color: var(--site-color-hover-background);
    color: var(--site-color-heading);
  }

  .site-about-faq :deep(.accordion-trailing) {
    transition: transform 180ms ease;
  }

  .site-about-faq :deep(.accordion-trigger[data-state='closed'] .accordion-trailing) {
    transform: rotate(180deg);
  }

  .site-about-faq :deep(.accordion-trigger[data-state='open'] .accordion-trailing) {
    transform: none;
  }
}
</style>
