export type SupportedContentLocale = 'fr' | 'en'

export type LocalizedText = Record<SupportedContentLocale, string>

export type RecommendationItem = {
  id: string
  name: LocalizedText
  description: LocalizedText
  href: string
  icon: string
}

export type RecommendationsContent = {
  fr: { title: string; description: string }
  en: { title: string; description: string }
  items: RecommendationItem[]
}

export type AboutFaqItem = {
  id: string
  question: LocalizedText
  answer: LocalizedText
}

export type AboutPageContent = {
  fr: {
    heading: string
    mainTitle: string
    intro: string
    description: string
    openSourceHeading: string
    openSourceText: string
    faqHeading: string
    faq: AboutFaqItem[]
    contactHeading: string
    contactText: string
  }
  en: {
    heading: string
    mainTitle: string
    intro: string
    description: string
    openSourceHeading: string
    openSourceText: string
    faqHeading: string
    faq: AboutFaqItem[]
    contactHeading: string
    contactText: string
  }
}

export const DEFAULT_RECOMMENDATIONS_CONTENT: RecommendationsContent = {
  fr: {
    title: 'Recommandations',
    description: 'Une sélection personnelle de studios, de publications, d’outils et de personnes à qui je reviens souvent. Ces références nourrissent ma pratique et ouvrent de nouvelles perspectives.',
  },
  en: {
    title: 'Recommendations',
    description: 'A personal selection of studios, publications, tools, and thinkers I return to often. These are the references that continue to inform my practice and point my attention forward.',
  },
  items: [
    {
      id: 'github',
      name: { fr: 'GitHub', en: 'GitHub' },
      description: { fr: 'Dépôt de code', en: 'Code Repository' },
      href: 'https://github.com/',
      icon: 'https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg',
    },
    {
      id: 'prime-direction',
      name: { fr: 'Prime Direction', en: 'Prime Direction' },
      description: { fr: 'Thèmes Ghost premium', en: 'Premium Ghost Themes' },
      href: 'https://primedirection.org/',
      icon: 'https://primedirection.org/favicon.png',
    },
    {
      id: 'figma',
      name: { fr: 'Figma', en: 'Figma' },
      description: { fr: 'Outil de conception', en: 'Design Tool' },
      href: 'https://figma.com/',
      icon: 'https://static.figma.com/app/icon/2/touch-180.png',
    },
  ],
}

