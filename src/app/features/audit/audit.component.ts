import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AuditLog } from '../../core/models/models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Journal d'audit</h1>
        <p>Traçabilité de toutes les actions sensibles</p>
      </div>
    </div>

    <div class="card table-card">
      <table>
        <thead>
          <tr><th>Heure</th><th>Utilisateur</th><th>Action</th><th>Entité</th><th>Référence</th><th>Détails</th></tr>
        </thead>
        <tbody>
          @for (a of logs(); track a.id) {
            <tr>
              <td>{{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ a.username }}</td>
              <td><span class="badge">{{ a.action }}</span></td>
              <td>{{ a.entite }}</td>
              <td>{{ a.reference }}</td>
              <td>{{ a.details }}</td>
            </tr>
          } @empty {
            <tr><td colspan="6">Aucun événement</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class AuditComponent implements OnInit {
  logs = signal<AuditLog[]>([]);

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    this.api.getAudit(agenceId).subscribe(l => this.logs.set(l));
  }
}
