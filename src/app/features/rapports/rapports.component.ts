import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Collecte, Depense, Restitution } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [FcfaPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Rapports</h1>
        <p>Collectes, restitutions, opérations et exports</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" (click)="exportCsv()">Export CSV</button>
      </div>
    </div>

    <div class="tabs">
      <button class="btn" [class.btn-primary]="tab==='collectes'" [class.btn-secondary]="tab!=='collectes'" (click)="tab='collectes'">Collectes</button>
      <button class="btn" [class.btn-primary]="tab==='restitutions'" [class.btn-secondary]="tab!=='restitutions'" (click)="tab='restitutions'">Restitutions</button>
      <button class="btn" [class.btn-primary]="tab==='depenses'" [class.btn-secondary]="tab!=='depenses'" (click)="tab='depenses'">Opérations</button>
    </div>

    <div class="card table-card" style="margin-top:1rem">
      @if (tab === 'collectes') {
        <table>
          <thead><tr><th>Date</th><th>Reçu</th><th>Client</th><th>Agent</th><th>Montant</th></tr></thead>
          <tbody>
            @for (c of collectes(); track c.id) {
              <tr>
                <td>{{ c.dateHeure | date:'dd/MM/yyyy' }}</td>
                <td>{{ c.numeroRecu }}</td>
                <td>{{ c.clientNom }}</td>
                <td>{{ c.agentNom }}</td>
                <td>{{ c.montantRecu | fcfa }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
      @if (tab === 'restitutions') {
        <table>
          <thead><tr><th>Date</th><th>Reçu</th><th>Client</th><th>Commission</th><th>Net</th></tr></thead>
          <tbody>
            @for (r of restitutions(); track r.id) {
              <tr>
                <td>{{ r.dateHeure | date:'dd/MM/yyyy' }}</td>
                <td>{{ r.numeroRecu }}</td>
                <td>{{ r.clientNom }}</td>
                <td>{{ r.commission | fcfa }}</td>
                <td>{{ r.montantNet | fcfa }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
      @if (tab === 'depenses') {
        <table>
          <thead><tr><th>Date</th><th>Catégorie</th><th>Sens</th><th>Montant</th><th>Validée</th></tr></thead>
          <tbody>
            @for (d of depenses(); track d.id) {
              <tr>
                <td>{{ d.dateDepense | date:'dd/MM/yyyy' }}</td>
                <td>{{ d.categorie }}</td>
                <td>{{ d.sens === 'ENTREE' ? 'Entrée' : 'Sortie' }}</td>
                <td>{{ d.montant | fcfa }}</td>
                <td>{{ d.validee ? 'Oui' : 'Non' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class RapportsComponent implements OnInit {
  tab: 'collectes' | 'restitutions' | 'depenses' = 'collectes';
  collectes = signal<Collecte[]>([]);
  restitutions = signal<Restitution[]>([]);
  depenses = signal<Depense[]>([]);

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getCollectes({ agenceId }).subscribe(c => this.collectes.set(c));
    this.api.getRestitutions(agenceId).subscribe(r => this.restitutions.set(r));
    this.api.getDepenses(agenceId).subscribe(d => this.depenses.set(d));
  }

  exportCsv(): void {
    let rows: string[][] = [];
    if (this.tab === 'collectes') {
      rows = [['Date', 'Recu', 'Client', 'Agent', 'Montant'],
        ...this.collectes().map(c => [c.dateHeure || '', c.numeroRecu || '', c.clientNom || '', c.agentNom || '', String(c.montantRecu)])];
    } else if (this.tab === 'restitutions') {
      rows = [['Date', 'Recu', 'Client', 'Commission', 'Net'],
        ...this.restitutions().map(r => [r.dateHeure || '', r.numeroRecu || '', r.clientNom || '', String(r.commission), String(r.montantNet)])];
    } else {
      rows = [['Date', 'Categorie', 'Sens', 'Montant', 'Validee'],
        ...this.depenses().map(d => [d.dateDepense || '', d.categorie, d.sens === 'ENTREE' ? 'Entree' : 'Sortie', String(d.montant), d.validee ? 'Oui' : 'Non'])];
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${this.tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
