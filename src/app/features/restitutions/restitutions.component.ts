import { Component, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';

import { ApiService } from '../../core/services/api.service';

import { AuthService } from '../../core/services/auth.service';

import { Client, Restitution } from '../../core/models/models';

import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';

import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';

import { FcfaAmountInputComponent } from '../../shared/components/fcfa-amount-input/fcfa-amount-input.component';

import { DatePipe } from '@angular/common';



@Component({

  selector: 'app-restitutions',

  standalone: true,

  imports: [FormsModule, FcfaPipe, SignaturePadComponent, FcfaAmountInputComponent, DatePipe],

  templateUrl: './restitutions.component.html'

})

export class RestitutionsComponent implements OnInit {

  restitutions = signal<Restitution[]>([]);

  enAttente = signal<Restitution[]>([]);

  clients = signal<Client[]>([]);

  clientId: number | null = null;

  calcul = signal<Record<string, unknown> | null>(null);

  showSignature = false;

  selectedRestitution: Restitution | null = null;

  commissionDraft = 0;

  message = signal('');



  constructor(

    private api: ApiService,

    public auth: AuthService,

    private route: ActivatedRoute

  ) {}



  get canEffectuer(): boolean {

    return this.auth.hasRole('CAISSIER', 'SUPER_ADMIN');

  }



  get isCollecteur(): boolean {

    return this.auth.isCollecteur();

  }



  ngOnInit(): void {

    this.loadHistorique();

    if (this.isCollecteur) {

      this.loadEnAttente();

    }

    if (this.canEffectuer) {

      const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();

      this.api.getClients(undefined, agenceId).subscribe(c => {

        this.clients.set(c.filter(x => x.statut === 'ACTIF'));

        const qid = this.route.snapshot.queryParamMap.get('clientId');

        if (qid) {

          this.clientId = Number(qid);

          this.calculer();

        }

      });

    }

  }



  loadHistorique(): void {

    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();

    this.api.getRestitutions(agenceId).subscribe(r => this.restitutions.set(r));

  }



  loadEnAttente(): void {

    this.api.getRestitutionsEnAttenteSignature().subscribe(r => this.enAttente.set(r));

  }



  calculer(): void {

    if (!this.clientId) return;

    this.api.calculerRestitution(this.clientId).subscribe(c => this.calcul.set(c));

  }



  effectuer(): void {

    if (!this.clientId) return;

    this.api.effectuerRestitution({

      clientId: this.clientId,

      montantNet: 0

    }).subscribe({

      next: (r) => {

        this.message.set(`Restitution initiée — reçu ${r.numeroRecu}. L'agent valide la commission et fait signer le client.`);

        this.calcul.set(null);

        this.clientId = null;

        this.loadHistorique();

        if (this.isCollecteur) this.loadEnAttente();

        const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();

        this.api.getClients(undefined, agenceId).subscribe(c => this.clients.set(c.filter(x => x.statut === 'ACTIF')));

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  commissionProposee(r: Restitution): number {

    return r.commission ?? r.commissionCalculee ?? 0;

  }



  getCommissionDraft(r: Restitution): number {

    return this.commissionDrafts[r.id!] ?? this.commissionProposee(r);

  }



  setCommissionDraft(r: Restitution, value: number): void {

    if (r.id) this.commissionDrafts[r.id] = value;

  }



  private commissionDrafts: Record<number, number> = {};



  enregistrerCommission(r: Restitution): void {

    if (!r.id) return;

    const commission = this.getCommissionDraft(r);

    this.api.modifierCommissionRestitution(r.id, commission).subscribe({

      next: updated => {

        this.message.set('Commission enregistrée');

        this.enAttente.update(list => list.map(x => x.id === updated.id ? updated : x));

        if (r.id) this.commissionDrafts[r.id] = updated.commission ?? 0;

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  ouvrirSignature(r: Restitution): void {

    this.selectedRestitution = r;

    this.commissionDraft = this.getCommissionDraft(r);

    this.showSignature = true;

  }



  onSigned(signature: string): void {

    if (!this.selectedRestitution?.id) return;

    this.api.finaliserRestitution(this.selectedRestitution.id, signature, this.commissionDraft).subscribe({

      next: () => {

        this.showSignature = false;

        this.selectedRestitution = null;

        this.message.set('Restitution finalisée avec la signature du client');

        this.loadHistorique();

        this.loadEnAttente();

      },

      error: err => this.message.set(err?.error?.message || 'Erreur')

    });

  }



  asNumber(v: unknown): number {

    return Number(v || 0);

  }

}


