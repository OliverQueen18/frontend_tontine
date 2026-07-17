export type RoleType = 'SUPER_ADMIN' | 'ADMIN_AGENCE' | 'AGENT' | 'CAISSIER' | 'AUDITEUR';
export type StatutEntity = 'ACTIF' | 'INACTIF' | 'SUSPENDU';
export type StatutCaisse = 'OUVERTE' | 'CLOTUREE';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  id: number;
  username: string;
  nomComplet: string;
  role: RoleType;
  agenceId: number | null;
  agenceNom: string | null;
  mustChangePassword?: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  nomComplet: string;
  email?: string | null;
  telephone?: string | null;
  photoUrl?: string | null;
  role: RoleType;
  agenceId: number | null;
  agenceNom: string | null;
}

export interface UpdateProfilePayload {
  nomComplet: string;
  email?: string;
  telephone?: string;
  photoUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Agence {
  id?: number;
  code?: string;
  nom: string;
  responsable?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  logoUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  tauxCommission?: number;
  tauxCommissionAdmin?: number;
  statut?: StatutEntity;
}

export type MoyenPaiementMobile = 'ORANGE_MONEY' | 'WAVE';

export interface InscriptionCollecteurConfig {
  fraisCreationAgence: number;
  telephonePaiementMobile: string;
  conditionsUtilisation: string;
}

export interface DemandeInscriptionAgence {
  id?: number;
  agenceNom: string;
  responsable?: string;
  agenceTelephone?: string;
  agenceEmail?: string;
  adresse?: string;
  ville?: string;
  logoUrl?: string;
  username: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  pieceIdentiteUrl: string;
  moyenPaiement: MoyenPaiementMobile;
  referencePaiement: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
  motifRejet?: string;
  agenceCreeeId?: number;
  createdAt?: string;
  dateTraitement?: string;
}

export interface PlatformSettings {
  fraisCreationAgence: number;
  telephonePaiementMobile: string;
  tauxCommissionAdminDefaut?: number;
}

export interface GrilleCommissionLigne {
  id?: number;
  montantMin: number;
  montantMax?: number | null;
  montantCommission: number;
  ordre?: number;
}

export type SensOperation = 'ENTREE' | 'SORTIE';

export interface CategorieDepense {
  id?: number;
  nom: string;
  sens?: SensOperation;
  necessiteMouvementCaisse?: boolean;
  necessiteClient?: boolean;
  agenceId?: number;
  statut?: StatutEntity;
}

export interface Agent {
  id?: number;
  code?: string;
  nomComplet: string;
  telephone?: string;
  photoUrl?: string;
  agenceId: number;
  agenceNom?: string;
  marcheId?: number;
  marcheNom?: string;
  marcheIds?: number[];
  marcheNoms?: string[];
  username?: string;
  utilisateurId?: number;
  password?: string;
  nombreClients?: number;
  montantCollecteAujourdhui?: number;
  statut?: StatutEntity;
}

export interface Marche {
  id?: number;
  nom: string;
  code?: string;
  description?: string;
  adresse?: string;
  latitude?: number | null;
  longitude?: number | null;
  agenceId?: number;
  agenceNom?: string;
  statut?: StatutEntity;
}

export interface MarcheFormData {
  nom: string;
  code: string;
  description: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

export function emptyMarcheForm(): MarcheFormData {
  return {
    nom: '',
    code: '',
    description: '',
    adresse: '',
    latitude: null,
    longitude: null
  };
}

export interface Client {
  id?: number;
  code?: string;
  nomComplet: string;
  telephone?: string;
  email?: string;
  personneAContacter?: string;
  telephoneSecondaire?: string;
  adresse?: string;
  profession?: string;
  photoUrl?: string;
  signatureReference?: string;
  agenceId: number;
  agenceNom?: string;
  agenceTelephone?: string;
  agenceEmail?: string;
  agenceAdresse?: string;
  agenceVille?: string;
  marcheId?: number;
  marcheNom?: string;
  marcheCode?: string;
  agentId?: number;
  agentNom?: string;
  agentTelephone?: string;
  montantJournalier?: number;
  fraisAdhesion?: number;
  dateAdhesion?: string;
  soldeEpargne?: number;
  statut?: StatutEntity;
  nombreJoursPayes?: number;
  dateProbableRetrait?: string;
  commissionEstimee?: number;
}

export interface ClientHistorique {
  id?: number;
  typeAction?: string;
  champ?: string;
  valeurAvant?: string;
  valeurApres?: string;
  details?: string;
  effectueParNom?: string;
  dateHeure?: string;
}

export interface Collecte {
  id?: number;
  numeroRecu?: string;
  clientId: number;
  clientCode?: string;
  clientNom?: string;
  agentId?: number;
  agentNom?: string;
  agenceId?: number;
  montantPrevu?: number;
  montantJournalier?: number;
  soldeEpargne?: number;
  clientPhotoUrl?: string;
  nombreJoursPayes?: number;
  dateProbableRetrait?: string;
  montantRecu?: number;
  dateCollecte?: string;
  dateHeure?: string;
  signatureClient?: string;
  validee?: boolean;
  annulee?: boolean;
}

export interface Restitution {
  id?: number;
  numeroRecu?: string;
  clientId: number;
  clientCode?: string;
  clientNom?: string;
  clientTelephone?: string;
  clientEmail?: string;
  montantJournalier?: number;
  marcheNom?: string;
  agenceId?: number;
  agenceNom?: string;
  agenceTelephone?: string;
  agenceEmail?: string;
  agenceAdresse?: string;
  agenceVille?: string;
  agentId?: number;
  agentNom?: string;
  agentTelephone?: string;
  totalCollecte?: number;
  commission?: number;
  commissionCalculee?: number;
  montantNet?: number;
  dateHeure?: string;
  signatureClient?: string;
  validee?: boolean;
}

export interface Depense {
  id?: number;
  agenceId: number;
  dateDepense?: string;
  categorie: string;
  sens?: SensOperation;
  montant: number;
  justificatifUrl?: string;
  observation?: string;
  agentId?: number;
  agentNom?: string;
  clientId?: number;
  clientNom?: string;
  validee?: boolean;
}

export interface Caisse {
  id?: number;
  agenceId?: number;
  agenceNom?: string;
  dateCaisse?: string;
  soldeInitial?: number;
  totalEntrees?: number;
  totalSorties?: number;
  soldeTheorique?: number;
  soldeReel?: number;
  ecart?: number;
  observation?: string;
  statut?: StatutCaisse;
  dateOuverture?: string;
  dateCloture?: string;
  mouvements?: MouvementCaisse[];
}

export interface MouvementCaisse {
  id?: number;
  type?: string;
  categorie?: string;
  montant?: number;
  libelle?: string;
  reference?: string;
  dateHeure?: string;
}

export interface Dashboard {
  scopeLabel?: string;
  periodeDebut?: string;
  periodeFin?: string;
  vueAgent?: boolean;
  nombreAgences: number;
  nombreAgents: number;
  nombreClients: number;
  collectesJour: number;
  collectesMois: number;
  collectesPeriode?: number;
  beneficeGlobal: number;
  commissionAdmin: number;
  nombreSignatures: number;
  soldeCaisse: number;
  dernieresCollectes: Collecte[];
  dernieresRestitutions: Restitution[];
  dernieresDepenses: Depense[];
  topAgents: { agentId: number; nom: string; code: string; montant: number }[];
  evolutionCollectes: { date: string; montant: number }[];
  montantCommissionsPeriode?: number;
  montantDepensesPeriode?: number;
  montantOperationsEntree?: number;
  montantOperationsSortie?: number;
}

export interface AppUser {
  id?: number;
  username: string;
  nomComplet: string;
  email?: string;
  telephone?: string;
  photoUrl?: string;
  role: RoleType;
  agenceId?: number | null;
  agenceNom?: string | null;
  statut?: StatutEntity;
  password?: string;
}

export interface RolePermission {
  code: string;
  label: string;
  permissions: string[];
}

export interface AuditLog {
  id: number;
  createdAt: string;
  username: string;
  action: string;
  entite: string;
  reference: string;
  details: string;
  agenceId: number;
}

export interface SimulationClientLigne {
  clientId: number;
  clientCode: string;
  clientNom: string;
  agenceId: number;
  agenceNom: string;
  montantJournalier: number;
  collecteSimulee: number;
  commissionAgence: number;
  trancheLabel: string;
}

export interface SimulationAgenceLigne {
  agenceId: number;
  agenceNom: string;
  tauxCommissionAdmin: number;
  nombreClients: number;
  totalMisesJournalieres: number;
  totalCollectesSimulees: number;
  beneficeAgence: number;
  commissionAdmin: number;
}

export interface SimulationResultat {
  debut: string;
  fin: string;
  nombreJours: number;
  agenceId: number | null;
  agenceNom: string | null;
  tauxCommissionAdmin: number | null;
  nombreClients: number;
  totalMisesJournalieres: number;
  totalCollectesSimulees: number;
  beneficeAgence: number;
  commissionAdmin: number;
  parAgence: SimulationAgenceLigne[];
  clients: SimulationClientLigne[];
}
