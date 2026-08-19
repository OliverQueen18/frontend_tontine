import { Component, OnInit, signal } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';

import { AuthService } from '../../core/services/auth.service';

import { Agent, Client, ClientHistorique, Collecte, Marche } from '../../core/models/models';

import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';

import { QrCodeComponent } from '../../shared/components/qr-code/qr-code.component';

import { PhoneDigitsComponent } from '../../shared/components/phone-digits/phone-digits.component';

import { FcfaAmountInputComponent } from '../../shared/components/fcfa-amount-input/fcfa-amount-input.component';

import { PhotoCaptureComponent } from '../../shared/components/photo-capture/photo-capture.component';

import { SiteContentService } from '../../core/services/site-content.service';

import { DatePipe } from '@angular/common';



@Component({

  selector: 'app-client-detail',

  standalone: true,

  imports: [RouterLink, FormsModule, FcfaPipe, QrCodeComponent, PhoneDigitsComponent, FcfaAmountInputComponent, PhotoCaptureComponent, DatePipe],

  template: `

    @if (client(); as c) {

      <div class="page-header">

        <div class="client-header">

          @if (c.photoUrl) {

            <img [src]="photoSrc(c.photoUrl)" alt="" class="client-photo" />

          } @else {

            <span class="client-photo client-photo--empty"><i class="pi pi-user"></i></span>

          }

          <div>

            <a routerLink="/app/clients" class="back-link">← Clients</a>

            <h1>{{ c.nomComplet }}</h1>

            <p>{{ c.code }} · {{ c.statut }}</p>

          </div>

          @if (c.code) {

            <div class="client-qr">

              <app-qr-code [value]="c.code" [size]="120" />

            </div>

          }

        </div>

        @if (canManage) {

          <div class="header-actions">

            <button type="button" class="btn btn-secondary btn-sm" (click)="openEdit()">Modifier</button>

            @if (c.statut === 'ACTIF') {

              <button type="button" class="btn btn-secondary btn-sm" (click)="showDesactiver=true">Désactiver</button>

            }

            @if (c.statut === 'INACTIF' && canToggleStatut) {

              <button type="button" class="btn btn-secondary btn-sm" (click)="showReactiver=true">Réactiver</button>

            }

            <button

              type="button"

              class="btn btn-secondary btn-sm"

              (click)="showDelete=true"

              [disabled]="!canDelete(c)"

            >Supprimer</button>

          </div>

        }

      </div>



      @if (message()) {

        <div class="alert alert-info">{{ message() }}</div>

      }



      <div class="split-grid">

        <section class="card">

          <h3>Informations</h3>

          <dl class="info-list">

            <div><dt>Code client</dt><dd><strong>{{ c.code || '—' }}</strong></dd></div>

            <div><dt>Téléphone</dt><dd>{{ c.telephone || '—' }}</dd></div>

            <div><dt>E-mail</dt><dd>{{ c.email || '—' }}</dd></div>

            <div><dt>Personne à contacter</dt><dd>{{ c.personneAContacter || '—' }}</dd></div>

            <div><dt>Tél. secondaire</dt><dd>{{ c.telephoneSecondaire || '—' }}</dd></div>

            <div><dt>Profession</dt><dd>{{ c.profession || '—' }}</dd></div>

            <div><dt>Adresse</dt><dd>{{ c.adresse || '—' }}</dd></div>

            <div><dt>Marché</dt><dd>{{ c.marcheNom || '—' }}@if (c.marcheCode) { ({{ c.marcheCode }})}</dd></div>

            <div><dt>Agence</dt><dd>{{ c.agenceNom || '—' }}</dd></div>
            <div><dt>Adresse agence</dt><dd>{{ agenceAdresse(c) || '—' }}</dd></div>
            <div><dt>Tél. agence</dt><dd>{{ c.agenceTelephone || '—' }}</dd></div>
            <div><dt>E-mail agence</dt><dd>{{ c.agenceEmail || '—' }}</dd></div>

            <div><dt>Agent collecteur</dt><dd>{{ c.agentNom || '—' }}</dd></div>
            <div><dt>Tél. agent</dt><dd>{{ c.agentTelephone || '—' }}</dd></div>

            <div><dt>Montant journalier</dt><dd>{{ c.montantJournalier | fcfa }}</dd></div>

            <div><dt>Solde épargne</dt><dd>{{ c.soldeEpargne | fcfa }}</dd></div>

            <div><dt>Commission estimée</dt><dd>{{ c.commissionEstimee != null ? (c.commissionEstimee | fcfa) : '—' }}</dd></div>

            <div><dt>Jours payés</dt><dd>{{ c.nombreJoursPayes ?? 0 }} j</dd></div>

            <div><dt>Date probable de retrait</dt><dd>{{ c.dateProbableRetrait ? (c.dateProbableRetrait | date:'dd/MM/yyyy') : '—' }}</dd></div>

            <div><dt>Date d'adhésion</dt><dd>{{ c.dateAdhesion | date:'dd/MM/yyyy' }}</dd></div>

          </dl>

        </section>



        <section class="card">

          <h3>Historique des collectes</h3>

          <table>

            <thead><tr><th>Date</th><th>Reçu</th><th>Jours</th><th>Montant</th></tr></thead>

            <tbody>

              @for (col of collectes(); track col.id) {

                <tr>

                  <td>{{ col.dateHeure | date:'dd/MM/yyyy HH:mm' }}</td>

                  <td>{{ col.numeroRecu }}</td>

                  <td>{{ col.nombreJoursPayes ?? '—' }}</td>

                  <td>{{ col.montantRecu | fcfa }}</td>

                </tr>

              } @empty {

                <tr><td colspan="4">Aucune collecte</td></tr>

              }

            </tbody>

          </table>

        </section>

      </div>



      <section class="card" style="margin-top:1rem">

        <h3>Historique des modifications</h3>

        <table>

          <thead>

            <tr><th>Date</th><th>Action</th><th>Champ</th><th>Avant</th><th>Après</th><th>Par</th><th>Détails</th></tr>

          </thead>

          <tbody>

            @for (h of historique(); track h.id) {

              <tr>

                <td>{{ h.dateHeure | date:'dd/MM/yyyy HH:mm' }}</td>

                <td>{{ historiqueLabel(h) }}</td>

                <td>{{ h.champ || '—' }}</td>

                <td>{{ h.valeurAvant || '—' }}</td>

                <td>{{ h.valeurApres || '—' }}</td>

                <td>{{ h.effectueParNom || '—' }}</td>

                <td>{{ h.details || '—' }}</td>

              </tr>

            } @empty {

              <tr><td colspan="7">Aucun historique</td></tr>

            }

          </tbody>

        </table>

      </section>

    }



    @if (showEdit && editForm) {

      <div class="modal-backdrop client-form-backdrop" (click)="showEdit=false">

        <div class="client-form-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">

          <header class="client-form-header">

            <div class="client-form-header__title">

              <span class="client-form-header__icon"><i class="pi pi-user-edit"></i></span>

              <div>

                <h3>Modifier le client</h3>

                <p>{{ editForm.code }} · affectation, identité et adhésion</p>

              </div>

            </div>

            <button type="button" class="btn-close" (click)="showEdit=false" aria-label="Fermer">

              <i class="pi pi-times"></i>

            </button>

          </header>

          <form (ngSubmit)="saveEdit()" class="client-form">

            <div class="client-form-scroll">

              <div class="client-form-columns">

                <section class="client-form-section client-form-section--stack">

                  <h4><i class="pi pi-map-marker"></i> Affectation</h4>

                  <label class="span-2">Marché *

                    <select [(ngModel)]="editForm.marcheId" name="detailEditMarcheId" required>

                      <option [ngValue]="undefined" disabled>Choisir un marché</option>

                      @for (m of marches(); track m.id) {

                        <option [ngValue]="m.id">{{ m.nom }}@if (m.code) { ({{ m.code }})}</option>

                      }

                    </select>

                  </label>

                  <label class="span-2">Agent collecteur *

                    <select [(ngModel)]="editForm.agentId" name="detailEditAgentId" required [disabled]="auth.hasRole('AGENT')">

                      <option [ngValue]="undefined" disabled>Choisir un agent</option>

                      @for (a of agents(); track a.id) {

                        <option [ngValue]="a.id">{{ a.nomComplet }}</option>

                      }

                    </select>

                  </label>

                  <h4 class="section-sub"><i class="pi pi-id-card"></i> Identité</h4>

                  <label class="span-2">Prénom et Nom complet *

                    <input [(ngModel)]="editForm.nomComplet" name="detailEditNom" required />

                  </label>

                  <label class="span-2">Téléphone * (8 chiffres)

                    <app-phone-digits [(ngModel)]="editForm.telephone" name="detailEditTel" [required]="true" />

                  </label>

                  <label>E-mail

                    <input type="email" [(ngModel)]="editForm.email" name="detailEditEmail" />

                  </label>

                  <label>Profession

                    <input [(ngModel)]="editForm.profession" name="detailEditProfession" />

                  </label>

                </section>

                <section class="client-form-section">

                  <h4><i class="pi pi-address-book"></i> Compléments</h4>

                  <div class="photo-section span-2">

                    <span class="field-label">Photo du client</span>

                    <app-photo-capture [photoUrl]="editForm.photoUrl" (photoUrlChange)="onEditPhotoChange($event)" />

                  </div>

                  <label class="span-2">Adresse du client

                    <input [(ngModel)]="editForm.adresse" name="detailEditAdresse" />

                  </label>

                  <label>Personne à contacter

                    <input [(ngModel)]="editForm.personneAContacter" name="detailEditContact" />

                  </label>

                  <label>N° tel. secondaire

                    <app-phone-digits [(ngModel)]="editForm.telephoneSecondaire" name="detailEditTel2" [required]="false" />

                  </label>

                  <h4 class="section-sub"><i class="pi pi-wallet"></i> Adhésion</h4>

                  <label>Montant journalier

                    <app-fcfa-amount-input [(ngModel)]="editForm.montantJournalier" name="detailEditMontant" ariaLabel="Montant journalier" />

                  </label>

                  <label>Frais d'adhésion (FCFA)

                    <input type="number" [(ngModel)]="editForm.fraisAdhesion" name="detailEditFrais" />

                  </label>

                </section>

              </div>

            </div>

            <footer class="client-form-footer">

              <button type="button" class="btn btn-secondary" (click)="showEdit=false">Annuler</button>

              <button class="btn btn-primary" type="submit"><i class="pi pi-check"></i> Enregistrer</button>

            </footer>

          </form>

        </div>

      </div>

    }



    @if (showDesactiver) {

      <div class="modal-backdrop" (click)="showDesactiver=false">

        <div class="modal" (click)="$event.stopPropagation()">

          <h3>Désactiver ce client ?</h3>

          <label>Motif (optionnel)

            <input [(ngModel)]="desactiverMotif" name="detailDesactiverMotif" />

          </label>

          <div class="modal-actions">

            <button type="button" class="btn btn-secondary" (click)="showDesactiver=false">Annuler</button>

            <button type="button" class="btn btn-primary" (click)="desactiver()">Désactiver</button>

          </div>

        </div>

      </div>

    }



    @if (showReactiver) {

      <div class="modal-backdrop" (click)="showReactiver=false">

        <div class="modal" (click)="$event.stopPropagation()">

          <h3>Réactiver ce client ?</h3>

          <p class="hint">Le client pourra à nouveau recevoir des collectes.</p>

          <label>Motif (optionnel)

            <input [(ngModel)]="reactiverMotif" name="detailReactiverMotif" />

          </label>

          <div class="modal-actions">

            <button type="button" class="btn btn-secondary" (click)="showReactiver=false">Annuler</button>

            <button type="button" class="btn btn-primary" (click)="reactiver()">Réactiver</button>

          </div>

        </div>

      </div>

    }



    @if (showDelete) {

      <div class="modal-backdrop" (click)="showDelete=false">

        <div class="modal" (click)="$event.stopPropagation()">

          <h3>Supprimer ce client ?</h3>

          @if (client() && !canDelete(client()!)) {

            <p>Impossible : solde supérieur à 0.</p>

          } @else {

            <p class="hint">Action irréversible. L'historique est conservé.</p>

            <div class="modal-actions">

              <button type="button" class="btn btn-secondary" (click)="showDelete=false">Annuler</button>

              <button type="button" class="btn btn-primary" (click)="supprimer()">Confirmer</button>

            </div>

          }

        </div>

      </div>

    }

  `,

  styles: [`

    .client-header { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; flex: 1; }

    .client-photo {

      width: 72px; height: 72px; border-radius: 12px; object-fit: cover;

      border: 2px solid var(--border);

    }

    .client-photo--empty {

      display: grid; place-items: center; background: #e2e8f0; color: #64748b; font-size: 1.5rem;

    }

    .client-qr { margin-left: auto; }

    .page-header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; justify-content: space-between; }

    .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .field-label { display: block; font-size: 0.86rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }

    .client-form-backdrop { z-index: 50; }

    .client-form-modal {
      width: min(920px, calc(100vw - 2rem));
      max-height: min(90vh, 820px);
      display: flex; flex-direction: column;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 20px 50px -12px rgba(15, 23, 42, 0.22);
      overflow: hidden;
    }

    .client-form-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
      padding: 1.15rem 1.5rem; background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
      border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
    }

    .client-form-header__title { display: flex; gap: 0.85rem; align-items: flex-start; min-width: 0; }

    .client-form-header__title h3 { margin: 0 0 0.2rem; font-size: 1.15rem; color: #0f172a; }

    .client-form-header__title p { margin: 0; font-size: 0.82rem; color: #64748b; }

    .client-form-header__icon {
      width: 44px; height: 44px; border-radius: 12px; background: #dbeafe; color: #1d4ed8;
      display: grid; place-items: center; font-size: 1.1rem; flex-shrink: 0;
    }

    .btn-close {
      width: 36px; height: 36px; border: 1px solid #e2e8f0; border-radius: 10px;
      background: #fff; color: #64748b; cursor: pointer; display: grid; place-items: center;
    }

    .client-form { display: flex; flex-direction: column; flex: 1; min-height: 0; }

    .client-form-scroll { flex: 1; overflow-y: auto; padding: 1.15rem 1.5rem; }

    .client-form-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }

    .client-form-section {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;
      padding: 1rem 1.1rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fafbfc;
    }

    .client-form-section--stack { grid-template-columns: 1fr; }

    .client-form-section h4 {
      grid-column: 1 / -1; margin: 0 0 0.15rem; font-size: 0.88rem; font-weight: 700;
      color: #1a5632; display: flex; align-items: center; gap: 0.45rem;
    }

    .client-form-section .section-sub { margin-top: 0.35rem; padding-top: 0.75rem; border-top: 1px dashed #e2e8f0; }

    .client-form-section label { display: grid; gap: 0.35rem; font-size: 0.86rem; font-weight: 600; color: #334155; }

    .client-form-section .span-2 { grid-column: 1 / -1; }

    .client-form-section--stack .span-2 { grid-column: 1; }

    .photo-section { grid-column: 1 / -1; padding-top: 0.25rem; }

    .client-form-footer {
      display: flex; justify-content: flex-end; gap: 0.65rem;
      padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .client-form-columns, .client-form-section { grid-template-columns: 1fr; }
      .client-form-section .span-2 { grid-column: 1; }
      .client-form-footer { flex-direction: column-reverse; }
      .client-form-footer .btn { width: 100%; justify-content: center; }
    }

  `]

})

