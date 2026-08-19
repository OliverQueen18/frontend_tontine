import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Agence, Agent, AppUser, AuditLog, Caisse, CaisseControle, CategorieDepense, Client, ClientHistorique, Collecte, Dashboard, DemandeInscriptionAgence,
  Depense, GrilleCommissionLigne, InscriptionCollecteurConfig, Marche, PlatformSettings, Restitution, RolePermission, RoleType, SensOperation,
  SimulationResultat
} from '../models/models';
import { ImageCompressService } from './image-compress.service';
import { formatUploadError } from '../utils/upload-error.util';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private imageCompress: ImageCompressService
  ) {}

  // Public
  publicStats() {
    return this.http.get<{ agences: number; clients: number; signatures: number; version: string }>(
      `${this.base}/public/stats`
    );
  }

  uploadPublicMedia(file: File): Observable<{ url: string }> {
    return from(this.imageCompress.compress(file)).pipe(
      switchMap(compressed => {
        const form = new FormData();
        form.append('file', compressed, compressed.name);
        return this.http.post<{ url: string }>(`${this.base}/public/media/upload`, form);
      }),
      catchError(err => throwError(() => ({
        status: (err as { status?: number })?.status,
        error: { message: formatUploadError(err) }
      })))
    );
  }

  uploadPublicDocument(file: File): Observable<{ url: string }> {
    const prepare$ = file.type.startsWith('image/')
      ? from(this.imageCompress.compress(file))
      : from(Promise.resolve(file));
    return prepare$.pipe(
      switchMap(prepared => {
        const form = new FormData();
        form.append('file', prepared, prepared.name);
        return this.http.post<{ url: string }>(`${this.base}/public/media/upload-document`, form);
      }),
      catchError(err => throwError(() => ({
        status: (err as { status?: number })?.status,
        error: { message: formatUploadError(err) }
      })))
    );
  }

  getInscriptionCollecteurConfig(): Observable<InscriptionCollecteurConfig> {
    return this.http.get<InscriptionCollecteurConfig>(`${this.base}/public/inscription-collecteur/config`);
  }

  envoyerOtpInscription(email: string, nomComplet?: string, telephone?: string) {
    return this.http.post<{
      message: string;
      maskedEmail?: string;
      maskedPhone?: string;
      smsSent?: boolean;
      expiresInSeconds?: number;
    }>(
      `${this.base}/public/inscription-collecteur/envoyer-otp`,
      { email, nomComplet, telephone }
    );
  }

  verifierOtpInscription(email: string, otp: string) {
    return this.http.post<{ message: string; resetToken?: string }>(
      `${this.base}/public/inscription-collecteur/verifier-otp`,
      { email, otp }
    );
  }

  soumettreInscriptionCollecteur(payload: Record<string, unknown>) {
    return this.http.post<{ message: string; demandeId: number }>(
      `${this.base}/public/inscription-collecteur`,
      payload
    );
  }

  getPlatformSettings(): Observable<PlatformSettings> {
    return this.http.get<PlatformSettings>(`${this.base}/admin/platform-settings`);
  }

  updatePlatformSettings(settings: PlatformSettings): Observable<PlatformSettings> {
    return this.http.put<PlatformSettings>(`${this.base}/admin/platform-settings`, settings);
  }

  getDemandesInscription(statut?: string): Observable<DemandeInscriptionAgence[]> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    return this.http.get<DemandeInscriptionAgence[]>(`${this.base}/admin/demandes-inscription`, { params });
  }

  countDemandesInscriptionEnAttente(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.base}/admin/demandes-inscription/en-attente/count`)
      .pipe(map(r => r.count ?? 0));
  }

  approuverDemandeInscription(id: number): Observable<DemandeInscriptionAgence> {
    return this.http.post<DemandeInscriptionAgence>(`${this.base}/admin/demandes-inscription/${id}/approuver`, {});
  }

  rejeterDemandeInscription(id: number, motif: string): Observable<DemandeInscriptionAgence> {
    return this.http.post<DemandeInscriptionAgence>(`${this.base}/admin/demandes-inscription/${id}/rejeter`, { motif });
  }

  // Dashboard
  dashboard(params?: {
    agenceId?: number | null;
    agentId?: number | null;
    debut?: string | null;
    fin?: string | null;
  }): Observable<Dashboard> {
    let httpParams = new HttpParams();
    if (params?.agenceId) httpParams = httpParams.set('agenceId', params.agenceId);
    if (params?.agentId) httpParams = httpParams.set('agentId', params.agentId);
    if (params?.debut) httpParams = httpParams.set('debut', params.debut);
    if (params?.fin) httpParams = httpParams.set('fin', params.fin);
    return this.http.get<Dashboard>(`${this.base}/dashboard`, { params: httpParams });
  }

  simuler(params: {
    debut: string;
    fin: string;
    agenceId?: number | null;
  }): Observable<SimulationResultat> {
    let httpParams = new HttpParams()
      .set('debut', params.debut)
      .set('fin', params.fin);
    if (params.agenceId != null) {
      httpParams = httpParams.set('agenceId', params.agenceId);
    }
    return this.http.get<SimulationResultat>(`${this.base}/simulateur`, { params: httpParams });
  }

  // Agences
  getAgences(): Observable<Agence[]> {
    return this.http.get<Agence[]>(`${this.base}/agences`);
  }

  getAgence(id: number): Observable<Agence> {
    return this.http.get<Agence>(`${this.base}/agences/${id}`);
  }

  createAgence(dto: Agence): Observable<Agence> {
    return this.http.post<Agence>(`${this.base}/agences`, dto);
  }

  updateAgence(id: number, dto: Agence): Observable<Agence> {
    return this.http.put<Agence>(`${this.base}/agences/${id}`, dto);
  }

  desactiverAgence(id: number): Observable<Agence> {
    return this.http.patch<Agence>(`${this.base}/agences/${id}/desactiver`, {});
  }

  setAgenceSmsTousClients(id: number, enabled: boolean): Observable<Agence> {
    return this.http.patch<Agence>(`${this.base}/agences/${id}/sms-tous-clients`, { enabled });
  }

  supprimerAgence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/agences/${id}`);
  }

  getGrilleCommission(agenceId: number): Observable<GrilleCommissionLigne[]> {
    return this.http.get<GrilleCommissionLigne[]>(`${this.base}/agences/${agenceId}/grille-commission`);
  }

  saveGrilleCommission(agenceId: number, lignes: GrilleCommissionLigne[]): Observable<GrilleCommissionLigne[]> {
    return this.http.put<GrilleCommissionLigne[]>(`${this.base}/agences/${agenceId}/grille-commission`, { lignes });
  }

  resetGrilleCommission(agenceId: number): Observable<GrilleCommissionLigne[]> {
    return this.http.post<GrilleCommissionLigne[]>(
      `${this.base}/agences/${agenceId}/grille-commission/reinitialiser`,
      {}
    );
  }

  getCategoriesDepenses(agenceId?: number | null, activesOnly = false): Observable<CategorieDepense[]> {
    let params = new HttpParams();
    if (agenceId != null) params = params.set('agenceId', agenceId);
    if (activesOnly) params = params.set('activesOnly', 'true');
    return this.http.get<CategorieDepense[]>(`${this.base}/referentiels/categories-depenses`, { params });
  }

  createCategorieDepense(
    nom: string,
    sens: SensOperation = 'SORTIE',
    options?: { necessiteMouvementCaisse?: boolean; necessiteClient?: boolean; agenceId?: number | null }
  ): Observable<CategorieDepense> {
    const body: Record<string, unknown> = {
      nom,
      sens,
      necessiteMouvementCaisse: options?.necessiteMouvementCaisse ?? true,
      necessiteClient: options?.necessiteClient ?? false
    };
    if (options?.agenceId != null) body['agenceId'] = options.agenceId;
    return this.http.post<CategorieDepense>(`${this.base}/referentiels/categories-depenses`, body);
  }

  desactiverCategorieDepense(id: number, agenceId?: number | null): Observable<CategorieDepense> {
    let params = new HttpParams();
    if (agenceId != null) params = params.set('agenceId', agenceId);
    return this.http.patch<CategorieDepense>(`${this.base}/referentiels/categories-depenses/${id}/desactiver`, {}, { params });
  }

  reactiverCategorieDepense(id: number, agenceId?: number | null): Observable<CategorieDepense> {
    let params = new HttpParams();
    if (agenceId != null) params = params.set('agenceId', agenceId);
    return this.http.patch<CategorieDepense>(`${this.base}/referentiels/categories-depenses/${id}/reactiver`, {}, { params });
  }

  // Agents
  getAgents(agenceId?: number | null): Observable<Agent[]> {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    return this.http.get<Agent[]>(`${this.base}/agents`, { params });
  }

  createAgent(dto: Agent): Observable<Agent> {
    return this.http.post<Agent>(`${this.base}/agents`, dto);
  }

  updateAgent(id: number, dto: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.base}/agents/${id}`, dto);
  }

  suspendreAgent(id: number): Observable<Agent> {
    return this.http.patch<Agent>(`${this.base}/agents/${id}/suspendre`, {});
  }

  // Clients
  getClients(q?: string, agenceId?: number | null, agentId?: number | null): Observable<Client[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    if (agenceId) params = params.set('agenceId', agenceId);
    if (agentId) params = params.set('agentId', agentId);
    return this.http.get<Client[]>(`${this.base}/clients`, { params });
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.base}/clients/${id}`);
  }

  createClient(dto: Client): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients`, dto);
  }

  updateClient(id: number, dto: Client): Observable<Client> {
    return this.http.put<Client>(`${this.base}/clients/${id}`, dto);
  }

  desactiverClient(id: number, motif?: string): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/clients/${id}/desactiver`, { motif });
  }

  reactiverClient(id: number, motif?: string): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/clients/${id}/reactiver`, { motif });
  }

  deleteClient(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/clients/${id}`);
  }

  getClientHistorique(id: number): Observable<ClientHistorique[]> {
    return this.http.get<ClientHistorique[]>(`${this.base}/clients/${id}/historique`);
  }

  transfererClient(id: number, payload: { agentId: number; motif?: string; date?: string }): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients/${id}/transferer`, payload);
  }

  // Collectes
  getCollectes(filters: {
    agenceId?: number | null;
    agentId?: number | null;
    clientId?: number | null;
    debut?: string;
    fin?: string;
  } = {}): Observable<Collecte[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<Collecte[]>(`${this.base}/collectes`, { params });
  }

  portefeuille(agentId: number): Observable<Collecte[]> {
    return this.http.get<Collecte[]>(`${this.base}/collectes/portefeuille/${agentId}`);
  }

  enregistrerCollecte(dto: Collecte): Observable<Collecte> {
    return this.http.post<Collecte>(`${this.base}/collectes`, dto);
  }

  signerCollecte(id: number, signatureClient: string): Observable<Collecte> {
    return this.http.patch<Collecte>(`${this.base}/collectes/${id}/signer`, { signatureClient });
  }

  annulerCollecte(id: number): Observable<Collecte> {
    return this.http.post<Collecte>(`${this.base}/collectes/${id}/annuler`, {});
  }

  // Restitutions
  getRestitutions(agenceId?: number | null): Observable<Restitution[]> {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    return this.http.get<Restitution[]>(`${this.base}/restitutions`, { params });
  }

  calculerRestitution(clientId: number) {
    return this.http.get<Record<string, unknown>>(`${this.base}/restitutions/calculer/${clientId}`);
  }

  effectuerRestitution(dto: Restitution): Observable<Restitution> {
    return this.http.post<Restitution>(`${this.base}/restitutions`, dto);
  }

  getRestitutionsEnAttenteSignature(): Observable<Restitution[]> {
    return this.http.get<Restitution[]>(`${this.base}/restitutions/en-attente-signature`);
  }

  finaliserRestitution(id: number, signatureClient: string, commission?: number): Observable<Restitution> {
    const body: { signatureClient: string; commission?: number } = { signatureClient };
    if (commission != null) body.commission = commission;
    return this.http.patch<Restitution>(`${this.base}/restitutions/${id}/finaliser`, body);
  }

  getRestitution(id: number): Observable<Restitution> {
    return this.http.get<Restitution>(`${this.base}/restitutions/${id}`);
  }

  renvoyerRecuRestitution(id: number): Observable<Restitution> {
    return this.http.post<Restitution>(`${this.base}/restitutions/${id}/renvoyer-recu`, {});
  }

  modifierCommissionRestitution(id: number, commission: number): Observable<Restitution> {
    return this.http.patch<Restitution>(`${this.base}/restitutions/${id}/commission`, { commission });
  }

  // Caisse
  getCaisseJour(agenceId: number): Observable<Caisse | null> {
    return this.http.get<Caisse | null>(`${this.base}/caisse/jour`, {
      params: new HttpParams().set('agenceId', agenceId)
    });
  }

  getCaisseControle(agenceId: number): Observable<CaisseControle> {
    return this.http.get<CaisseControle>(`${this.base}/caisse/controle`, {
      params: new HttpParams().set('agenceId', agenceId)
    });
  }

  getCaisseHistorique(agenceId: number, debut?: string, fin?: string): Observable<Caisse[]> {
    let params = new HttpParams().set('agenceId', agenceId);
    if (debut) params = params.set('debut', debut);
    if (fin) params = params.set('fin', fin);
    return this.http.get<Caisse[]>(`${this.base}/caisse/historique`, { params });
  }

  getCaisseDetail(agenceId: number, date: string): Observable<Caisse> {
    return this.http.get<Caisse>(`${this.base}/caisse/detail`, {
      params: new HttpParams().set('agenceId', agenceId).set('date', date)
    });
  }

  getCaisseById(id: number): Observable<Caisse> {
    return this.http.get<Caisse>(`${this.base}/caisse/${id}`);
  }

  ouvrirCaisse(agenceId: number, soldeInitial?: number): Observable<Caisse> {
    return this.http.post<Caisse>(`${this.base}/caisse/ouvrir`, { agenceId, soldeInitial });
  }

  cloturerCaisse(agenceId: number, soldeReel: number, observation?: string, dateCaisse?: string): Observable<Caisse> {
    return this.http.post<Caisse>(`${this.base}/caisse/cloturer`, {
      agenceId,
      soldeReel,
      observation,
      dateCaisse
    });
  }

  annulerClotureCaisse(id: number): Observable<Caisse> {
    return this.http.post<Caisse>(`${this.base}/caisse/${id}/annuler-cloture`, {});
  }

  supprimerCaisse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/caisse/${id}`);
  }

  // Dépenses
  getDepenses(agenceId?: number | null): Observable<Depense[]> {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    return this.http.get<Depense[]>(`${this.base}/depenses`, { params });
  }

  createDepense(dto: Depense): Observable<Depense> {
    return this.http.post<Depense>(`${this.base}/depenses`, dto);
  }

  validerDepense(id: number): Observable<Depense> {
    return this.http.patch<Depense>(`${this.base}/depenses/${id}/valider`, {});
  }

  // Référentiels
  getMarches(agenceId?: number | null) {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    return this.http.get<Marche[]>(`${this.base}/referentiels/marches`, { params });
  }

  createMarche(payload: {
    nom: string;
    code?: string;
    description?: string;
    adresse: string;
    latitude: number;
    longitude: number;
    agenceId?: number;
  }) {
    return this.http.post<Marche>(`${this.base}/referentiels/marches`, payload);
  }

  updateMarche(id: number, payload: {
    nom: string;
    code?: string;
    description?: string;
    adresse: string;
    latitude: number;
    longitude: number;
  }) {
    return this.http.put<Marche>(`${this.base}/referentiels/marches/${id}`, payload);
  }

  desactiverMarche(id: number) {
    return this.http.patch<Marche>(`${this.base}/referentiels/marches/${id}/desactiver`, {});
  }

  reactiverMarche(id: number) {
    return this.http.patch<Marche>(`${this.base}/referentiels/marches/${id}/reactiver`, {});
  }

  /** Suppression définitive — SUPER_ADMIN uniquement. */
  deleteMarche(id: number) {
    return this.http.delete<{ message: string }>(`${this.base}/referentiels/marches/${id}`);
  }

  getQuartiers(agenceId?: number | null) {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    return this.http.get<{ id: number; nom: string; agenceId: number }[]>(`${this.base}/referentiels/quartiers`, { params });
  }

  // Utilisateurs (super admin)
  getUtilisateurs(agenceId?: number | null, role?: RoleType | null): Observable<AppUser[]> {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    if (role) params = params.set('role', role);
    return this.http.get<AppUser[]>(`${this.base}/utilisateurs`, { params });
  }

  getRolePermissions(): Observable<{ roles: RolePermission[]; assignableRoles?: string[] }> {
    return this.http.get<{ roles: RolePermission[]; assignableRoles?: string[] }>(`${this.base}/utilisateurs/permissions`);
  }

  createUtilisateur(payload: AppUser): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.base}/utilisateurs`, payload);
  }

  updateUtilisateur(id: number, payload: Partial<AppUser>): Observable<AppUser> {
    return this.http.put<AppUser>(`${this.base}/utilisateurs/${id}`, payload);
  }

  desactiverUtilisateur(id: number): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.base}/utilisateurs/${id}/desactiver`, {});
  }

  // Audit
  getAudit(agenceId?: number | null): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (agenceId) params = params.set('agenceId', agenceId);
    return this.http.get<AuditLog[]>(`${this.base}/audit`, { params });
  }
}
