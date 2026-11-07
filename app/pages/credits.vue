<template>
  <main class="site-page site-credits">
    <header class="site-credits-header">
      <h1>{{ $t('pages.credits.heading') }}</h1>
      <p class="site-credits-description">
        {{ $t('pages.credits.description') }}
      </p>
    </header>

    <div class="site-credits-sections">
      <section class="site-credits-section">
        <h2>{{ $t('pages.credits.frameworksAndCore') }}</h2>
        <ul class="site-credits-list">
          <li>
            <a href="https://nuxt.com" target="_blank" rel="noopener">Nuxt 4</a>
            <span> — app framework (server routes via Nitro)</span>
          </li>
          <li>
            <a href="https://vuejs.org" target="_blank" rel="noopener">Vue 3</a>
            <span> — UI runtime</span>
          </li>
          <li>
            <a href="https://pinia.vuejs.org" target="_blank" rel="noopener">Pinia</a>
            <span> — state management</span>
          </li>
          <li>
            <a href="https://router.vuejs.org" target="_blank" rel="noopener">Vue Router</a>
            <span> — routing</span>
          </li>
          <li>
            <a href="https://image.nuxt.com" target="_blank" rel="noopener">@nuxt/image</a>
            <span> — image optimization</span>
          </li>
          <li>
            <a href="https://github.com/atinux/nuxt-auth-utils" target="_blank" rel="noopener">nuxt-auth-utils</a>
            <span> — auth helpers</span>
          </li>
        </ul>
      </section>

      <section class="site-credits-section">
        <h2>{{ $t('pages.credits.platformAndData') }}</h2>
        <ul class="site-credits-list">
          <li>
            <a href="https://hub.nuxt.com" target="_blank" rel="noopener">@nuxthub/core</a>
            <span> — blob, cache, database, kv, browser features</span>
          </li>
          <li>
            <a href="https://developers.cloudflare.com/workers/" target="_blank" rel="noopener">Cloudflare tooling</a>
            <span> — Wrangler and Workers-compatible utilities</span>
          </li>
        </ul>
      </section>

      <section class="site-credits-section">
        <h2>{{ $t('pages.credits.uiAndStyling') }}</h2>
        <ul class="site-credits-list">
          <li>
            <a href="https://una-ui.com" target="_blank" rel="noopener">Una UI</a>
            <span> — component primitives (prefix N)</span>
          </li>
          <li>
            <a href="https://unocss.dev" target="_blank" rel="noopener">UnoCSS</a>
            <span> — utility-first CSS with Wind3, Attributify, Tagify, Icons & Animations presets</span>
          </li>
          <li>
            <a href="https://iconify.design" target="_blank" rel="noopener">Iconify</a>
            <span> — icon system; Packs: Phosphor, Lucide, Tabler, Radix Icons, Line-MD</span>
          </li>
          <li>
            <a href="https://fonts.google.com/" target="_blank" rel="noopener">Google Fonts</a>
            <span> — webfonts: Oi, Manrope, Fraunces, Playwrite FR Moderne</span>
          </li>
          <li>
            <a href="https://color-mode.nuxtjs.org/" target="_blank" rel="noopener">@nuxtjs/color-mode</a>
            <span> — light/dark theme</span>
          </li>
          <li>
            <a href="https://woords.trexthemes.dev/" target="_blank" rel="noopener">Woords template</a>
            <span> — layout inspiration</span>
          </li>
        </ul>
      </section>

      <section class="site-credits-section">
        <h2>{{ $t('pages.credits.contentAndEditing') }}</h2>
        <ul class="site-credits-list">
          <li>
            <a href="https://tiptap.dev/" target="_blank" rel="noopener">Tiptap</a>
            <span> — rich‑text editor and extensions</span>
          </li>
          <li>
            <a href="https://github.com/jimp-dev/jimp" target="_blank" rel="noopener">Jimp</a>
            <span> — image manipulation</span>
          </li>
          <li>
            <a href="https://pptr.dev/" target="_blank" rel="noopener">Puppeteer</a>
            <span> — automation tools (and Cloudflare-compatible build)</span>
          </li>
        </ul>
      </section>

      <section class="site-credits-section">
        <h2>{{ $t('pages.credits.imagesAndMedia') }}</h2>
        <ul class="site-credits-media-list">
          <li v-for="item in pexelsAttributions" :key="item.href">
            <NTooltip :_tooltipContent="{ side: 'top', sideOffset: 8, align: 'center' }" :_tooltipProvider="{ delayDuration: 300 }">
              <template #default>
                <a :href="item.href" target="_blank" rel="noopener" class="site-credits-media-link">
                  <NuxtImg
                    :src="item.src"
                    width="80"
                    height="80"
                    :alt="item.alt"
                    class="site-credits-media-image"
                  />
                  <span class="sr-only">{{ item.caption }}</span>
                </a>
              </template>
              <template #content>
                <span class="text-xs font-600">{{ item.caption }}</span>
              </template>
            </NTooltip>
          </li>
        </ul>
      </section>

      <section class="site-credits-section site-credits-thank-you">
        <h2>{{ $t('pages.credits.thankYou') }}</h2>
        <p>{{ $t('pages.credits.thankYouText') }}</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
type Attribution = {
  href: string
  src: string
  alt: string
  caption: string
}