export class ClientDetailComponent implements OnInit {

  client = signal<Client | null>(null);

  collectes = signal<Collecte[]>([]);

  historique = signal<ClientHistorique[]>([]);

  agents = signal<Agent[]>([]);

  marches = signal<Marche[]>([]);

  message = signal('');

  showEdit = false;

  showDesactiver = false;

  showReactiver = false;

  showDelete = false;

  editForm: Client | null = null;

  desactiverMotif = '';

  reactiverMotif = '';

  private clientId = 0;



  constructor(

    private route: ActivatedRoute,

    private api: ApiService,

    public auth: AuthService,

    private cms: SiteContentService

  ) {}



  get canManage(): boolean {

    return this.auth.hasRole('SUPER_ADMIN') || this.auth.isCollecteur();

  }



  get canToggleStatut(): boolean {

    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE');

  }



  ngOnInit(): void {

    this.clientId = Number(this.route.snapshot.paramMap.get('id'));

    this.reload();

  }



  reload(): void {

    this.api.getClient(this.clientId).subscribe(c => {

      this.client.set(c);

      const agenceId = c.agenceId ?? this.auth.agenceId();

      this.api.getAgents(agenceId).subscribe(a => this.agents.set(a));

      this.api.getMarches(agenceId).subscribe(m => this.marches.set(m));

    });

    this.api.getCollectes({ clientId: this.clientId }).subscribe(c => this.collectes.set(c));

    this.api.getClientHistorique(this.clientId).subscribe(h => this.historique.set(h));

  }



