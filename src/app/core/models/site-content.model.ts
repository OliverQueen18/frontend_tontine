export interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
  bg: string;
  color: string;
}

export interface StepItem {
  num: string;
  icon: string;
  title: string;
  desc: string;
  bg: string;
  color: string;
}

export interface LayoutContent {
  phone: string;
  email: string;
  socialLabel: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  youtube: string;
  brandName: string;
  brandTagline: string;
  brandIconUrl: string;
  footerLogoUrl: string;
  footerDescription: string;
  footerAddress: string;
  footerCopyright: string;
  loginButtonLabel: string;
  contactButtonLabel: string;
  collecteurRoute: string;
}

export interface HeroContent {
  highlightGreen: string;
  highlightOrange: string;
  highlightRed: string;
  headlineMiddle: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryRoute: string;
  ctaSecondaryLabel: string;
  ctaSecondaryRoute: string;
  avatars: string[];
  socialProofPrefix: string;
  socialProofCount: string;
  socialProofSuffix: string;
  txTitle: string;
  txAmount: string;
  txStatus: string;
  txTime: string;
  backgroundImageUrl: string;
  personImageUrl: string;
}

export interface FeaturesContent {
  items: FeatureItem[];
}

export interface AboutContent {
  label: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  ctaLabel: string;
  ctaRoute: string;
  badgeCount: string;
  badgeLabel: string;
  imageUrl: string;
}

export interface StepsContent {
  label: string;
  title: string;
  items: StepItem[];
}

export interface CtaContent {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonRoute: string;
}

export interface CollecteurPromoItem {
  icon: string;
  title: string;
  text: string;
  bg: string;
  color: string;
}

export interface CollecteurConductItem {
  title: string;
  text: string;
}

export interface CollecteurContent {
  title: string;
  subtitle: string;
  formTitle: string;
  formSubtitle: string;
  conditionsUtilisation: string;
  promos: CollecteurPromoItem[];
  conduct: CollecteurConductItem[];
}

export interface SiteContentMap {
  layout: LayoutContent;
  hero: HeroContent;
  features: FeaturesContent;
  about: AboutContent;
  steps: StepsContent;
  cta: CtaContent;
  collecteur: CollecteurContent;
}

export interface SiteSectionDto {
  id: number;
  sectionKey: string;
  label: string;
  locale: string;
  content: Record<string, unknown>;
  updatedAt: string;
}