export const DEFAULT_ABOUT_PAGE_CONTENT: AboutPageContent = {
  en: {
    heading: 'About',
    mainTitle: 'A small collection of writing — on code, craft, and culture.',
    intro: "I'm Jérémie Corpinot — the sole developer and writer of this site. I build the platform and write the posts, focusing on technical depth and cultural perspective.",
    description: 'This space is intentionally small — fewer, better pieces. Expect practical guides, essays, and recommendations that bridge engineering and the arts.',
    openSourceHeading: 'Open Source & Contribution',
    openSourceText: 'The full source code is available on GitHub. Issues, PRs, or design suggestions are welcome — see the repository for contribution guidelines.',
    faqHeading: 'FAQ',
    faq: [
      { id: 'who', question: { fr: 'Qui gère ce site ?', en: 'Who runs this site?' }, answer: { fr: 'Moi — je suis le seul développeur et écrivain : Jérémie Corpinot. Je gère le code, la publication et le design du site.', en: "I do — I'm the sole developer and writer: Jérémie Corpinot. I handle code, publishing, and site design." } },
      { id: 'topics', question: { fr: 'De quoi parlez-vous ?', en: 'What topics do you write about?' }, answer: { fr: "Principalement de technologie, de développement et de programmation. J'écris aussi sur l'art et la culture — films, livres et podcasts qui influencent ma pensée.", en: 'Mostly technology, development and programming. I also write about art and culture — films, books, and podcasts that influence my thinking.' } },
      { id: 'open-source', question: { fr: 'Le projet est-il open source ?', en: 'Is the project open source?' }, answer: { fr: 'Oui — le projet est open source sur GitHub : github.com/rootasjey/corpinot', en: 'Yes — the project is open source on GitHub: github.com/rootasjey/corpinot' } },
      { id: 'contribute', question: { fr: 'Puis-je contribuer ou proposer un article ?', en: 'Can I contribute or pitch a post?' }, answer: { fr: 'Oui. Ouvrez une issue GitHub ou envoyez un pitch à hello@corpinot.cc. Je suis particulièrement intéressé par des pièces pratiques et basées sur l’expérience.', en: "Yes. Open a GitHub issue or send a short pitch to hello@corpinot.cc. I'm particularly interested in practical, experience-driven pieces." } },
      { id: 'newsletter', question: { fr: 'Y a-t-il une newsletter ?', en: 'Is there a newsletter?' }, answer: { fr: 'Oui — abonnez-vous pour des points forts hebdomadaires et des plongeons occasionnels en profondeur.', en: 'Yes — subscribe for weekly highlights and occasional deep dives.' } },
    ],
    contactHeading: 'Get in touch',
    contactText: 'Questions, pitches, or bugs? Email hello@corpinot.cc',
  },
  fr: {
    heading: 'À propos',
    mainTitle: "Une petite collection d'écrits — sur le code, l'artisanat et la culture.",
    intro: "Je suis Jérémie Corpinot — le développeur et écrivain unique de ce site. Je construis la plateforme et écris les articles, en mettant l'accent sur la profondeur technique et la perspective culturelle.",
    description: "Cet espace est intentionnellement petit — moins d'articles, mais de meilleure qualité. Attendez-vous à des guides pratiques, des essais et des recommandations qui font le pont entre l'ingénierie et les arts.",
    openSourceHeading: 'Open Source & Contribution',
    openSourceText: 'Le code source complet est disponible sur GitHub. Les issues, PRs ou suggestions de design sont les bienvenues — consultez le dépôt pour les directives de contribution.',
    faqHeading: 'FAQ',
    faq: [
      { id: 'who', question: { fr: 'Qui gère ce site ?', en: 'Who runs this site?' }, answer: { fr: 'Moi — je suis le seul développeur et écrivain : Jérémie Corpinot. Je gère le code, la publication et le design du site.', en: "I do — I'm the sole developer and writer: Jérémie Corpinot. I handle code, publishing, and site design." } },
      { id: 'topics', question: { fr: 'De quoi parlez-vous ?', en: 'What topics do you write about?' }, answer: { fr: "Principalement de technologie, de développement et de programmation. J'écris aussi sur l'art et la culture — films, livres et podcasts qui influencent ma pensée.", en: 'Mostly technology, development and programming. I also write about art and culture — films, books, and podcasts that influence my thinking.' } },
      { id: 'open-source', question: { fr: 'Le projet est-il open source ?', en: 'Is the project open source?' }, answer: { fr: 'Oui — le projet est open source sur GitHub : github.com/rootasjey/corpinot', en: 'Yes — the project is open source on GitHub: github.com/rootasjey/corpinot' } },
      { id: 'contribute', question: { fr: 'Puis-je contribuer ou proposer un article ?', en: 'Can I contribute or pitch a post?' }, answer: { fr: 'Oui. Ouvrez une issue GitHub ou envoyez un pitch à hello@corpinot.cc. Je suis particulièrement intéressé par des pièces pratiques et basées sur l’expérience.', en: "Yes. Open a GitHub issue or send a short pitch to hello@corpinot.cc. I'm particularly interested in practical, experience-driven pieces." } },
      { id: 'newsletter', question: { fr: 'Y a-t-il une newsletter ?', en: 'Is there a newsletter?' }, answer: { fr: 'Oui — abonnez-vous pour des points forts hebdomadaires et des plongeons occasionnels en profondeur.', en: 'Yes — subscribe for weekly highlights and occasional deep dives.' } },
    ],
    contactHeading: 'Contact',
    contactText: 'Questions, propositions ou bugs ? Écrivez à hello@corpinot.cc',
  },
}
