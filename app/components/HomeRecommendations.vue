<template>
  <section class="site-home-recommendations">
    <div class="site-home-recommendations-inner">
      <div v-if="showHeading" class="site-home-recommendations-heading">
        <HomeSectionHeading
          :to="localizedPath('/recommendations', $getLocale())"
          :title="heading"
        />
      </div>
      <div class="site-home-recommendations-grid">
        <a
          v-for="item in recommendations"
          :key="item.name"
          class="site-home-recommendation"
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img :src="item.icon" alt="" width="22" height="22" loading="lazy" decoding="async">
          <span class="site-home-recommendation-title">
            <span>{{ item.name }}</span>
            <span class="i-ph-arrow-up-right" aria-hidden="true" />
          </span>
          <span class="site-home-recommendation-description">{{ item.description }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { localizedPath } from '~/utils/presentationPosts'

const { $getLocale, $t } = useI18n()
withDefaults(defineProps<{ showHeading?: boolean }>(), { showHeading: true })
const heading = computed(() => {
  const translated = $t('components.homeRecommendations.heading')
  if (translated.toLocaleLowerCase() !== 'components.homerecommendations.heading') return translated
  return $getLocale() === 'fr' ? 'Recommandations' : 'Recommendations'
})
const recommendations = computed(() => {
  const french = $getLocale() !== 'en'
  return [
    {
      name: 'GitHub',
      description: french ? 'Dépôt de code' : 'Code Repository',
      href: 'https://github.com/',
      icon: 'https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg',
    },
    {
      name: 'Prime Direction',
      description: french ? 'Thèmes Ghost premium' : 'Premium Ghost Themes',
      href: 'https://primedirection.org/',
      icon: 'https://primedirection.org/favicon.png',
    },
    {
      name: 'Figma',
      description: french ? 'Outil de conception' : 'Design Tool',
      href: 'https://figma.com/',
      icon: 'https://static.figma.com/app/icon/2/touch-180.png',
    },
  ]
})
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-home-recommendations {
  margin-top: 77px;
  padding-bottom: 84px;
}
.site-shell .site-home-recommendations-inner {
  width: min(700px, calc(100vw - 32px));
  margin-inline: auto;
}
.site-shell .site-home-recommendations-heading {
  margin-bottom: 24px;
}
.site-shell .site-home-recommendations-grid {
  display: grid;
  width: 720px;
  max-width: calc(100vw - 32px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-left: -10px;
}
.site-shell .site-home-recommendation {
  display: flex;
  min-height: 143px;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  transform: scale(1);
  border: 1px solid var(--site-color-border);
  border-radius: 16px;
  background: transparent;
  color: var(--site-color-text);
  text-decoration: none;
  transition:
    background-color 200ms ease-in-out,
    border-color 200ms ease-in-out,
    transform 220ms var(--site-ease-standard);
}
.site-shell .site-home-recommendation:hover,
.site-shell .site-home-recommendation:focus-visible {
  transform: scale(1.02);
  border-color: color-mix(in srgb, var(--site-color-background) 93%, var(--site-color-heading) 7%);
  background: color-mix(in srgb, var(--site-color-background) 93%, var(--site-color-heading) 7%);
}
.site-shell .site-home-recommendation img {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  object-fit: contain;
}
.site-shell .site-home-recommendation-title {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  color: var(--site-color-heading);
  font-size: 18px;
  font-weight: 550;
  line-height: 24px;
}
.site-shell .site-home-recommendation-title .i-ph-arrow-up-right {
  font-size: 16px;
}
.site-shell .site-home-recommendation-description {
  margin-top: 4px;
  color: var(--site-color-muted);
  font-size: 14px;
  line-height: 20px;
}
.site-shell .site-public-archive-footer .site-home-recommendations-inner {
  width: min(700px, calc(100% - 32px));
}
.site-shell .site-public-archive-footer .site-home-recommendations-grid {
  width: 100%;
  max-width: 100%;
  margin-left: 0;
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-home-recommendation {
    transition: none;
  }

  .site-shell .site-home-recommendation:hover,
  .site-shell .site-home-recommendation:focus-visible {
    transform: none;
  }
}
@media (max-width: 1023px) {
  .site-shell .site-home-recommendations-grid {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
  }
}
@media (max-width: 1023px) {
  .site-shell .site-home-recommendations {
    margin-top: 48px;
  }
}
@media (max-width: 600px) {
  .site-shell .site-home-recommendations-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 600px) {
  .site-shell .site-home-recommendations {
    padding-bottom: 48px;
  }
}
}
</style>
