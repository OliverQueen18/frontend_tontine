import { Component, OnInit, signal } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';

import { AuthService } from '../../core/services/auth.service';

import { Client, ClientHistorique, Collecte } from '../../core/models/models';

import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';

import { QrCodeComponent } from '../../shared/components/qr-code/qr-code.component';

import { PhoneDigitsComponent } from '../../shared/components/phone-digits/phone-digits.component';

import { FcfaAmountInputComponent } from '../../shared/components/fcfa-amount-input/fcfa-amount-input.component';

import { SiteContentService } from '../../core/services/site-content.service';

import { DatePipe } from '@angular/common';



@Component({

  selector: 'app-client-detail',

  standalone: true,

  imports: [RouterLink, FormsModule, FcfaPipe, QrCodeComponent, PhoneDigitsComponent, FcfaAmountInputComponent, DatePipe],

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

      <div class="modal-backdrop" (click)="showEdit=false">

        <div class="modal modal-lg" (click)="$event.stopPropagation()">

          <h3>Modifier le client</h3>

          <form (ngSubmit)="saveEdit()" class="form-grid">

            <label class="full-width">Nom complet *

              <input [(ngModel)]="editForm.nomComplet" name="detailEditNom" required />

            </label>

            <label>Téléphone *

              <app-phone-digits [(ngModel)]="editForm.telephone" name="detailEditTel" [required]="true" />

            </label>

            <label>E-mail

              <input type="email" [(ngModel)]="editForm.email" name="detailEditEmail" />

            </label>

            <label>Profession

              <input [(ngModel)]="editForm.profession" name="detailEditProfession" />

            </label>

            <label class="full-width">Adresse

              <input [(ngModel)]="editForm.adresse" name="detailEditAdresse" />

            </label>

            <label>Montant journalier

              <app-fcfa-amount-input [(ngModel)]="editForm.montantJournalier" name="detailEditMontant" ariaLabel="Montant journalier" />

            </label>

            <div class="modal-actions full-width">

              <button type="button" class="btn btn-secondary" (click)="showEdit=false">Annuler</button>

              <button class="btn btn-primary" type="submit">Enregistrer</button>

            </div>

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

  `]

})

export class ClientDetailComponent implements OnInit {

  client = signal<Client | null>(null);

  collectes = signal<Collecte[]>([]);

  historique = signal<ClientHistorique[]>([]);

  message = signal('');

  showEdit = false;

  showDesactiver = false;

  showDelete = false;

  editForm: Client | null = null;

  desactiverMotif = '';

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



  ngOnInit(): void {

    this.clientId = Number(this.route.snapshot.paramMap.get('id'));

    this.reload();

  }



  reload(): void {

    this.api.getClient(this.clientId).subscribe(c => this.client.set(c));

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


