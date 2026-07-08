import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CategorieDepense, Client, Depense, SensOperation } from '../../core/models/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-depenses',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './depenses.component.html',
  styleUrl: './depenses.component.scss'
})
export class DepensesComponent implements OnInit {
  depenses = signal<Depense[]>([]);
  categories = signal<CategorieDepense[]>([]);
  clients = signal<Client[]>([]);
  showForm = false;
  form: Depense = this.empty();
  message = signal('');

  constructor(private api: ApiService, public auth: AuthService) {}

  get agenceId(): number | null {
    return this.auth.agenceId();
  }

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  load(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getDepenses(agenceId).subscribe(d => this.depenses.set(d));
  }

  loadCategories(): void {
    const agenceId = this.auth.agenceId();
    if (!agenceId) return;
    this.api.getCategoriesDepenses(agenceId, true).subscribe({
      next: cats => {
        this.categories.set(cats);
        if (cats.length && !this.form.categorie) {
          this.form.categorie = cats[0].nom;
        }
      }
    });
  }

  loadClients(): void {
    const agenceId = this.auth.agenceId();
    if (!agenceId) return;
    this.api.getClients(undefined, agenceId).subscribe(c => this.clients.set(c));
  }

  openCreate(): void {
    this.form = this.empty();
    if (this.auth.agenceId()) this.form.agenceId = this.auth.agenceId()!;
    const first = this.categories()[0];
    if (first) this.form.categorie = first.nom;
    this.loadClients();
    this.showForm = true;
  }

  onCategoryChange(): void {
    if (!this.selectedCategory()?.necessiteClient) {
      this.form.clientId = undefined;
    }
  }

  save(): void {
    const cat = this.selectedCategory();
    if (cat?.necessiteClient && !this.form.clientId) {
      this.message.set('Veuillez sélectionner un client pour cette catégorie');
      return;
    }
    this.api.createDepense(this.form).subscribe({
      next: () => {
        this.showForm = false;
        this.message.set('Opération enregistrée');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  valider(d: Depense): void {
    if (!d.id) return;
    this.api.validerDepense(d.id).subscribe({
      next: () => {
        this.message.set(this.validationSuccessMessage(d.categorie));
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  selectedCategory(): CategorieDepense | undefined {
    return this.categories().find(c => c.nom === this.form.categorie);
  }

  categoryByName(nom: string): CategorieDepense | undefined {
    return this.categories().find(c => c.nom === nom);
  }

  sensLabel(sens?: SensOperation): string {
    return sens === 'ENTREE' ? 'Entrée' : 'Sortie';
  }

  sensClass(sens?: SensOperation): string {
    return sens === 'ENTREE' ? 'sens-entree' : 'sens-sortie';
  }

  formatMontant(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  validationSuccessMessage(categorieNom: string): string {
    const cat = this.categoryByName(categorieNom);
    if (cat?.necessiteMouvementCaisse === false) {
      return 'Opération validée (sans mouvement de caisse)';
    }
    return 'Opération validée et passée en caisse';
  }

  private empty(): Depense {
    return { agenceId: 0, categorie: '', montant: 0, observation: '' };
  }
}
