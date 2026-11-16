import type { Locale } from './config';

/**
 * Libellés d'interface — la seule exception tolérée par la section 2.1 du brief.
 * Aucun contenu éditorial ici : uniquement de la navigation et des étiquettes.
 */
const DICT = {
  fr: {
    navHome: 'Accueil',
    navProjects: 'Réalisations',
    navLabs: 'Atelier',
    navAbout: 'Profil',
    navContact: 'Contact',

    heroCtaLabs: "Ouvrir l'atelier",
    heroCtaProjects: 'Réalisations',

    latestLabs: "Derniers travaux d'atelier",
    featuredProjects: 'Réalisations mises en avant',
    seeAll: 'Tout voir',
    skills: 'Compétences',
    contactCta: 'Me contacter',

    statLabs: 'comptes rendus publiés',
    statProjects: 'projets livrés',
    statSeries: "séries d'atelier",

    day: 'Jour',
    hours: 'h',
    difficulty: 'difficulté',
    objective: 'Objectif',
    takeaway: "Ce que j'en retiens",
    inSeries: 'Dans la série',
    previousLab: 'Précédent',
    nextLab: 'Suivant',
    progress: 'Progression',

    client: 'Client',
    role: 'Rôle',
    period: 'Période',
    repo: 'Dépôt',
    demo: 'Démo',
    inProduction: 'en production',

    allTags: 'Tous',
    filterByTag: 'Filtrer par tag',
    noResult: 'Aucun résultat.',
    noLabs: 'Aucun compte rendu publié pour le moment.',
    noProjects: 'Aucune réalisation publiée pour le moment.',

    experience: 'Parcours',
    education: 'Formation',
    downloadCv: 'Télécharger le CV',
    present: "aujourd'hui",
    skillHint: 'Cliquez sur une compétence pour en savoir plus.',
    skillClose: 'Fermer',
    skillNoDescription: 'Description à venir.',

    contactTitle: 'Contact',
    contactName: 'Nom',
    contactEmail: 'Adresse e-mail',
    contactSubject: 'Sujet',
    contactBody: 'Message',
    contactSend: 'Envoyer',
    contactSending: 'Envoi…',
    contactSuccess: 'Message envoyé. Je vous réponds rapidement.',
    contactError: "L'envoi a échoué. Réessayez ou écrivez-moi directement.",

    previewBanner: 'Aperçu d’un brouillon — cette page n’est pas publique.',
    notFound: 'Page introuvable',
    backHome: "Retour à l'accueil",
    skipToContent: 'Aller au contenu',
    themeLabel: 'Direction visuelle',
    langLabel: 'Langue',
    publishedOn: 'Publié le',
    updatedOn: 'Mis à jour le',
    views: 'vues',
  },

  en: {
    navHome: 'Home',
    navProjects: 'Work',
    navLabs: 'Lab',
    navAbout: 'Profile',
    navContact: 'Contact',

    heroCtaLabs: 'Open the lab',
    heroCtaProjects: 'Selected work',

    latestLabs: 'Latest lab reports',
    featuredProjects: 'Featured work',
    seeAll: 'See all',
    skills: 'Skills',
    contactCta: 'Get in touch',

    statLabs: 'lab reports published',
    statProjects: 'projects delivered',
    statSeries: 'lab series',

    day: 'Day',
    hours: 'h',
    difficulty: 'difficulty',
    objective: 'Objective',
    takeaway: 'What I took away',
    inSeries: 'In the series',
    previousLab: 'Previous',
    nextLab: 'Next',
    progress: 'Progress',

    client: 'Client',
    role: 'Role',
    period: 'Period',
    repo: 'Repository',
    demo: 'Demo',
    inProduction: 'in production',

    allTags: 'All',
    filterByTag: 'Filter by tag',
    noResult: 'No result.',
    noLabs: 'No lab report published yet.',
    noProjects: 'No work published yet.',

    experience: 'Experience',
    education: 'Education',
    downloadCv: 'Download CV',
    present: 'present',
    skillHint: 'Click a skill to learn more.',
    skillClose: 'Close',
    skillNoDescription: 'Description coming soon.',

    contactTitle: 'Contact',
    contactName: 'Name',
    contactEmail: 'Email address',
    contactSubject: 'Subject',
    contactBody: 'Message',
    contactSend: 'Send',
    contactSending: 'Sending…',
    contactSuccess: 'Message sent. I will get back to you shortly.',
    contactError: 'Sending failed. Try again or email me directly.',

    previewBanner: 'Draft preview — this page is not public.',
    notFound: 'Page not found',
    backHome: 'Back to home',
    skipToContent: 'Skip to content',
    themeLabel: 'Visual direction',
    langLabel: 'Language',
    publishedOn: 'Published on',
    updatedOn: 'Updated on',
    views: 'views',
  },
} as const;

export type DictKey = keyof (typeof DICT)['fr'];

export function t(locale: Locale, key: DictKey): string {
  return DICT[locale][key];
}
