import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { DemandeInscriptionBadgeService } from '../../core/services/demande-inscription-badge.service';
import { SiteContentService } from '../../core/services/site-content.service';
import { DemandeInscriptionAgence, MoyenPaiementMobile } from '../../core/models/models';

@Component({
  selector: 'app-demandes-inscription',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './demandes-inscription.component.html',
  styleUrl: './demandes-inscription.component.scss'
})
export class DemandesInscriptionComponent implements OnInit {
  readonly filterOptions = [
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'APPROUVEE', label: 'Approuvées' },
    { value: 'REJETEE', label: 'Rejetées' },
    { value: '', label: 'Toutes' }
  ];

  demandes = signal<DemandeInscriptionAgence[]>([]);
  filter = 'EN_ATTENTE';
  message = signal('');
  selected: DemandeInscriptionAgence | null = null;
  motifRejet = '';

  constructor(
    private api: ApiService,
    public cms: SiteContentService,
    private inscriptionBadge: DemandeInscriptionBadgeService
  ) {}

  ngOnInit(): void {
    this.load();
    this.inscriptionBadge.refresh();
  }

  setFilter(value: string): void {
    this.filter = value;
    this.load();
  }

  load(): void {
    this.api.getDemandesInscription(this.filter || undefined).subscribe(d => this.demandes.set(d));
  }

  openDetail(d: DemandeInscriptionAgence): void {
    this.selected = d;
    this.motifRejet = '';
  }

  closeDetail(): void {
    this.selected = null;
    this.motifRejet = '';
  }

  docUrl(url?: string): string {
    return url ? this.cms.resolveMediaUrl(url) : '';
  }

  statutClass(statut: DemandeInscriptionAgence['statut']): string {
    switch (statut) {
      case 'APPROUVEE': return 'badge-success';
      case 'REJETEE': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  statutLabel(statut: DemandeInscriptionAgence['statut']): string {
    switch (statut) {
      case 'APPROUVEE': return 'Approuvée';
      case 'REJETEE': return 'Rejetée';
      default: return 'En attente';
    }
  }

  paymentClass(moyen: MoyenPaiementMobile): string {
    return moyen === 'WAVE' ? 'pay-wave' : 'pay-om';
  }

  paymentLabel(moyen: MoyenPaiementMobile): string {
    return moyen === 'WAVE' ? 'WAVE' : 'Orange Money';
  }

  approuver(d: DemandeInscriptionAgence): void {
    if (!d.id || !confirm(`Approuver la demande de « ${d.agenceNom} » ?`)) return;
    this.api.approuverDemandeInscription(d.id).subscribe({
      next: () => {
        this.message.set('Demande approuvée — agence créée. Un e-mail de confirmation a été envoyé au demandeur.');
        this.closeDetail();
        this.load();
        this.inscriptionBadge.refresh();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  rejeter(): void {
    if (!this.selected?.id) return;
    if (!this.motifRejet.trim()) {
      this.message.set('Indiquez un motif de rejet');
      return;
    }
    this.api.rejeterDemandeInscription(this.selected.id, this.motifRejet.trim()).subscribe({
      next: () => {
        this.message.set('Demande rejetée. Un e-mail a été envoyé au demandeur.');
        this.closeDetail();
        this.load();
        this.inscriptionBadge.refresh();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }
}
