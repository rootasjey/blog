export type HomeIdentity = {
  avatar: string
  fr: { name: string; description: string }
  en: { name: string; description: string }
}

export const DEFAULT_HOME_IDENTITY: HomeIdentity = {
  avatar: '/images/presentation/jc-pp.jpg',
  fr: {
    name: 'Jérémie Corpinot',
    description: "Je suis un développeur français féru de connaissances, et explorant des sentiers peu tracés. J'ai passé beaucoup de temps à bosser sur verbatims et zimablue. Et j'ai 4 autres projets dans la pipeline.\n\nJ'ai travaillé chez Dassault Systèmes, Servier, Fabernovel ; aujourd'hui j'explore ma propre voix.\n\nTombé dans le code depuis petit, je parle ici de mes expérimentations, échecs, les leçons apprises ; mais aussi les œuvres artistiques qui m'ont marqué.\n\nBonne visite, et merci de me lire.",
  },
  en: {
    name: 'Jérémie Corpinot',
    description: "I'm a French developer with a deep appetite for learning, exploring paths less traveled. I've spent a lot of time working on Verbatims and Zimablue, and I have four more projects in the pipeline.\n\nI've worked at Dassault Systèmes, Servier, and Fabernovel. Today, I'm exploring my own voice.\n\nI've been coding since I was a kid. Here, I share my experiments, failures, and lessons learned, as well as the works of art that have left a mark on me.\n\nEnjoy your visit, and thanks for reading.",
  },
}
