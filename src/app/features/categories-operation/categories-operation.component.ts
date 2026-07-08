import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agence, CategorieDepense, SensOperation } from '../../core/models/models';

@Component({
  selector: 'app-categories-operation',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './categories-operation.component.html',
  styleUrl: './categories-operation.component.scss'
})
export class CategoriesOperationComponent implements OnInit {
  categories = signal<CategorieDepense[]>([]);
  agences = signal<Agence[]>([]);
  filterAgenceId: number | null = null;
  showForm = false;
  formNom = '';
  formSens: SensOperation = 'SORTIE';
  formNecessiteMouvementCaisse = true;
  formNecessiteClient = false;
  filterSens: SensOperation | '' = '';
  message = signal('');

  constructor(private api: ApiService, public auth: AuthService) {}

  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN');
  }

  get scopedAgenceId(): number | null {
    if (this.isSuperAdmin) return this.filterAgenceId;
    return this.auth.agenceId();
  }

  get canToggleAgenceStatus(): boolean {
    return this.scopedAgenceId != null;
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.api.getAgences().subscribe(a => this.agences.set(a));
    } else {
      this.filterAgenceId = this.auth.agenceId();
    }
    this.load();
  }

  load(): void {
    this.api.getCategoriesDepenses(this.scopedAgenceId ?? undefined, false)
      .subscribe(cats => this.categories.set(cats));
  }

  onAgenceFilterChange(): void {
    this.load();
  }

  filteredCategories(): CategorieDepense[] {
    const sens = this.filterSens;
    if (!sens) return this.categories();
    return this.categories().filter(c => (c.sens ?? 'SORTIE') === sens);
  }

  openCreate(): void {
    this.resetForm();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  saveCategory(): void {
    const nom = this.formNom.trim();
    if (!nom) return;
    this.api.createCategorieDepense(nom, this.formSens, {
      necessiteMouvementCaisse: this.formNecessiteMouvementCaisse,
      necessiteClient: this.formNecessiteClient,
      agenceId: this.scopedAgenceId
    }).subscribe({
      next: () => {
        this.closeForm();
        this.message.set('Catégorie ajoutée — visible par toutes les agences');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  deactivateCategory(c: CategorieDepense): void {
    if (!c.id || !this.canToggleAgenceStatus) return;
    const agenceLabel = this.isSuperAdmin
      ? this.agences().find(a => a.id === this.scopedAgenceId)?.nom ?? 'cette agence'
      : 'votre agence';
    if (!confirm(`Masquer « ${c.nom} » pour ${agenceLabel} ?`)) return;
    this.api.desactiverCategorieDepense(c.id, this.scopedAgenceId!).subscribe({
      next: () => {
        this.message.set('Catégorie désactivée pour cette agence');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  reactivateCategory(c: CategorieDepense): void {
    if (!c.id || !this.canToggleAgenceStatus) return;
    this.api.reactiverCategorieDepense(c.id, this.scopedAgenceId!).subscribe({
      next: () => {
        this.message.set('Catégorie réactivée pour cette agence');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  sensLabel(sens?: SensOperation): string {
    return sens === 'ENTREE' ? 'Entrée' : 'Sortie';
  }

  sensClass(sens?: SensOperation): string {
    return sens === 'ENTREE' ? 'sens-entree' : 'sens-sortie';
  }

  ouiNon(value?: boolean): string {
    return value ? 'Oui' : 'Non';
  }

  statutLabel(c: CategorieDepense): string {
    if (!this.canToggleAgenceStatus) return c.statut === 'ACTIF' ? 'Active' : 'Inactive';
    return c.statut === 'ACTIF' ? 'Active (agence)' : 'Inactive (agence)';
  }

  private resetForm(): void {
    this.formNom = '';
    this.formSens = 'SORTIE';
    this.formNecessiteMouvementCaisse = true;
    this.formNecessiteClient = false;
  }
}
