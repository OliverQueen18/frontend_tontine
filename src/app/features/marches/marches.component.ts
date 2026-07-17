import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { emptyMarcheForm, Marche, MarcheFormData, StatutEntity } from '../../core/models/models';
import { OsmMapPickerComponent } from '../../shared/components/osm-map-picker/osm-map-picker.component';

type StatutFilter = '' | StatutEntity;

@Component({
  selector: 'app-marches',
  standalone: true,
  imports: [FormsModule, OsmMapPickerComponent],
  templateUrl: './marches.component.html',
  styleUrl: './marches.component.scss'
})
export class MarchesComponent implements OnInit {
  marches = signal<Marche[]>([]);
  filterQ = signal('');
  filterStatut = signal<StatutFilter>('');

  showForm = false;
  showDetail = false;
  editingId: number | null = null;
  selected: Marche | null = null;

  form: MarcheFormData = emptyMarcheForm();
  message = signal('');

  filteredMarches = computed(() => {
    const q = this.filterQ().trim().toLowerCase();
    const statut = this.filterStatut();
    return this.marches().filter(m => {
      if (statut && m.statut !== statut) return false;
      if (!q) return true;
      return (m.nom?.toLowerCase().includes(q))
        || (m.code?.toLowerCase().includes(q))
        || (m.adresse?.toLowerCase().includes(q))
        || (m.description?.toLowerCase().includes(q));
    });
  });

  constructor(private api: ApiService, public auth: AuthService) {}

  get isAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE');
  }

  get pageTitle(): string {
    return this.auth.hasRole('AGENT') ? 'Mes marchés' : 'Marchés';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getMarches(agenceId).subscribe({
      next: m => this.marches.set(m),
      error: e => this.message.set(e?.error?.message || 'Impossible de charger les marchés')
    });
  }

  clearFilters(): void {
    this.filterQ.set('');
    this.filterStatut.set('');
  }

  openCreate(): void {
    this.editingId = null;
    this.form = emptyMarcheForm();
    this.showDetail = false;
    this.showForm = true;
  }

  openDetail(m: Marche): void {
    this.selected = m;
    this.showForm = false;
    this.showDetail = true;
  }

  openEdit(m: Marche): void {
    if (!this.canEdit(m)) return;
    this.editingId = m.id ?? null;
    this.form = {
      nom: m.nom,
      code: m.code ?? '',
      description: m.description ?? '',
      adresse: m.adresse ?? '',
      latitude: m.latitude ?? null,
      longitude: m.longitude ?? null
    };
    this.showDetail = false;
    this.showForm = true;
  }

  closeModals(): void {
    this.showForm = false;
    this.showDetail = false;
    this.selected = null;
    this.editingId = null;
  }

  onLocationPicked(event: { latitude: number; longitude: number; adresse?: string }): void {
    this.form.latitude = event.latitude;
    this.form.longitude = event.longitude;
    if (event.adresse) {
      this.form.adresse = event.adresse;
    }
  }

  save(): void {
    const err = this.validateForm();
    if (err) {
      this.message.set(err);
      return;
    }
    const payload = {
      nom: this.form.nom.trim(),
      code: this.form.code.trim() || undefined,
      description: this.form.description.trim() || undefined,
      adresse: this.form.adresse.trim(),
      latitude: this.form.latitude!,
      longitude: this.form.longitude!
    };

    const req = this.editingId
      ? this.api.updateMarche(this.editingId, payload)
      : this.api.createMarche(
          this.isAdmin && this.auth.agenceId()
            ? { ...payload, agenceId: this.auth.agenceId()! }
            : payload
        );

    req.subscribe({
      next: () => {
        this.closeModals();
        this.message.set(this.editingId ? 'Marché mis à jour' : 'Marché ajouté');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  desactiver(m: Marche): void {
    if (!m.id || !this.canSoftDelete() || m.statut !== 'ACTIF') return;
    if (!confirm(`Supprimer le marché « ${m.nom} » ?\nIl sera désactivé (suppression logique) et restera visible comme inactif.`)) return;
    this.api.desactiverMarche(m.id).subscribe({
      next: () => {
        this.closeModals();
        this.message.set('Marché désactivé (suppression logique)');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  reactiver(m: Marche): void {
    if (!m.id || !this.canSoftDelete() || m.statut === 'ACTIF') return;
    if (!confirm(`Réactiver le marché « ${m.nom} » ?`)) return;
    this.api.reactiverMarche(m.id).subscribe({
      next: () => {
        this.closeModals();
        this.message.set('Marché réactivé');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  supprimerDefinitivement(m: Marche): void {
    if (!m.id || !this.canHardDelete()) return;
    if (!confirm(
      `Supprimer DÉFINITIVEMENT le marché « ${m.nom} » ?\n` +
      `Cette action est irréversible. Impossible s'il reste des clients rattachés.`
    )) return;
    this.api.deleteMarche(m.id).subscribe({
      next: res => {
        this.closeModals();
        this.message.set(res.message || 'Marché supprimé définitivement');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  canEdit(m: Marche): boolean {
    return m.statut === 'ACTIF' && this.isAdmin;
  }

  /** Suppression logique (INACTIF) — admin agence ou super admin. */
  canSoftDelete(): boolean {
    return this.isAdmin;
  }

  /** Suppression physique — super admin uniquement. */
  canHardDelete(): boolean {
    return this.auth.hasRole('SUPER_ADMIN');
  }

  coordsLabel(m: Marche): string {
    if (m.latitude == null || m.longitude == null) return '—';
    return `${m.latitude.toFixed(5)}, ${m.longitude.toFixed(5)}`;
  }

  statutClass(statut?: StatutEntity): string {
    return statut === 'ACTIF' ? 'badge-success' : 'badge-danger';
  }

  private validateForm(): string | null {
    if (!this.form.nom.trim()) return 'Le nom du marché est obligatoire';
    if (!this.form.adresse.trim()) return 'La localisation (adresse) est obligatoire';
    if (this.form.latitude == null || this.form.longitude == null) {
      return 'Cliquez sur la carte pour indiquer l\'emplacement du marché';
    }
    return null;
  }
}
