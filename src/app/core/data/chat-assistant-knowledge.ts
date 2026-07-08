import { RoleType } from '../models/models';

export interface ChatSuggestion {
  label: string;
  query: string;
}

export interface ChatKnowledgeEntry {
  keywords: string[];
  answer: string;
  /** public = portail, app = dashboard, both = les deux */
  scope: 'public' | 'app' | 'both';
  roles?: RoleType[];
}

export const CHAT_WELCOME = {
  public: `Bonjour ! Je suis l'assistant Tontine Marché. Je peux vous expliquer le fonctionnement de la tontine, l'inscription collecteur ou vous orienter vers la connexion.`,
  app: `Bonjour ! Je suis votre assistant sur la plateforme. Posez-moi une question sur vos clients, collectes, restitutions ou votre rôle.`
};

export const CHAT_SUGGESTIONS: Record<'public' | 'app', ChatSuggestion[]> = {
  public: [
    { label: 'Comment ça marche ?', query: 'Comment fonctionne la tontine ?' },
    { label: 'Devenir collecteur', query: 'Comment devenir collecteur ?' },
    { label: 'Se connecter', query: 'Comment me connecter ?' },
    { label: 'Contact', query: 'Comment vous contacter ?' }
  ],
  app: [
    { label: 'Créer un client', query: 'Comment créer un client ?' },
    { label: 'Faire une collecte', query: 'Comment enregistrer une collecte ?' },
    { label: 'Carte client', query: 'Comment générer la carte client ?' },
    { label: 'Restitution', query: 'Comment faire une restitution ?' }
  ]
};

export const CHAT_ROLE_SUGGESTIONS: Partial<Record<RoleType, ChatSuggestion[]>> = {
  SUPER_ADMIN: [
    { label: 'Demandes inscription', query: 'Valider une demande d\'inscription' },
    { label: 'Agences', query: 'Gérer les agences' }
  ],
  ADMIN_AGENCE: [
    { label: 'Agents', query: 'Gérer les agents collecteurs' },
    { label: 'Commission', query: 'Comment fonctionne la commission ?' }
  ],
  AGENT: [
    { label: 'Scanner QR', query: 'Scanner le QR code client' },
    { label: 'Mon portefeuille', query: 'Voir mon portefeuille clients' }
  ],
  CAISSIER: [
    { label: 'Caisse', query: 'Ouvrir et clôturer la caisse' },
    { label: 'Initier restitution', query: 'Initier une restitution' }
  ]
};

