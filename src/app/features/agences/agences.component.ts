import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { SiteContentService } from '../../core/services/site-content.service';
import { Agence, StatutEntity } from '../../core/models/models';
import { GrilleCommissionEditorComponent } from '../../shared/components/grille-commission-editor/grille-commission-editor.component';
import { OsmMapPickerComponent } from '../../shared/components/osm-map-picker/osm-map-picker.component';

@Component({
  selector: 'app-agences',
  standalone: true,
  imports: [FormsModule, NgClass, GrilleCommissionEditorComponent, OsmMapPickerComponent],
  templateUrl: './agences.component.html',
  styleUrl: './agences.component.scss'
})
export class AgencesComponent implements OnInit {
  readonly statutOptions = [
    { value: '', label: 'Tous' },
    { value: 'ACTIF', label: 'Actives' },
    { value: 'INACTIF', label: 'Inactives' }
  ];

  agences = signal<Agence[]>([]);
  filterQ = signal('');
  filterStatut = signal('');
  showForm = false;
  showGrille = false;
  editing: Agence | null = null;
  selected: Agence | null = null;
  grilleAgence: Agence | null = null;
  form: Agence = this.empty();
  logoPreview = '';
  message = signal('');
  commissionAdminPercent = 5;
  defaultCommissionAdminPercent = 5;

  filteredAgences = computed(() => {
    const q = this.filterQ().trim().toLowerCase();
    const statut = this.filterStatut();
    return this.agences().filter(a => {
      if (statut && a.statut !== statut) return false;
      if (!q) return true;
      return [a.code, a.nom, a.responsable, a.ville, a.telephone, a.email, a.adresse]
        .some(v => v?.toLowerCase().includes(q));
    });
  });

  constructor(private api: ApiService, public cms: SiteContentService) {}

  ngOnInit(): void {
    this.load();
    this.loadPlatformDefault();
  }

  loadPlatformDefault(): void {
    this.api.getPlatformSettings().subscribe({
      next: s => {
        this.defaultCommissionAdminPercent = this.toPercent(s.tauxCommissionAdminDefaut ?? 0.05);
      },
      error: () => {}
    });
  }

  get mapAddress(): string {
    return [this.form.ville, this.form.adresse].filter(v => v?.trim()).join(', ');
  }

  load(): void {
    this.api.getAgences().subscribe(a => this.agences.set(a));
  }

  setStatutFilter(value: string): void {
    this.filterStatut.set(value);
  }

  clearFilters(): void {
    this.filterQ.set('');
    this.filterStatut.set('');
  }

  openDetail(a: Agence): void {
    this.selected = a;
  }

  closeDetail(): void {
    this.selected = null;
  }

  openCreate(): void {
    this.closeDetail();
    this.editing = null;
    this.form = this.empty();
    this.commissionAdminPercent = this.defaultCommissionAdminPercent;
    this.logoPreview = '';
    this.showForm = true;
  }

  openEdit(a: Agence): void {
    this.closeDetail();
    this.editing = a;
    this.form = {
      ...a,
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null
    };
    this.commissionAdminPercent = a.tauxCommissionAdmin != null
      ? this.toPercent(a.tauxCommissionAdmin)
      : this.defaultCommissionAdminPercent;
    this.logoPreview = a.logoUrl ? this.cms.resolveMediaUrl(a.logoUrl) : '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editing = null;
  }

  onLocationPicked(event: { latitude: number; longitude: number; adresse?: string }): void {
    this.form.latitude = event.latitude;
    this.form.longitude = event.longitude;
    if (event.adresse && !this.form.adresse?.trim()) {
      this.form.adresse = event.adresse;
    }
  }

  save(): void {
    if (this.form.latitude == null || this.form.longitude == null) {
      this.message.set('Positionnez l\'agence sur la carte');
      return;
    }
    if (this.commissionAdminPercent < 0 || this.commissionAdminPercent > 100) {
      this.message.set('Le taux de commission admin doit être entre 0 et 100 %');
      return;
    }
    this.form.tauxCommissionAdmin = this.toRate(this.commissionAdminPercent);
    const req = this.editing?.id
      ? this.api.updateAgence(this.editing.id, this.form)
      : this.api.createAgence(this.form);
    req.subscribe({
      next: () => {
        this.closeForm();
        this.message.set('Agence enregistrée');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  desactiver(a: Agence): void {
    if (!a.id || !confirm('Désactiver cette agence ?')) return;
    this.api.desactiverAgence(a.id).subscribe(() => {
      this.closeDetail();
      this.load();
    });
  }

  supprimer(a: Agence): void {
    if (!a.id) return;
    const ok = confirm(
      `Supprimer définitivement l'agence « ${a.nom} » ?\n\n` +
      `Cette action est irréversible et effacera tous les agents, clients, collectes, ` +
      `restitutions, dépenses, caisses et utilisateurs liés à cette agence.`
    );
    if (!ok) return;
    const confirmCode = prompt(`Pour confirmer, saisissez le code agence : ${a.code}`);
    if (confirmCode !== a.code) {
      this.message.set('Suppression annulée : code incorrect');
      return;
    }
    this.api.supprimerAgence(a.id).subscribe({
      next: () => {
        this.closeDetail();
        this.message.set('Agence supprimée définitivement');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur lors de la suppression')
    });
  }

  openGrille(a: Agence): void {
    this.closeDetail();
    this.grilleAgence = a;
    this.showGrille = true;
  }

  closeGrille(): void {
    this.showGrille = false;
    this.grilleAgence = null;
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.uploadPublicMedia(file).subscribe({
      next: res => {
        this.form.logoUrl = res.url;
        this.logoPreview = this.cms.resolveMediaUrl(res.url);
      },
      error: err => this.message.set(err?.error?.message || 'Erreur upload logo')
    });
  }

  formatCoords(a: Agence): string {
    if (a.latitude == null || a.longitude == null) return '—';
    return `${a.latitude.toFixed(5)}, ${a.longitude.toFixed(5)}`;
  }

  statutClass(statut?: StatutEntity): string {
    return statut === 'ACTIF' ? 'badge-success' : 'badge-muted';
  }

  statutLabel(statut?: StatutEntity): string {
    return statut === 'INACTIF' ? 'Inactive' : 'Active';
  }

  logoUrl(a: Agence): string {
    return a.logoUrl ? this.cms.resolveMediaUrl(a.logoUrl) : '';
  }

  formatCommissionAdmin(a: Agence): string {
    const rate = a.tauxCommissionAdmin ?? this.toRate(this.defaultCommissionAdminPercent);
    return `${this.toPercent(rate).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;
  }

  private toPercent(rate: number): number {
    return Math.round(rate * 10000) / 100;
  }

  private toRate(percent: number): number {
    return percent / 100;
  }

  private empty(): Agence {
    return {
      nom: '',
      responsable: '',
      telephone: '',
      ville: '',
      adresse: '',
      latitude: null,
      longitude: null
    };
  }
}
