import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agence, Caisse } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { CaisseReceiptComponent } from '../../shared/components/caisse-receipt/caisse-receipt.component';

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [FormsModule, FcfaPipe, DatePipe, NgClass, CaisseReceiptComponent],
  templateUrl: './caisse.component.html',
  styleUrl: './caisse.component.scss'
})
export class CaisseComponent implements OnInit {
  @ViewChild(CaisseReceiptComponent) receiptComp?: CaisseReceiptComponent;

  caisse = signal<Caisse | null>(null);
  historique = signal<Caisse[]>([]);
  anterieuresOuvertes = signal<Caisse[]>([]);
  agences = signal<Agence[]>([]);
  agenceId: number | null = null;
  soldeInitial: number | null = null;
  soldeReel: number | null = null;
  observation = '';
  message = signal('');

  /** Mode consultation période vs caisse du jour. */
  mode: 'jour' | 'periode' = 'jour';
  debut = '';
  fin = '';
  selectedDate = '';

  showReceipt = false;
  receiptCaisse: Caisse | null = null;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    const today = new Date();
    this.fin = this.toIso(today);
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    this.debut = this.toIso(first);
    this.selectedDate = this.fin;

    if (this.auth.hasRole('SUPER_ADMIN')) {
      this.api.getAgences().subscribe(a => {
        this.agences.set(a.filter(x => x.statut === 'ACTIF'));
        if (this.agences().length) {
          this.agenceId = this.agences()[0].id!;
          this.refreshControleEtJour();
        }
      });
    } else {
      this.agenceId = this.auth.agenceId();
      this.refreshControleEtJour();
    }
  }

  get isTodayView(): boolean {
    return this.mode === 'jour' || this.selectedDate === this.toIso(new Date());
  }

  get canManageToday(): boolean {
    return this.isTodayView && this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER');
  }

  get canGererCloture(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER');
  }

  /** Peut clôturer la caisse affichée si elle est ouverte. */
  get canCloturerCaisseAffichee(): boolean {
    return !!this.caisse() && this.caisse()!.statut === 'OUVERTE' && this.canGererCloture;
  }

  get hasAnterieuresOuvertes(): boolean {
    return this.anterieuresOuvertes().length > 0;
  }

  onAgenceChange(): void {
    this.refreshControleEtJour();
    if (this.mode === 'periode') {
      this.loadHistorique();
    }
  }

  setMode(mode: 'jour' | 'periode'): void {
    this.mode = mode;
    if (mode === 'jour') {
      this.selectedDate = this.toIso(new Date());
      this.refreshControleEtJour();
    } else {
      this.loadHistorique();
    }
  }

  refreshControleEtJour(): void {
    if (!this.agenceId) return;
    this.api.getCaisseControle(this.agenceId).subscribe({
      next: ctrl => {
        this.anterieuresOuvertes.set(ctrl.caissesAnterieuresOuvertes || []);
        if (this.hasAnterieuresOuvertes) {
          // Forcer le focus sur la plus ancienne caisse antérieure ouverte
          const premiere = this.anterieuresOuvertes()[0];
          if (premiere?.dateCaisse) {
            this.mode = 'periode';
            this.selectedDate = premiere.dateCaisse;
            // Étendre la période pour inclure la caisse antérieure
            if (premiere.dateCaisse < this.debut) {
              this.debut = premiere.dateCaisse;
            }
            this.loadHistorique();
            return;
          }
        }
        if (this.mode === 'jour') {
          this.loadJour();
        }
      },
      error: () => {
        this.anterieuresOuvertes.set([]);
        if (this.mode === 'jour') {
          this.loadJour();
        }
      }
    });
  }

  loadJour(): void {
    if (!this.agenceId) return;
    this.selectedDate = this.toIso(new Date());
    this.api.getCaisseJour(this.agenceId).subscribe({
      next: c => this.caisse.set(c),
      error: () => this.caisse.set(null)
    });
  }

  loadHistorique(): void {
    if (!this.agenceId) return;
    this.api.getCaisseHistorique(this.agenceId, this.debut, this.fin).subscribe({
      next: list => {
        this.historique.set(list);
        if (list.length && !list.some(c => c.dateCaisse === this.selectedDate)) {
          this.openCaisseDate(list[0].dateCaisse!);
        } else if (this.selectedDate) {
          this.openCaisseDate(this.selectedDate);
        } else {
          this.caisse.set(null);
        }
      },
      error: err => this.message.set(err?.error?.message || 'Erreur chargement historique')
    });
  }

  openCaisseDate(date: string): void {
    if (!this.agenceId || !date) return;
    this.selectedDate = date;
    this.api.getCaisseDetail(this.agenceId, date).subscribe({
      next: c => this.caisse.set(c),
      error: err => {
        this.caisse.set(null);
        this.message.set(err?.error?.message || 'Caisse introuvable');
      }
    });
  }

  ouvrir(): void {
    if (!this.agenceId) return;
    if (this.hasAnterieuresOuvertes) {
      this.message.set(
        'Clôturez d\'abord les caisses antérieures encore ouvertes avant d\'ouvrir la caisse du jour.'
      );
      return;
    }
    this.api.ouvrirCaisse(this.agenceId, this.soldeInitial ?? undefined).subscribe({
      next: c => {
        this.caisse.set(c);
        this.message.set('Caisse ouverte');
        this.refreshControleEtJour();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  cloturer(): void {
    if (!this.agenceId || this.soldeReel == null) return;
    const dateCaisse = this.caisse()?.dateCaisse || this.selectedDate;
    this.api.cloturerCaisse(this.agenceId, this.soldeReel, this.observation, dateCaisse).subscribe({
      next: c => {
        this.caisse.set(c);
        this.soldeReel = null;
        this.observation = '';
        this.message.set('Caisse clôturée — reçu d\'arrêté généré');
        this.ouvrirRecu(c);
        this.refreshControleEtJour();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  allerCloturerAnterieure(date: string): void {
    this.mode = 'periode';
    if (date < this.debut) {
      this.debut = date;
    }
    this.selectedDate = date;
    this.loadHistorique();
  }

  annulerCloture(): void {
    const c = this.caisse();
    if (!c?.id) return;
    if (!confirm('Annuler la clôture de cette caisse ? Elle sera réouverte et le solde réel sera effacé.')) {
      return;
    }
    this.api.annulerClotureCaisse(c.id).subscribe({
      next: updated => {
        this.caisse.set(updated);
        this.soldeReel = null;
        this.observation = '';
        this.message.set('Clôture annulée — caisse réouverte');
        this.refreshControleEtJour();
        if (this.mode === 'periode') {
          this.loadHistorique();
        }
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  supprimerCaisse(): void {
    const c = this.caisse();
    if (!c?.id) return;
    if (!confirm(
      `Supprimer définitivement la caisse du ${c.dateCaisse} ?\n`
      + 'Possible uniquement s\'il n\'y a pas de mouvements métier (collectes, restitutions…).'
    )) {
      return;
    }
    this.api.supprimerCaisse(c.id).subscribe({
      next: () => {
        this.caisse.set(null);
        this.message.set('Caisse supprimée');
        this.refreshControleEtJour();
        if (this.mode === 'periode') {
          this.loadHistorique();
        }
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  ouvrirRecu(c?: Caisse | null): void {
    const target = c || this.caisse();
    if (!target) return;
    // Recharger le détail complet si mouvements absents (liste période)
    if ((!target.mouvements || !target.mouvements.length) && target.agenceId && target.dateCaisse) {
      this.api.getCaisseDetail(target.agenceId, target.dateCaisse).subscribe({
        next: full => {
          this.receiptCaisse = full;
          this.showReceipt = true;
        },
        error: () => {
          this.receiptCaisse = target;
          this.showReceipt = true;
        }
      });
      return;
    }
    this.receiptCaisse = target;
    this.showReceipt = true;
  }

  fermerRecu(): void {
    this.showReceipt = false;
    this.receiptCaisse = null;
  }

  imprimerRecu(): void {
    this.receiptComp?.print();
  }

  exportExcel(): void {
    const c = this.caisse();
    if (!c) return;

    const agenceNom = c.agenceNom
      || this.agences().find(a => a.id === this.agenceId)?.nom
      || this.auth.user()?.agenceNom
      || '';
    const rows: string[][] = [
      ['Caisse', agenceNom],
      ['Date', c.dateCaisse || ''],
      ['Statut', c.statut || ''],
      ['Solde initial', String(c.soldeInitial ?? '')],
      ['Total entrées', String(c.totalEntrees ?? '')],
      ['Total sorties', String(c.totalSorties ?? '')],
      ['Solde théorique', String(c.soldeTheorique ?? '')],
      ['Solde réel', String(c.soldeReel ?? '')],
      ['Écart', String(c.ecart ?? '')],
      ['Observation', c.observation || ''],
      [],
      ['Heure', 'Type', 'Catégorie', 'Libellé', 'Référence', 'Montant'],
      ...(c.mouvements || []).map(m => [
        m.dateHeure || '',
        m.type || '',
        m.categorie || '',
        m.libelle || '',
        m.reference || '',
        String(m.montant ?? '')
      ])
    ];

    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caisse-${c.dateCaisse || 'jour'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