  canDelete(c: Client): boolean {

    return !c.soldeEpargne || c.soldeEpargne <= 0;

  }



  openEdit(): void {

    const c = this.client();

    if (!c) return;

    this.editForm = { ...c };

    this.showEdit = true;

  }



  onEditPhotoChange(url: string): void {

    if (this.editForm) this.editForm.photoUrl = url;

  }



  saveEdit(): void {

    if (!this.editForm?.id) return;

    this.api.updateClient(this.editForm.id, this.editForm).subscribe({

      next: () => {

        this.showEdit = false;

        this.message.set('Client modifié');

        this.reload();

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  desactiver(): void {

    this.api.desactiverClient(this.clientId, this.desactiverMotif || undefined).subscribe({

      next: () => {

        this.showDesactiver = false;

        this.message.set('Client désactivé');

        this.reload();

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  reactiver(): void {

    this.api.reactiverClient(this.clientId, this.reactiverMotif || undefined).subscribe({

      next: () => {

        this.showReactiver = false;

        this.message.set('Client réactivé');

        this.reload();

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  supprimer(): void {

    this.api.deleteClient(this.clientId).subscribe({

      next: () => {

        this.showDelete = false;

        this.message.set('Client supprimé');

        this.reload();

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  historiqueLabel(h: ClientHistorique): string {

    const labels: Record<string, string> = {

      CREATION: 'Création',

      MODIFICATION: 'Modification',

      DESACTIVATION: 'Désactivation',

      REACTIVATION: 'Réactivation',

      SUPPRESSION: 'Suppression',

      RESTITUTION: 'Restitution',

      RESTITUTION_COMMISSION: 'Commission restitution'

    };

    return labels[h.typeAction ?? ''] ?? h.typeAction ?? '—';

  }



  agenceAdresse(c: Client): string {
    return [c.agenceAdresse, c.agenceVille].filter(Boolean).join(', ');
  }

  photoSrc(url: string): string {

    return this.cms.resolveMediaUrl(url);

  }

}


