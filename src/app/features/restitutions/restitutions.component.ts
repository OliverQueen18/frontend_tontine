import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CaisseOuverteService } from '../../core/services/caisse-ouverte.service';
import { Client, Restitution } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { FcfaAmountInputComponent } from '../../shared/components/fcfa-amount-input/fcfa-amount-input.component';
import { RestitutionReceiptComponent } from '../../shared/components/restitution-receipt/restitution-receipt.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-restitutions',
  standalone: true,
  imports: [
    FormsModule,
    FcfaPipe,
    SignaturePadComponent,
    FcfaAmountInputComponent,
    RestitutionReceiptComponent,
    DatePipe,
    RouterLink
  ],
  templateUrl: './restitutions.component.html'
})
export class RestitutionsComponent implements OnInit {
  @ViewChild(RestitutionReceiptComponent) receiptComp?: RestitutionReceiptComponent;

  restitutions = signal<Restitution[]>([]);
  enAttente = signal<Restitution[]>([]);
  clients = signal<Client[]>([]);
  clientId: number | null = null;
  calcul = signal<Record<string, unknown> | null>(null);
  showSignature = false;
  selectedRestitution: Restitution | null = null;
  commissionDraft = 0;
  message = signal('');
  showReceipt = false;
  receiptRestitution: Restitution | null = null;
  private commissionDrafts: Record<number, number> = {};

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    public caisseOuverte: CaisseOuverteService
  ) {}

  get canEffectuer(): boolean {
    return this.auth.hasRole('CAISSIER', 'SUPER_ADMIN', 'ADMIN_AGENCE');
  }

  get isCollecteur(): boolean {
    return this.auth.isCollecteur();
  }

  get caisseBloquee(): boolean {
    return this.caisseOuverte.ouverte() === false;
  }

  ngOnInit(): void {
    this.caisseOuverte.check();
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
    this.api.getRestitutions(agenceId).subscribe({
      next: r => this.restitutions.set(r),
      error: err => this.message.set(err?.error?.message || 'Impossible de charger l\'historique')
    });
  }

  loadEnAttente(): void {
    this.api.getRestitutionsEnAttenteSignature().subscribe({
      next: r => this.enAttente.set(r),
      error: err => this.message.set(err?.error?.message || 'Impossible de charger les restitutions en attente')
    });
  }

  calculer(): void {
    if (!this.clientId) return;
    this.api.calculerRestitution(this.clientId).subscribe(c => this.calcul.set(c));
  }

  effectuer(): void {
    if (!this.clientId) return;
    if (this.caisseBloquee) {
      this.message.set(this.caisseOuverte.messageBlocage);
      return;
    }
    this.api.effectuerRestitution({
      clientId: this.clientId,
      montantNet: 0
    }).subscribe({
      next: (r) => {
        this.message.set(
          this.auth.hasRole('ADMIN_AGENCE')
            ? `Restitution initiée — reçu ${r.numeroRecu}. Validez la commission puis faites signer le client.`
            : `Restitution initiée — reçu ${r.numeroRecu}. L'agent valide la commission et fait signer le client.`
        );
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
    if (this.caisseBloquee) {
      this.message.set(this.caisseOuverte.messageBlocage);
      return;
    }
    this.selectedRestitution = r;
    this.commissionDraft = this.getCommissionDraft(r);
    this.showSignature = true;
  }

  onSigned(signature: string): void {
    if (!this.selectedRestitution?.id) return;
    this.api.finaliserRestitution(this.selectedRestitution.id, signature, this.commissionDraft).subscribe({
      next: (r) => {
        this.showSignature = false;
        this.selectedRestitution = null;
        this.message.set(`Restitution finalisée — reçu ${r.numeroRecu}`);
        this.loadHistorique();
        this.loadEnAttente();
        this.ouvrirRecu(r);
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  ouvrirRecu(r: Restitution): void {
    if (!r.validee) return;
    if (r.id && (!r.signatureClient || !r.agenceNom)) {
      this.api.getRestitution(r.id).subscribe({
        next: full => {
          this.receiptRestitution = full;
          this.showReceipt = true;
        },
        error: err => this.message.set(err?.error?.message || 'Impossible de charger le reçu')
      });
      return;
    }
    this.receiptRestitution = r;
    this.showReceipt = true;
  }

  fermerRecu(): void {
    this.showReceipt = false;
    this.receiptRestitution = null;
  }

  imprimerRecu(): void {
    this.receiptComp?.print();
  }

  envoyerRecuEmail(): void {
    const id = this.receiptRestitution?.id;
    if (!id) return;
    this.api.renvoyerRecuRestitution(id).subscribe({
      next: () => this.message.set(`Reçu envoyé par e-mail à ${this.receiptRestitution?.clientEmail}`),
      error: err => this.message.set(err?.error?.message || 'Envoi du reçu impossible')
    });
  }

  asNumber(v: unknown): number {
    return Number(v || 0);
  }
}