export const DEFAULT_SITE_CONTENT: SiteContentMap = {
  layout: {
    phone: '+223 70 12 34 56',
    email: 'contact@tontinemarche.ml',
    socialLabel: 'Suivez-nous :',
    facebook: '#',
    instagram: '#',
    whatsapp: '#',
    youtube: '#',
    brandName: 'Tontine Marché',
    brandTagline: 'Épargnez, réalisez, prospérez',
    brandIconUrl: 'icone-tontine-marche.png',
    footerLogoUrl: 'logo-tontine-marche.png',
    footerDescription: "La tontine réinventée pour les commerçants et travailleurs indépendants d'Afrique de l'Ouest.",
    footerAddress: 'Bamako, Mali',
    footerCopyright: '© 2026 Tontine Marché — Tous droits réservés',
    loginButtonLabel: 'Espace Collecteur',
    contactButtonLabel: 'Devenez Collecteur',
    collecteurRoute: '/devenez-collecteur',
  },
  hero: {
    highlightGreen: 'Épargnez',
    highlightOrange: 'réalisez',
    highlightRed: 'demain',
    headlineMiddle: "aujourd'hui, vos projets",
    subtitle: 'Tontine Marché est la solution digitale sécurisée qui modernise la tontine traditionnelle. Épargnez au quotidien, suivez vos versements en temps réel et récupérez votre épargne en toute confiance.',
    ctaPrimaryLabel: 'Commencer à épargner',
    ctaPrimaryRoute: '/connexion',
    ctaSecondaryLabel: 'Découvrir la plateforme',
    ctaSecondaryRoute: '/fonctionnalites',
    avatars: ['A', 'F', 'M', 'S'],
    socialProofPrefix: 'Rejoignez déjà plus de',
    socialProofCount: '5 000',
    socialProofSuffix: 'personnes qui nous font confiance',
    txTitle: 'Épargne du jour',
    txAmount: '1 000 FCFA',
    txStatus: 'Collecte réussie',
    txTime: "Aujourd'hui à 08:45",
    backgroundImageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649329?w=1600&q=80',
    personImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  },
  features: {
    items: [
      { icon: 'pi pi-shield', title: 'Sécurisé', desc: 'Vos données et votre épargne protégées', bg: '#dcfce7', color: '#166534' },
      { icon: 'pi pi-clock', title: 'Accessible', desc: 'Disponible 24h/24, 7j/7', bg: '#ffedd5', color: '#c2410c' },
      { icon: 'pi pi-chart-bar', title: 'Transparent', desc: 'Suivi en temps réel de vos versements', bg: '#dcfce7', color: '#166534' },
      { icon: 'pi pi-wallet', title: 'Flexible', desc: 'Montants adaptés à votre rythme', bg: '#fee2e2', color: '#b91c1c' },
      { icon: 'pi pi-headphones', title: 'Accompagnement', desc: 'Une équipe à votre écoute', bg: '#dcfce7', color: '#166534' },
    ],
  },
  about: {
    label: 'À PROPOS DE NOUS',
    title: 'La tontine réinventée pour vous',
    paragraph1: "Depuis des générations, la tontine est le pilier de l'épargne en Afrique de l'Ouest. Tontine Marché modernise cette tradition en offrant une plateforme digitale sécurisée, transparente et accessible à tous les commerçants et travailleurs indépendants.",
    paragraph2: 'Fini les carnets papier, les erreurs de calcul et les pertes de traçabilité. Avec Tontine Marché, chaque versement est enregistré, signé et suivi en temps réel.',
    ctaLabel: 'En savoir plus',
    ctaRoute: '/a-propos',
    badgeCount: '+5 000',
    badgeLabel: 'Utilisateurs satisfaits',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  },
  steps: {
    label: 'COMMENT ÇA MARCHE',
    title: "Épargner n'a jamais été aussi simple",
    items: [
      { num: '01', icon: 'pi pi-user-plus', title: 'Inscription', desc: 'Créez votre compte en quelques minutes', bg: '#dcfce7', color: '#166534' },
      { num: '02', icon: 'pi pi-wallet', title: 'Épargne quotidienne', desc: 'Versez votre montant quotidiennement', bg: '#ffedd5', color: '#c2410c' },
      { num: '03', icon: 'pi pi-calendar', title: 'Suivi en temps réel', desc: 'Consultez vos versements et votre progression', bg: '#dcfce7', color: '#166534' },
      { num: '04', icon: 'pi pi-gift', title: 'Recevez votre épargne', desc: 'Récupérez votre épargne à la date convenue', bg: '#fee2e2', color: '#b91c1c' },
    ],
  },
  cta: {
    title: 'Prêt à commencer votre épargne ?',
    subtitle: 'Rejoignez Tontine Marché et prenez le contrôle de vos finances dès aujourd\'hui.',
    buttonLabel: 'Créer mon compte',
    buttonRoute: '/connexion',
  },
  collecteur: {
    title: 'Rejoignez le réseau Tontine Marché',
    subtitle: 'Créez votre agence de collecte et accompagnez vos clients vers une épargne sécurisée.',
    formTitle: 'Créer mon agence',
    formSubtitle: 'Renseignez les informations de votre agence et de l\'administrateur.',
    conditionsUtilisation: `En soumettant cette demande, vous acceptez les conditions suivantes :

1. Vous vous engagez à respecter la réglementation locale en matière de collecte d'épargne.
2. Les fonds collectés appartiennent aux clients et doivent être restitués selon les règles de la plateforme.
3. Tontine Marché se réserve le droit de valider ou refuser toute demande d'inscription.
4. Les frais de création d'agence ne sont pas remboursables après validation.
5. Vous garantissez l'exactitude des informations et documents fournis.`,
    promos: [
      { icon: 'pi pi-chart-line', title: 'Développez votre activité', text: 'Gérez vos collecteurs, suivez les versements et fidélisez vos clients commerçants.', bg: '#dcfce7', color: '#166534' },
      { icon: 'pi pi-shield', title: 'Plateforme sécurisée', text: 'Chaque opération est tracée, signée et archivée pour une transparence totale.', bg: '#ffedd5', color: '#c2410c' },
      { icon: 'pi pi-users', title: 'Réseau de confiance', text: 'Rejoignez des centaines d\'agences qui modernisent la tontine en Afrique de l\'Ouest.', bg: '#fee2e2', color: '#b91c1c' },
    ],
    conduct: [
      { title: 'Intégrité', text: 'Ne détournez jamais les fonds collectés. Chaque franc doit être tracé.' },
      { title: 'Respect du client', text: 'Traitez chaque commerçant avec courtoisie et professionnalisme.' },
      { title: 'Ponctualité', text: 'Effectuez vos collectes aux horaires convenus avec vos clients.' },
      { title: 'Confidentialité', text: 'Protégez les données personnelles et financières de vos clients.' },
      { title: 'Transparence', text: 'Remettez un reçu à chaque versement et expliquez clairement les commissions.' },
    ],
  },
};

export const CMS_SECTIONS = [
  { key: 'layout', label: 'En-tête & Pied de page', icon: 'pi pi-window-maximize' },
  { key: 'hero', label: 'Section Hero', icon: 'pi pi-image' },
  { key: 'features', label: 'Barre avantages', icon: 'pi pi-star' },
  { key: 'about', label: 'À propos', icon: 'pi pi-info-circle' },
  { key: 'steps', label: 'Comment ça marche', icon: 'pi pi-list' },
  { key: 'cta', label: 'Appel à l\'action', icon: 'pi pi-megaphone' },
  { key: 'collecteur', label: 'Devenez collecteur', icon: 'pi pi-user-plus' },
] as const;

export type SectionKey = typeof CMS_SECTIONS[number]['key'];
