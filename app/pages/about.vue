<template>
  <main class="site-page site-about" :data-public-page-edit-target="isContentEditMode ? 'about' : undefined">
    <header class="site-about-header">
      <AboutPageEditor :content="aboutPageContent" :is-admin="isAdmin" :is-edit-mode="isContentEditMode" @saved="saveAboutPageContent" />
      <h1>{{ displayedContent.heading }}</h1>
      <p>{{ displayedContent.mainTitle }}</p>
    </header>

    <figure class="site-about-cover">
      <img
        src="/images/corpinot-cover.jpeg"
        :alt="$ts('pages.about.coverAlt')"
      />
    </figure>

    <div class="site-about-content">
      <section class="site-about-introduction">
        <p>{{ displayedContent.intro }}</p>
        <p>{{ displayedContent.description }}</p>
        <p class="site-about-links">
          <NuxtLink class="site-editorial-link" :to="localizedPath('/posts', $getLocale())">
            {{ $ts('pages.about.browsePosts') }}
          </NuxtLink>
          <span aria-hidden="true">·</span>
          <a
            class="site-editorial-link"
            href="https://github.com/rootasjey/corpinot"
            target="_blank"
            rel="noopener"
          >
            {{ $ts('pages.about.openSource') }}
          </a>
        </p>
      </section>

      <section class="site-about-section">
        <h2>{{ displayedContent.openSourceHeading }}</h2>
        <p>{{ displayedContent.openSourceText }}</p>
      </section>

      <section class="site-about-section site-about-faq">
        <h2>{{ displayedContent.faqHeading }}</h2>

        <NAccordion
          type="single"
          accordion="divider"
          class="site-about-accordion"
        >
          <NAccordionItem
            v-for="item in displayedContent.faq"
            :key="item.id"
            :value="item.id"
            :label="item.question"
            :una="accordionItemUna"
            :_accordion-trigger="accordionTriggerUna"
          >
            <template #content><p>{{ item.answer }}</p></template>
          </NAccordionItem>
        </NAccordion>
      </section>

      <section class="site-about-section site-about-contact">
        <h2>{{ displayedContent.contactHeading }}</h2>
        <p>{{ displayedContent.contactText }}</p>
      </section>
    </div>

    <NewsletterSubscription />
  </main>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'
import { DEFAULT_ABOUT_PAGE_CONTENT, type AboutPageContent, type SupportedContentLocale } from '~~/shared/types/public-page-content'
import useSiteSettings from '~/composables/useSiteSettings'

const { $ts, $getLocale } = useI18n()
const config = useRuntimeConfig()
const { settings: settingsData } = await useSiteSettings()
const locale = computed(() => $getLocale())
const activeContentLocale = computed<SupportedContentLocale>(() => locale.value === 'fr' ? 'fr' : 'en')
const aboutPageContent = computed(() => settingsData.value?.aboutPageContent || DEFAULT_ABOUT_PAGE_CONTENT)
const { user, loggedIn } = useUserSession()
const isAdmin = computed(() => !!(loggedIn.value && user.value?.role === 'admin'))
const siteEditMode = usePublicPageEditMode()
const isContentEditMode = computed(() => isAdmin.value && siteEditMode.value)
const legacyFaqKeys = [
  ['faqWhoLabel', 'faqWhoContent'],
  ['faqTopicsLabel', 'faqTopicsContent'],
  ['faqOpenSourceLabel', 'faqOpenSourceContent'],
  ['faqContributeLabel', 'faqContributeContent'],
  ['faqNewsletterLabel', 'faqNewsletterContent'],
] as const
const displayedContent = computed(() => {
  if (locale.value === 'fr' || locale.value === 'en') {
    const content = aboutPageContent.value[activeContentLocale.value]
    return {
      ...content,
      intro: content.intro.replaceAll('**', ''),
      openSourceText: content.openSourceText.replaceAll('**', ''),
      faq: content.faq.map(item => ({
        id: item.id,
        question: item.question[activeContentLocale.value],
        answer: item.answer[activeContentLocale.value],
      })),
    }
  }

  return {
    heading: $ts('pages.about.heading'),
    mainTitle: $ts('pages.about.mainTitle'),
    intro: $ts('pages.about.intro').replaceAll('**', ''),
    description: $ts('pages.about.description'),
    openSourceHeading: $ts('pages.about.openSourceHeading'),
    openSourceText: $ts('pages.about.openSourceText').replaceAll('**', ''),
    faqHeading: $ts('pages.about.faqHeading'),
    faq: legacyFaqKeys.map(([questionKey, answerKey], index) => ({
      id: `legacy-q${index + 1}`,
      question: $ts(`pages.about.${questionKey}`),
      answer: $ts(`pages.about.${answerKey}`),
    })),
    contactHeading: $ts('pages.about.contactHeading'),
    contactText: $ts('pages.about.contactText'),
  }
})

function saveAboutPageContent(content: AboutPageContent) {
  if (settingsData.value) settingsData.value.aboutPageContent = content
}
const accordionItemUna = {
  accordionItem: 'border-[var(--site-color-border)]',
  accordionLeading: 'text-[var(--site-color-text)] hover:bg-[var(--site-color-hover-background)] hover:text-[var(--site-color-heading)]',
  accordionTrailing: 'text-[var(--site-color-muted)]',
  accordionContent: 'text-[var(--site-color-muted)]',
  accordionPanel: 'pb-4',
}
const accordionTriggerUna = {
  class: 'text-left text-[var(--site-color-text)] hover:bg-[var(--site-color-hover-background)] hover:text-[var(--site-color-heading)] focus-visible:outline-2 focus-visible:outline-[var(--site-color-focus-ring)] focus-visible:outline-offset-2',
}

useSeoMeta({
  title: $ts('pages.about.metaTitle'),
  ogTitle: $ts('pages.about.metaTitle'),
  description: $ts('pages.about.metaDescription'),
  ogDescription: $ts('pages.about.metaDescription'),
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

  .site-about-faq :deep(.accordion-panel) {
    border-top-color: var(--site-color-border);
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
