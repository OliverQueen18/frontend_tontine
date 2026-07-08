import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
  imports: [FormsModule, FcfaPipe, SignaturePadComponent, QrScannerComponent, DatePipe],
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
  message = signal('');
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

  constructor(private api: ApiService, public auth: AuthService, private cms: SiteContentService) {}

  ngOnInit(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getAgents(agenceId).subscribe(agents => {
      this.agents.set(agents);
      if (this.auth.isCollecteur()) {
        const userId = this.auth.user()?.id;
        const username = this.auth.user()?.username;
        const me = agents.find(a =>
          (userId != null && a.utilisateurId === userId) || a.username === username
        );
        if (me?.id) {
          this.agentId = me.id;
          this.loadPortefeuille();
        }
      } else if (agents.length) {
        this.agentId = agents[0].id!;
        this.loadPortefeuille();
      }
    });
    this.loadHistorique();
  }

  loadPortefeuille(): void {
    if (!this.agentId) return;
    this.api.portefeuille(this.agentId).subscribe(p => this.portefeuille.set(p));
  }

  loadHistorique(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getCollectes({ agenceId, agentId: this.agentId }).subscribe(h => this.historique.set(h));
  }

  clearFilters(): void {
    this.filterQ.set('');
    this.sortBy.set('nom');
  }

  isSelected(item: Collecte): boolean {
    return this.selected?.clientId === item.clientId && this.showCollecteForm;
  }

  startCollecte(item: Collecte): void {
    this.selected = item;
    this.nombreJours = 1;
    this.syncFrom = 'jours';
    this.updateFromJours();
    this.showCollecteForm = true;
    this.showSignature = false;
    this.showQrScanner = false;
  }

  openQrScanner(): void {
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
      this.message.set(`Aucun client « ${code} » dans ce portefeuille`);
      return;
    }
    this.startCollecte(item);
    this.message.set(`Client trouvé : ${item.clientNom}`);
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
      this.message.set('Montant ou nombre de jours invalide');
      return;
    }
    this.showCollecteForm = false;
    this.showSignature = true;
  }

  cancelCollecte(): void {
    this.showCollecteForm = false;
    this.showSignature = false;
    this.selected = null;
  }

  photoSrc(url?: string): string {
    if (!url) return '';
    return this.cms.resolveMediaUrl(url);
  }

  onSigned(signature: string): void {
    if (!this.selected) return;
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
        this.message.set(`Collecte validée — reçu ${c.numeroRecu} (${this.nombreJours} j)`);
        this.loadPortefeuille();
        this.loadHistorique();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur lors de la collecte')
    });
  }
}
