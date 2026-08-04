import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CaisseOuverteService } from '../../core/services/caisse-ouverte.service';
import { Agent, Collecte } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { QrScannerComponent } from '../../shared/components/qr-scanner/qr-scanner.component';
import { SiteContentService } from '../../core/services/site-content.service';
import { DatePipe } from '@angular/common';

type SortKey = 'nom' | 'solde' | 'jours';

@Component({
  selector: 'app-collectes',
  standalone: true,
  imports: [FormsModule, FcfaPipe, SignaturePadComponent, QrScannerComponent, DatePipe, RouterLink],
  templateUrl: './collectes.component.html',
  styleUrl: './collectes.component.scss'
})
export class CollectesComponent implements OnInit {
  portefeuille = signal<Collecte[]>([]);
  historique = signal<Collecte[]>([]);
  agents = signal<Agent[]>([]);

  agentId: number | null = null;
  selected: Collecte | null = null;
  montantRecu = 0;
  nombreJours = 1;
  syncFrom: 'montant' | 'jours' = 'jours';
  showCollecteForm = false;
  showSignature = false;
  showQrScanner = false;
  /** Collecte historique en cours de signature (null = nouvelle collecte). */
  signingExisting: Collecte | null = null;
  message = signal('');
  messageKind = signal<'success' | 'error' | 'warning'>('success');
  mode: 'assistant' | 'historique' = 'assistant';

  filterQ = signal('');
  sortBy = signal<SortKey>('nom');