const pexelsAttributions: Attribution[] = [
  {
    href: 'https://www.pexels.com/fr-fr/photo/deux-personnes-sur-la-falaise-de-la-montagne-1647962/',
    src: 'https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Valdemaras D. on Pexels',
    caption: 'Photo by Valdemaras D. — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/en-bois-bois-figurine-ligne-7422438/',
    src: 'https://images.pexels.com/photos/7422438/pexels-photo-7422438.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Ann H on Pexels (wood figurine)',
    caption: 'Photo by Ann H — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/mon-plan-secret-pour-diriger-le-livre-du-monde-1765033/',
    src: 'https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Ann H on Pexels (book)',
    caption: 'Photo by Ann H — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/bureau-en-bois-brun-159618/',
    src: 'https://images.pexels.com/photos/159618/still-life-school-retro-ink-159618.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Pixabay on Pexels (desk)',
    caption: 'Photo by Pixabay — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/panneau-de-bienvenue-en-acier-noir-1406282/',
    src: 'https://images.pexels.com/photos/1406282/pexels-photo-1406282.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by H&CO on Pexels (welcome sign)',
    caption: 'Photo by H&CO — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/gros-plan-sur-la-photo-du-jeu-de-societe-monopoly-776654/',
    src: 'https://images.pexels.com/photos/776654/pexels-photo-776654.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Ylanite Koppens',
    caption: 'Photo by Ylanite Koppens — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/brouiller-echecs-strategie-jeu-de-plateau-8780204/',
    src: 'https://images.pexels.com/photos/8780204/pexels-photo-8780204.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Ana-Maria Antonenco',
    caption: 'Photo by Ana-Maria Antonenco — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/nature-morte-profondeur-de-champ-photographie-macro-photo-macro-2993940/',
    src: 'https://images.pexels.com/photos/2993940/pexels-photo-2993940.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Jonathan Robles',
    caption: 'Photo by Jonathan Robles — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/vue-aerienne-du-terrain-de-football-1171084/',
    src: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Mike',
    caption: 'Photo by Mike — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/blocs-lego-vert-rouge-et-jaune-168866/',
    src: 'https://images.pexels.com/photos/168866/pexels-photo-168866.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Markus Spiske',
    caption: 'Photo by Markus Spiske — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/2157805/',
    src: 'https://images.pexels.com/photos/2157805/pexels-photo-2157805.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de byMALENS',
    caption: 'Photo de byMALENS — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/abstrait-de-mur-avec-ornement-geometrique-3695238/',
    src: 'https://images.pexels.com/photos/3695238/pexels-photo-3695238.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Damir Mijailovic',
    caption: 'Photo de Damir Mijailovic — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/creatif-texture-colore-orange-4202952/',
    src: 'https://images.pexels.com/photos/4202952/pexels-photo-4202952.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Karola G',
    caption: 'Photo de Karola G — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/avion-commercial-dans-un-ciel-bleu-clair-33260741/',
    src: 'https://images.pexels.com/photos/33260741/pexels-photo-33260741.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Jr  Satilite',
    caption: 'Photo de Jr  Satilite — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/ecole-de-meduses-sous-l-eau-1683724/',
    src: 'https://images.pexels.com/photos/1683724/pexels-photo-1683724.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Valdemaras D.',
    caption: 'Photo de Valdemaras D. — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/les-gens-au-desert-pendant-la-nuit-1703316/',
    src: 'https://images.pexels.com/photos/1703316/pexels-photo-1703316.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Tomáš Malík',
    caption: 'Photo de Tomáš Malík — Pexels',
  },
]

const { $t } = useI18n()
const config = useRuntimeConfig()

useSeoMeta({
  title: $t('pages.credits.heading'),
  description: $t('pages.credits.description'),
  ogTitle: $t('pages.credits.heading'),
  ogDescription: $t('pages.credits.description'),
  ogUrl: `${config.public.siteUrl}/credits`,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/credits` }],
})
</script>

<style scoped>
@layer components {
  .site-credits {
    padding-block: 60px 80px;
  }

  .site-credits-header {
    width: min(700px, calc(100% - 32px));
    margin-inline: auto;
    text-align: center;
  }

  .site-credits-header h1 {
    margin: 0;
    color: var(--site-color-heading);
    font-size: 20px;
    font-weight: 550;
    line-height: 28px;
  }

  .site-credits-description {
    max-width: 600px;
    margin: 16px auto 0;
    color: var(--site-color-text);
    font-size: 16px;
    line-height: 24px;
  }

  .site-credits-sections {
    width: min(700px, calc(100% - 32px));
    margin: 64px auto 0;
  }

  .site-credits-section {
    min-width: 0;
    padding-block: 28px;
    border-top: 1px solid var(--site-color-border);
  }

  .site-credits-section:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .site-credits-section h2 {
    margin: 0 0 16px;
    color: var(--site-color-heading);
    font-size: 18px;
    font-weight: 550;
    line-height: 25px;
  }

  .site-credits-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 24px;
    margin: 0;
    padding: 0;
    color: var(--site-color-text);
    font-size: 14px;
    line-height: 21px;
    list-style: none;
  }

  .site-credits-list a {
    color: var(--site-color-heading);
    font-weight: 550;
    text-decoration: none;
  }

  .site-credits-list a:hover {
    color: var(--site-color-accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .site-credits-list li > span {
    color: var(--site-color-muted);
  }

  .site-credits-media-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .site-credits-media-link {
    display: block;
    overflow: hidden;
    border: 1px solid var(--site-color-border);
    border-radius: var(--site-radius-control);
  }

  .site-credits-media-image {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: cover;
    transition: transform 180ms ease;
  }

  .site-credits-media-link:hover .site-credits-media-image {
    transform: scale(1.06);
  }

  .site-credits-thank-you p {
    margin: 0;
    color: var(--site-color-text);
    font-size: 16px;
    line-height: 24px;
  }

  @media (max-width: 600px) {
    .site-credits {
      padding-block: 48px 56px;
    }

    .site-credits-sections {
      margin-top: 48px;
    }

    .site-credits-section {
      padding-block: 24px;
    }

    .site-credits-section:first-child {
      padding-top: 0;
    }

    .site-credits-list {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