export const CHAT_KNOWLEDGE: ChatKnowledgeEntry[] = [
  {
    scope: 'both',
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou'],
    answer: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ? Choisissez une suggestion ci-dessous ou posez votre question.'
  },
  {
    scope: 'both',
    keywords: ['merci', 'thanks'],
    answer: 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.'
  },
  {
    scope: 'public',
    keywords: ['tontine', 'fonctionne', 'comment ça marche', 'principe', 'épargne'],
    answer: 'Tontine Marché permet aux commerçants de marché d\'épargner quotidiennement via un agent collecteur. Chaque jour, le client verse un montant fixe ; à la fin du cycle, il récupère son épargne (moins la commission de l\'agence). La plateforme digitalise les collectes, les signatures et le suivi.'
  },
  {
    scope: 'public',
    keywords: ['collecteur', 'devenir', 'inscription', 'inscrire', 'agence', 'adhérer'],
    answer: 'Pour devenir collecteur / créer une agence : allez sur « Devenez collecteur », remplissez le formulaire (agence, identité, paiement), validez votre e-mail par OTP. Votre demande sera examinée par l\'administrateur. Vous recevrez un e-mail d\'approbation ou de refus.'
  },
  {
    scope: 'public',
    keywords: ['connexion', 'connecter', 'login', 'identifiant', 'mot de passe', 'compte'],
    answer: 'Cliquez sur « Connexion » en haut du site. Utilisez l\'identifiant et le mot de passe fournis après validation de votre demande. En cas d\'oubli, utilisez « Mot de passe oublié » sur la page de connexion.'
  },
  {
    scope: 'public',
    keywords: ['contact', 'téléphone', 'email', 'mail', 'joindre', 'support'],
    answer: 'Consultez la page Contact ou les coordonnées en haut du site (téléphone, e-mail). Vous pouvez aussi nous écrire via le formulaire de contact.'
  },
  {
    scope: 'public',
    keywords: ['commission', 'frais', 'coût', 'tarif'],
    answer: 'La commission de l\'agence est calculée selon une grille définie par agence, généralement à la restitution de l\'épargne. Le montant exact dépend du solde collecté et des tranches configurées.'
  },
  {
    scope: 'public',
    keywords: ['otp', 'vérification', 'email', 'code'],
    answer: 'Lors de l\'inscription collecteur, un code OTP est envoyé à votre e-mail pour vérifier votre adresse. Saisissez-le dans le formulaire avant de soumettre la demande.'
  },
  {
    scope: 'app',
    keywords: ['client', 'créer', 'nouveau client', 'ajouter client'],
    answer: 'Menu **Clients** → **Nouveau client**. Renseignez le marché, l\'agent collecteur, l\'identité et le montant journalier. À l\'enregistrement, une carte d\'adhésion avec QR code est générée.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT']
  },
  {
    scope: 'app',
    keywords: ['carte', 'qr', 'imprimer', 'cartes'],
    answer: 'Sur la liste **Clients**, cliquez **Carte** pour un client, ou cochez plusieurs clients puis **Générer les cartes** pour imprimer en lot. La carte contient les infos agence, client, agent et le QR code.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER']
  },
  {
    scope: 'app',
    keywords: ['collecte', 'collecter', 'enregistrer', 'signature', 'portefeuille'],
    answer: 'Menu **Collectes** → mode Assistant. Sélectionnez un client ou **Scanner QR** sur sa carte. Saisissez les jours ou le montant, puis faites signer le client. Un reçu est généré et le solde est mis à jour.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT']
  },
  {
    scope: 'app',
    keywords: ['scanner', 'qr code', 'scan'],
    answer: 'Dans **Collectes**, bouton **Scanner QR**. Cadrez le QR code de la carte client : le formulaire de collecte s\'ouvre automatiquement pour ce client.',
    roles: ['AGENT', 'ADMIN_AGENCE']
  },
  {
    scope: 'app',
    keywords: ['restitution', 'restituer', 'retrait', 'solde'],
    answer: 'Le **caissier** initie la restitution (menu Restitutions). L\'**agent collecteur** valide la commission (modifiable, y compris 0), puis fait signer le client. Le solde passe à 0 et la caisse est débitée.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER', 'AGENT']
  },
  {
    scope: 'app',
    keywords: ['commission', 'grille', 'tranche'],
    answer: 'La commission est estimée sur la liste clients et calculée à la restitution selon la grille de l\'agence. L\'agent peut ajuster le montant proposé avant signature du client.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT']
  },
  {
    scope: 'app',
    keywords: ['caisse', 'ouvrir', 'clôturer', 'cloturer', 'solde'],
    answer: 'Menu **Caisse** : ouvrez la caisse du jour avec le solde initial, enregistrez les mouvements (collectes, restitutions, opérations), puis clôturez en fin de journée avec le solde réel.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER']
  },
  {
    scope: 'app',
    keywords: ['demande', 'inscription', 'approuver', 'rejeter', 'valider'],
    answer: 'Menu **Demandes inscription** (super admin). Consultez les demandes en attente, vérifiez le paiement et la pièce d\'identité, puis **Approuver** (crée l\'agence + compte admin) ou **Rejeter** avec motif. Un e-mail est envoyé au demandeur.',
    roles: ['SUPER_ADMIN']
  },
  {
    scope: 'app',
    keywords: ['agent', 'agents', 'collecteur', 'transférer'],
    answer: 'Menu **Agents** pour créer ou gérer les collecteurs. Sur **Clients**, un admin peut **Transférer** un client vers un autre agent.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE']
  },
  {
    scope: 'app',
    keywords: ['marché', 'marche', 'marchés'],
    answer: 'Menu **Marchés** : créez et localisez les marchés sur la carte. Les clients et agents y sont rattachés.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT']
  },
  {
    scope: 'app',
    keywords: ['désactiver', 'supprimer', 'modifier', 'historique', 'client'],
    answer: 'Sur **Clients**, vous pouvez modifier, désactiver ou supprimer un client (suppression impossible si solde > 0). L\'**Historique** conserve toutes les modifications.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT']
  },
  {
    scope: 'app',
    keywords: ['rapport', 'statistique', 'dashboard', 'tableau'],
    answer: 'Le **Dashboard** résume l\'activité (clients, collectes, soldes). **Rapports** permet d\'exporter et d\'analyser les données de l\'agence.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER', 'AGENT', 'AUDITEUR']
  },
  {
    scope: 'app',
    keywords: ['profil', 'mot de passe', 'password'],
    answer: 'Menu **Mon profil** : modifiez vos informations et changez votre mot de passe.',
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER', 'AUDITEUR']
  },
  {
    scope: 'both',
    keywords: ['aide', 'help', 'assistance', 'problème', 'bug', 'erreur'],
    answer: 'Décrivez précisément votre question (ex. « créer un client », « restitution », « connexion »). Si le problème persiste, contactez le support via la page Contact ou votre administrateur d\'agence.'
  }
];
