export interface TourStep {
  title: string;
  text: string;
  icon?: string;
  /** CSS selector of the element to highlight. If omitted, the step is centered. */
  target?: string;
}

/**
 * Étapes du didacticiel guidé.
 * Les étapes dont la cible (`target`) n'existe pas pour le rôle courant
 * sont automatiquement ignorées (les entrées de menu sont filtrées par rôle).
 */
export const TOUR_STEPS: Record<string, TourStep[]> = {
  public: [
    {
      title: 'Bienvenue sur Tontine Marché',
      text: "Découvrez en quelques secondes comment utiliser le site. Vous pouvez passer ce guide à tout moment.",
      icon: 'pi pi-sparkles',
    },
    {
      title: 'La marque',
      text: "Cliquez sur le logo à tout moment pour revenir à l'accueil.",
      icon: 'pi pi-home',
      target: '[data-tour="public-brand"]',
    },
    {
      title: 'Navigation',
      text: "Parcourez le site : Accueil, Fonctionnalités, Avantages, Comment ça marche et Contact.",
      icon: 'pi pi-compass',
      target: '[data-tour="public-nav"]',
    },
    {
      title: 'Devenir collecteur',
      text: "Vous représentez une agence ? Déposez votre demande d'adhésion en un clic pour rejoindre la plateforme.",
      icon: 'pi pi-user-plus',
      target: '[data-tour="public-collecteur"]',
    },
    {
      title: 'Se connecter',
      text: "Déjà membre ? Connectez-vous ici pour accéder à votre espace de gestion.",
      icon: 'pi pi-user',
      target: '[data-tour="public-login"]',
    },
    {
      title: 'Besoin d\'aide ?',
      text: "L'assistant répond à vos questions sur la plateforme, l'épargne et l'adhésion, à tout moment.",
      icon: 'pi pi-comments',
      target: '[data-tour="assistant"]',
    },
    {
      title: 'À vous de jouer !',
      text: "Explorez le site et n'hésitez pas à nous contacter. Bienvenue chez Tontine Marché !",
      icon: 'pi pi-check-circle',
    },
  ],
  app: [
    {
      title: 'Bienvenue sur Tontine Marché',
      text: "Ce guide rapide vous montre comment utiliser la plateforme de façon efficace. Vous pouvez naviguer avec Suivant / Précédent, ou quitter à tout moment.",
      icon: 'pi pi-sparkles',
    },
    {
      title: 'Menu de navigation',
      text: "Tous les modules de gestion sont accessibles depuis ce menu latéral. Le contenu s'adapte à votre rôle.",
      icon: 'pi pi-bars',
      target: '[data-tour="sidebar"]',
    },
    {
      title: 'Tableau de bord',
      text: "Retrouvez ici une vue d'ensemble de l'activité : épargne collectée, restitutions, clients actifs et indicateurs clés.",
      icon: 'pi pi-home',
      target: '[data-tour="/app/dashboard"]',
    },
    {
      title: 'Agences',
      text: 'Créez et administrez les agences, suivez leurs performances et gérez leurs paramètres.',
      icon: 'pi pi-building',
      target: '[data-tour="/app/agences"]',
    },
    {
      title: 'Marchés',
      text: 'Organisez vos marchés et zones de collecte pour rattacher facilement les clients et les agents.',
      icon: 'pi pi-map-marker',
      target: '[data-tour="/app/marches"]',
    },
    {
      title: 'Clients',
      text: "Enregistrez et gérez vos clients, consultez leur historique et générez leurs cartes avec QR code (individuellement ou en lot).",
      icon: 'pi pi-id-card',
      target: '[data-tour="/app/clients"]',
    },
    {
      title: 'Collectes',
      text: "Enregistrez les cotisations journalières. Astuce : scannez le QR code de la carte du client pour ouvrir directement son formulaire de collecte.",
      icon: 'pi pi-wallet',
      target: '[data-tour="/app/collectes"]',
    },
    {
      title: 'Restitutions',
      text: "Restituez l'épargne au client. La commission de l'agence est calculée automatiquement et reste modifiable par l'agent avant validation.",
      icon: 'pi pi-money-bill',
      target: '[data-tour="/app/restitutions"]',
    },
    {
      title: 'Caisse',
      text: 'Suivez les entrées et sorties de caisse pour garder une trésorerie fiable et à jour.',
      icon: 'pi pi-inbox',
      target: '[data-tour="/app/caisse"]',
    },
    {
      title: 'Rapports',
      text: "Analysez l'activité et exportez vos données pour le suivi et la prise de décision.",
      icon: 'pi pi-chart-bar',
      target: '[data-tour="/app/rapports"]',
    },
    {
      title: 'Réduire le menu',
      text: "Ce bouton réduit ou déploie le menu latéral pour gagner de l'espace à l'écran.",
      icon: 'pi pi-bars',
      target: '[data-tour="topbar-toggle"]',
    },
    {
      title: 'Votre profil',
      text: 'Accédez à votre profil, vos informations et à la déconnexion depuis le coin supérieur droit.',
      icon: 'pi pi-user',
      target: '[data-tour="topbar-user"]',
    },
    {
      title: 'Assistant intelligent',
      text: "Une question ? L'assistant vous aide à tout moment avec des réponses adaptées à votre rôle.",
      icon: 'pi pi-comments',
      target: '[data-tour="assistant"]',
    },
    {
      title: 'Revoir ce guide',
      text: 'Vous pourrez relancer ce didacticiel quand vous le souhaitez en cliquant sur ce bouton d\'aide.',
      icon: 'pi pi-question-circle',
      target: '[data-tour="tour-help"]',
    },
    {
      title: 'Vous êtes prêt !',
      text: "Vous connaissez maintenant l'essentiel. Explorez la plateforme et laissez-vous guider par l'assistant si besoin. Bonne collecte !",
      icon: 'pi pi-check-circle',
    },
  ],
};
