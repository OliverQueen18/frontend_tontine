import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Agence, Agent, Dashboard } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { DashboardChartComponent } from '../../shared/components/dashboard-chart/dashboard-chart.component';
import { ChartConfiguration } from 'chart.js';

type PeriodePreset = 'jour' | 'semaine' | 'mois' | 'custom';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, FcfaPipe, DashboardChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  data = signal<Dashboard | null>(null);
  loading = signal(false);
  agences = signal<Agence[]>([]);
  agents = signal<Agent[]>([]);

  evolutionChart = signal<ChartConfiguration | null>(null);
  topAgentsChart = signal<ChartConfiguration | null>(null);
  financeChart = signal<ChartConfiguration | null>(null);
  operationsChart = signal<ChartConfiguration | null>(null);

  periode: PeriodePreset = 'mois';
  filterAgenceId: number | null = null;
  filterAgentId: number | null = null;
  filterDebut = '';
  filterFin = '';

  constructor(private api: ApiService, public auth: AuthService) {}

  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN');
  }

  get canFilterAgence(): boolean {
    return this.isSuperAdmin;
  }

  get canFilterAgent(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE');
  }

  get isAgentView(): boolean {
    return this.auth.hasRole('AGENT');
  }

  ngOnInit(): void {
    if (this.canFilterAgence) {
      this.api.getAgences().subscribe(a => this.agences.set(a.filter(x => x.statut === 'ACTIF')));
    }
    if (this.canFilterAgent) {
      const agenceId = this.isSuperAdmin ? null : this.auth.agenceId();
      this.api.getAgents(agenceId).subscribe(a => this.agents.set(a));
    }
    this.applyPeriodePreset();
    this.load();
  }

  onPeriodeChange(): void {
    if (this.periode !== 'custom') {
      this.applyPeriodePreset();
    }
    this.load();
  }

  onAgenceFilterChange(): void {
    this.filterAgentId = null;
    if (this.canFilterAgent) {
      this.api.getAgents(this.filterAgenceId).subscribe(a => this.agents.set(a));
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: {
      agenceId?: number | null;
      agentId?: number | null;
      debut?: string | null;
      fin?: string | null;
    } = {};

    if (this.canFilterAgence && this.filterAgenceId) {
      params.agenceId = this.filterAgenceId;
    }
    if (this.canFilterAgent && this.filterAgentId) {
      params.agentId = this.filterAgentId;
    }
    if (this.filterDebut) params.debut = this.filterDebut;
    if (this.filterFin) params.fin = this.filterFin;

    this.api.dashboard(params).subscribe({
      next: d => {
        this.data.set(d);
        this.buildCharts(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters(): void {
    this.periode = 'mois';
    this.filterAgenceId = null;
    this.filterAgentId = null;
    this.applyPeriodePreset();
    if (this.canFilterAgent) {
      const agenceId = this.isSuperAdmin ? null : this.auth.agenceId();
      this.api.getAgents(agenceId).subscribe(a => this.agents.set(a));
    }
    this.load();
  }

  evolutionTitle(): string {
    const d = this.data();
    if (!d?.periodeDebut || !d?.periodeFin) return 'Évolution des collectes';
    return `Évolution des collectes (${d.periodeDebut} → ${d.periodeFin})`;
  }

  private buildCharts(d: Dashboard): void {
    this.evolutionChart.set(this.buildEvolutionChart(d));
    this.topAgentsChart.set(d.vueAgent || !d.topAgents.length ? null : this.buildTopAgentsChart(d));
    this.financeChart.set(d.vueAgent ? null : this.buildFinanceChart(d));
    this.operationsChart.set(d.vueAgent ? null : this.buildOperationsChart(d));
  }

  private buildEvolutionChart(d: Dashboard): ChartConfiguration {
    const labels = d.evolutionCollectes.map(p => this.formatShortDate(p.date));
    const values = d.evolutionCollectes.map(p => Number(p.montant) || 0);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Collectes',
          data: values,
          borderColor: '#1a5632',
          backgroundColor: 'rgba(26, 86, 50, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#1a5632'
        }]
      },
      options: this.baseOptions('line')
    };
  }

  private buildTopAgentsChart(d: Dashboard): ChartConfiguration {
    const agents = d.topAgents.filter(a => (Number(a.montant) || 0) > 0);
    const labels = agents.map(a => a.nom);
    const values = agents.map(a => Number(a.montant) || 0);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Collectes du jour',
          data: values,
          backgroundColor: ['#1a5632', '#2563eb', '#0f766e', '#7c3aed', '#a16207'],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        ...this.baseOptions('bar'),
        indexAxis: 'y' as const,
        plugins: {
          ...this.baseOptions('bar').plugins,
          legend: { display: false }
        }
      }
    };
  }

  private buildFinanceChart(d: Dashboard): ChartConfiguration<'doughnut'> {
    const commissions = Number(d.montantCommissionsPeriode) || 0;
    const depenses = Number(d.montantDepensesPeriode) || 0;
    const benefice = Number(d.beneficeGlobal) || 0;
    const base = this.baseOptions('doughnut');

    return {
      type: 'doughnut',
      data: {
        labels: ['Commissions', 'Dépenses', 'Bénéfice net'],
        datasets: [{
          data: [commissions, depenses, Math.max(0, benefice)],
          backgroundColor: ['#2563eb', '#dc2626', '#1a5632'],
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: base.responsive,
        maintainAspectRatio: base.maintainAspectRatio,
        cutout: '62%',
        plugins: base.plugins
      }
    };
  }

  private buildOperationsChart(d: Dashboard): ChartConfiguration {
    const entree = Number(d.montantOperationsEntree) || 0;
    const sortie = Number(d.montantOperationsSortie) || 0;

    return {
      type: 'bar',
      data: {
        labels: ['Entrées caisse', 'Sorties caisse'],
        datasets: [{
          label: 'Montant',
          data: [entree, sortie],
          backgroundColor: ['#16a34a', '#dc2626'],
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        ...this.baseOptions('bar'),
        plugins: {
          ...this.baseOptions('bar').plugins,
          legend: { display: false }
        }
      }
    };
  }

  private baseOptions(type: 'line' | 'bar' | 'doughnut') {
    const isCircular = type === 'doughnut';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isCircular,
          position: 'bottom' as const,
          labels: { boxWidth: 12, padding: 14, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx: { label?: string; parsed: unknown; dataset?: { label?: string } }) => {
              let value = 0;
              if (typeof ctx.parsed === 'number') {
                value = ctx.parsed;
              } else if (ctx.parsed && typeof ctx.parsed === 'object') {
                const p = ctx.parsed as { x?: number; y?: number };
                value = Number(p.x ?? p.y ?? 0);
              }
              const label = ctx.label || ctx.dataset?.label || '';
              return `${label}: ${this.formatFcfa(value)}`;
            }
          }
        }
      },
      scales: isCircular ? undefined : {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 45 }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.25)' },
          ticks: {
            font: { size: 11 },
            callback: (v: string | number) => this.formatCompact(Number(v))
          }
        }
      }
    };
  }

  private formatShortDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  private formatFcfa(value: number): string {
    return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
  }

  private formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return String(value);
  }

  private applyPeriodePreset(): void {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const fin = fmt(today);
    let debut = fin;

    if (this.periode === 'jour') {
      debut = fin;
    } else if (this.periode === 'semaine') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      debut = fmt(d);
    } else if (this.periode === 'mois') {
      debut = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
    }
    this.filterDebut = debut;
    this.filterFin = fin;
  }
}
