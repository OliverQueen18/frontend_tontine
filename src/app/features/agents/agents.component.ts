import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agent, Agence, Marche, StatutEntity } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [FormsModule, FcfaPipe, NgClass],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss'
})
export class AgentsComponent implements OnInit {
  readonly statutOptions = [
    { value: '', label: 'Tous' },
    { value: 'ACTIF', label: 'Actifs' },
    { value: 'INACTIF', label: 'Suspendus' }
  ];

  agents = signal<Agent[]>([]);
  agences = signal<Agence[]>([]);
  marches = signal<Marche[]>([]);
  filterQ = signal('');
  filterStatut = signal('');
  showForm = false;
  selected: Agent | null = null;
  form: Agent = this.empty();
  selectedMarcheIds: number[] = [];
  message = signal('');

  filteredAgents = computed(() => {
    const q = this.filterQ().trim().toLowerCase();
    const statut = this.filterStatut();
    return this.agents().filter(a => {
      if (statut && a.statut !== statut) return false;
      if (!q) return true;
      return [a.code, a.nomComplet, a.telephone, a.agenceNom, a.username, ...a.marcheNoms ?? []]
        .some(v => v?.toLowerCase().includes(q));
    });
  });

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.load();
    this.api.getAgences().subscribe(a => this.agences.set(a.filter(x => x.statut === 'ACTIF')));
  }

  setStatutFilter(value: string): void {
    this.filterStatut.set(value);
  }

  clearFilters(): void {
    this.filterQ.set('');
    this.filterStatut.set('');
  }

  load(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getAgents(agenceId).subscribe(a => this.agents.set(a));
  }

  openDetail(a: Agent): void {
    this.selected = a;
  }

  closeDetail(): void {
    this.selected = null;
  }

  openCreate(): void {
    this.closeDetail();
    this.form = this.empty();
    this.selectedMarcheIds = [];
    if (this.auth.agenceId()) {
      this.form.agenceId = this.auth.agenceId()!;
      this.loadMarches(this.form.agenceId);
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onAgenceChange(): void {
    this.selectedMarcheIds = [];
    this.loadMarches(this.form.agenceId);
  }

  loadMarches(agenceId: number): void {
    this.api.getMarches(agenceId).subscribe(m => this.marches.set(m));
  }

  toggleMarche(id: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedMarcheIds.includes(id)) {
        this.selectedMarcheIds = [...this.selectedMarcheIds, id];
      }
    } else {
      this.selectedMarcheIds = this.selectedMarcheIds.filter(x => x !== id);
    }
  }

  isMarcheSelected(id: number): boolean {
    return this.selectedMarcheIds.includes(id);
  }

  marchesLabel(a: Agent): string {
    if (a.marcheNoms?.length) return a.marcheNoms.join(', ');
    return a.marcheNom || '—';
  }

  statutClass(statut?: StatutEntity): string {
    return statut === 'ACTIF' ? 'badge-success' : 'badge-muted';
  }

  statutLabel(statut?: StatutEntity): string {
    return statut === 'INACTIF' ? 'Suspendu' : 'Actif';
  }

  save(): void {
    this.form.marcheIds = this.selectedMarcheIds;
    this.api.createAgent(this.form).subscribe({
      next: () => {
        this.closeForm();
        this.message.set('Agent créé');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  suspendre(a: Agent): void {
    if (!a.id || !confirm('Suspendre cet agent ?')) return;
    this.api.suspendreAgent(a.id).subscribe(() => {
      this.closeDetail();
      this.load();
    });
  }

  private empty(): Agent {
    return {
      nomComplet: '',
      telephone: '',
      agenceId: 0,
      username: '',
      password: 'agent123'
    };
  }
}
