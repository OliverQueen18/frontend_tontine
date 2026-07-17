import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agence, SimulationResultat } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-simulateur',
  standalone: true,
  imports: [FormsModule, FcfaPipe, DatePipe],
  templateUrl: './simulateur.component.html',
  styleUrl: './simulateur.component.scss'
})
export class SimulateurComponent implements OnInit {
  agences = signal<Agence[]>([]);
  result = signal<SimulationResultat | null>(null);
  loading = signal(false);
  error = signal('');

  debut = '';
  fin = '';
  filterAgenceId: number | null = null;

  readonly isSuperAdmin = computed(() => this.auth.hasRole('SUPER_ADMIN'));

  constructor(private api: ApiService, public auth: AuthService) {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    this.debut = this.toInputDate(first);
    this.fin = this.toInputDate(today);
  }

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.api.getAgences().subscribe(a => this.agences.set(a.filter(x => x.statut !== 'INACTIF')));
    } else {
      this.filterAgenceId = this.auth.agenceId();
    }
    this.simuler();
  }

  simuler(): void {
    if (!this.debut || !this.fin) {
      this.error.set('Choisissez une période (date de début et de fin)');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.simuler({
      debut: this.debut,
      fin: this.fin,
      agenceId: this.isSuperAdmin() ? this.filterAgenceId : this.auth.agenceId()
    }).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.result.set(null);
        this.error.set(err?.error?.message || 'Impossible de lancer la simulation');
      }
    });
  }

  tauxAdminPercent(taux: number | null | undefined): string {
    if (taux == null) return '—';
    return (taux * 100).toFixed(2).replace(/\.?0+$/, '') + ' %';
  }

  private toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
