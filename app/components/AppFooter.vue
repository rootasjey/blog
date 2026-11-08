<template>
  <footer class="site-footer border-t">
    <div class="site-footer-inner">
      <nav :aria-label="$t('footer.about')">
        <NuxtLink class="site-footer-nav-link" :to="localizedPath('/about', $getLocale())">{{ $t('footer.about') }}</NuxtLink>
        <NuxtLink class="site-footer-nav-link" :to="localizedPath('/credits', $getLocale())">{{ $t('footer.credits') }}</NuxtLink>
        <NuxtLink class="site-footer-nav-link" to="https://github.com/rootasjey/corpinot" external target="_blank">{{ $t('footer.gitHubRepository') }}</NuxtLink>
      </nav>

      <div class="site-footer-copyright">
        © {{ currentYear }}
        <NuxtLink class="site-footer-author-link" to="https://github.com/rootasjey" external target="_blank">Jérémie CORPINOT</NuxtLink> •
        {{ $t('nav.tagline') }}
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { localizedPath } from '~/utils/presentationPosts'

const currentYear = new Date().getFullYear()
const { $getLocale, $t } = useI18n()
</script>

<style>
@layer components {

/* Component and page styles moved from the global stylesheets. */
.site-shell .site-footer {
  position: relative;
  z-index: 11;
  padding: 0 0 30px;
  border-top: 0;
  background: var(--site-color-background);
  color: var(--site-color-muted);
}
.site-shell .site-footer-inner {
  width: min(700px, calc(100% - 32px));
  margin-inline: auto;
}
.site-shell .site-footer nav {
  display: flex;
  min-height: 31px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 31px;
  text-transform: none;
}
.site-shell .site-footer .site-footer-nav-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  box-sizing: border-box;
  min-height: 31px;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--site-color-text);
  font-weight: 500;
  line-height: 21px;
  text-decoration: none;
  transition:
    background-color 150ms ease-in-out,
    border-color 150ms ease-in-out,
    color 200ms ease,
    transform 220ms var(--site-ease-standard);
}
.site-shell .site-footer .site-footer-nav-link:hover,
.site-shell .site-footer .site-footer-nav-link:focus-visible {
  color: var(--site-color-heading);
  transform: translateY(-1px);
  background: var(--site-color-hover-background);
  border-color: var(--site-color-hover-background);
}
.site-shell .site-footer-copyright {
  margin-top: 16px;
  padding-top: 0;
  border-top: 0;
  color: var(--site-color-muted);
  font-size: 13px;
  line-height: 32px;
  font-weight: 500;
}
.site-shell .site-footer-copyright a {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
}
.site-shell .site-footer .site-footer-copyright .site-footer-author-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  box-sizing: border-box;
  height: 28px;
  align-items: center;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  line-height: 20px;
  vertical-align: baseline;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 200ms ease,
    transform 220ms var(--site-ease-standard);
}
.site-shell .site-footer .site-footer-copyright .site-footer-author-link:hover,
.site-shell .site-footer .site-footer-copyright .site-footer-author-link:focus-visible {
  color: var(--site-color-heading);
  transform: translateY(-1px);
  border-color: var(--site-color-hover-background);
  background: var(--site-color-hover-background);
}
@media (prefers-reduced-motion: reduce) {
  .site-shell .site-footer .site-footer-nav-link {
    transition: none;
  }

  .site-shell .site-footer .site-footer-nav-link:hover,
  .site-shell .site-footer .site-footer-nav-link:focus-visible {
    transform: none;
  }

  .site-shell .site-footer .site-footer-copyright .site-footer-author-link {
    transition: none;
  }

  .site-shell .site-footer .site-footer-copyright .site-footer-author-link:hover,
  .site-shell .site-footer .site-footer-copyright .site-footer-author-link:focus-visible {
    transform: none;
  }
}
}
</style>