  filteredPortefeuille = computed(() => this.filterAndSort(this.portefeuille()));
  filteredHistorique = computed(() => {
    const q = this.filterQ().trim().toLowerCase();
    if (!q) return this.historique();
    return this.historique().filter(c =>
      (c.clientNom?.toLowerCase().includes(q)) ||
      (c.clientCode?.toLowerCase().includes(q)) ||
      (c.numeroRecu?.toLowerCase().includes(q))
    );
  });

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cms: SiteContentService,
    public caisseOuverte: CaisseOuverteService
  ) {}

  /** Admin agence / super admin : voir toutes les collectes et filtrer par agent. */
  get canFilterAgents(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE');
  }

  get caisseBloquee(): boolean {
    return this.caisseOuverte.isBlocked();
  }

  ngOnInit(): void {
    this.refreshCaisseCheck();
    if (this.canFilterAgents) {
      this.mode = 'historique';
    }
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getAgents(agenceId).subscribe(agents => {
      this.agents.set(agents);
      if (this.canFilterAgents) {
        // Toutes les collectes par défaut ; l'admin peut ensuite filtrer par agent
        this.agentId = null;
        this.loadHistorique();
      } else if (this.auth.hasRole('AGENT')) {
        const userId = this.auth.user()?.id;
        const username = this.auth.user()?.username;
        const me = agents.find(a =>
          (userId != null && a.utilisateurId === userId) || a.username === username
        );
        if (me?.id) {
          this.agentId = me.id;
          this.loadPortefeuille();
          this.loadHistorique();
        }
      }
    });
    this.loadHistorique();
  }

  onAgentFilterChange(): void {
    this.refreshCaisseCheck();
    this.loadPortefeuille();
    this.loadHistorique();
  }

  private resolveAgenceIdForCaisse(item?: Collecte | null): number | null {
    if (item?.agenceId != null) return item.agenceId;
    const authAgence = this.auth.agenceId();
    if (authAgence != null) return authAgence;
    if (this.agentId != null) {
      return this.agents().find(a => a.id === this.agentId)?.agenceId ?? null;
    }
    return null;
  }

  refreshCaisseCheck(item?: Collecte | null): void {
    this.caisseOuverte.check(this.resolveAgenceIdForCaisse(item));
  }

  private notify(text: string, kind: 'success' | 'error' | 'warning' = 'success'): void {
    this.message.set(text);
    this.messageKind.set(kind);
  }

  private ensureCaisseOuverte(item?: Collecte | null): Promise<boolean> {
    const agenceId = this.resolveAgenceIdForCaisse(item);
    if (agenceId == null) {
      this.notify('Sélectionnez un agent pour vérifier la caisse de l\'agence.', 'warning');
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      this.caisseOuverte.check(agenceId).subscribe(ok => {
        if (!ok) {
          this.notify(this.caisseOuverte.messageBlocage, 'error');
        }
        resolve(ok);
      });
    });
  }

  loadPortefeuille(): void {
    if (!this.agentId) {
      this.portefeuille.set([]);
      return;
    }
    this.api.portefeuille(this.agentId).subscribe(p => this.portefeuille.set(p));
  }

  loadHistorique(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getCollectes({
      agenceId,
      agentId: this.agentId ?? undefined
    }).subscribe(h => this.historique.set(h));
  }

  clearFilters(): void {
    this.filterQ.set('');
    this.sortBy.set('nom');
    if (this.canFilterAgents) {
      this.agentId = null;
      this.onAgentFilterChange();
    }
  }

  isSelected(item: Collecte): boolean {
    return this.selected?.clientId === item.clientId && this.showCollecteForm;
  }

  async startCollecte(item: Collecte): Promise<void> {
    if (!(await this.ensureCaisseOuverte(item))) return;
    this.selected = item;
    this.nombreJours = 1;
    this.syncFrom = 'jours';
    this.updateFromJours();
    this.showCollecteForm = true;
    this.showSignature = false;
    this.showQrScanner = false;
  }

  async openQrScanner(): Promise<void> {
    if (!(await this.ensureCaisseOuverte())) return;
    this.showQrScanner = true;
  }

  closeQrScanner(): void {
    this.showQrScanner = false;
  }

  onQrScanned(raw: string): void {
    this.showQrScanner = false;
    const code = this.extractClientCode(raw);
    const item = this.findClientByCode(code);
    if (!item) {
      this.notify(`Aucun client « ${code} » dans ce portefeuille`, 'warning');
      return;
    }
    this.startCollecte(item);
    this.notify(`Client trouvé : ${item.clientNom}`);
  }

  private extractClientCode(raw: string): string {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      const fromQuery = url.searchParams.get('code') || url.searchParams.get('client');
      if (fromQuery) return fromQuery.trim();
      const last = url.pathname.split('/').filter(Boolean).pop();
      if (last) return last;
    } catch {
      // not a URL — use raw value (client code)
    }
    return trimmed;
  }

  private findClientByCode(code: string): Collecte | undefined {
    const normalized = code.trim().toLowerCase();
    return this.portefeuille().find(item =>
      (item.clientCode?.toLowerCase() === normalized)
    );
  }

  onMontantChange(): void {
    if (this.syncFrom !== 'montant') return;
    const mj = this.selected?.montantJournalier || 0;
    if (mj > 0) {
      this.nombreJours = Math.round((this.montantRecu / mj) * 100) / 100;
    }
  }

  onJoursChange(): void {
    if (this.syncFrom !== 'jours') return;
    this.updateFromJours();
  }

  setSyncMode(mode: 'montant' | 'jours'): void {
    this.syncFrom = mode;
    if (mode === 'jours') this.updateFromJours();
    else this.onMontantChange();
  }

  private updateFromJours(): void {
    const mj = this.selected?.montantJournalier || 0;
    this.montantRecu = Math.round(mj * this.nombreJours);
  }

  private filterAndSort(list: Collecte[]): Collecte[] {
    const q = this.filterQ().trim().toLowerCase();
    let result = list;
    if (q) {
      result = result.filter(item =>
        (item.clientNom?.toLowerCase().includes(q)) ||
        (item.clientCode?.toLowerCase().includes(q))
      );
    }
    const sort = this.sortBy();
    return [...result].sort((a, b) => {
      if (sort === 'nom') {
        return (a.clientNom || '').localeCompare(b.clientNom || '', 'fr');
      }
      if (sort === 'solde') {
        return (b.soldeEpargne || 0) - (a.soldeEpargne || 0);
      }
      return (b.nombreJoursPayes || 0) - (a.nombreJoursPayes || 0);
    });
  }

  confirmCollecteForm(): void {
    if (this.montantRecu <= 0 || this.nombreJours <= 0) {
      this.notify('Montant ou nombre de jours invalide', 'error');
      return;
    }
    this.showCollecteForm = false;
    this.showSignature = true;
  }

  cancelCollecte(): void {
    this.showCollecteForm = false;
    this.showSignature = false;
    this.signingExisting = null;
    this.selected = null;
  }

  cancelSignature(): void {
    this.showSignature = false;
    if (this.signingExisting) {
      this.signingExisting = null;
      this.selected = null;
    } else {
      this.showCollecteForm = true;
    }
  }

  needsSignature(c: Collecte): boolean {
    return !c.annulee && !(c.signatureClient && c.signatureClient.trim());
  }

  ouvrirSignatureHistorique(c: Collecte): void {
    if (!c.id || !this.needsSignature(c)) return;
    this.signingExisting = c;
    this.selected = c;
    this.montantRecu = c.montantRecu ?? 0;
    this.nombreJours = c.nombreJoursPayes ?? 1;
    this.showCollecteForm = false;
    this.showSignature = true;
  }

  async annulerHistorique(c: Collecte): Promise<void> {
    if (!c.id || c.annulee) return;
    if (!(await this.ensureCaisseOuverte(c))) return;
    const ok = confirm(
      `Annuler la collecte ${c.numeroRecu} (${c.montantRecu} FCFA) pour ${c.clientNom} ?\n` +
      `Le montant sera retiré du solde du client.`
    );
    if (!ok) return;
    this.api.annulerCollecte(c.id).subscribe({
      next: () => {
        this.notify(`Collecte ${c.numeroRecu} annulée`);
        this.loadPortefeuille();
        this.loadHistorique();
      },
      error: err => this.notify(err?.error?.message || 'Erreur lors de l\'annulation', 'error')
    });
  }

  photoSrc(url?: string): string {
    if (!url) return '';
    return this.cms.resolveMediaUrl(url);
  }

  async onSigned(signature: string): Promise<void> {
    if (!this.selected) return;
    if (!(await this.ensureCaisseOuverte(this.selected))) return;

    if (this.signingExisting?.id) {
      this.api.signerCollecte(this.signingExisting.id, signature).subscribe({
        next: (c) => {
          this.showSignature = false;
          this.signingExisting = null;
          this.selected = null;
          this.notify(`Signature enregistrée — reçu ${c.numeroRecu}`);
          this.loadHistorique();
        },
        error: err => this.notify(err?.error?.message || 'Erreur lors de la signature', 'error')
      });
      return;
    }

    this.api.enregistrerCollecte({
      clientId: this.selected.clientId,
      agentId: this.agentId || undefined,
      montantRecu: this.montantRecu,
      nombreJoursPayes: this.nombreJours,
      signatureClient: signature
    }).subscribe({
      next: (c) => {
        this.showSignature = false;
        this.selected = null;
        this.notify(`Collecte validée — reçu ${c.numeroRecu} (${this.nombreJours} j)`);
        this.loadPortefeuille();
        this.loadHistorique();
      },
      error: err => this.notify(err?.error?.message || 'Erreur lors de la collecte', 'error')
    });
  }
}
