import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agence, Caisse } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [FormsModule, FcfaPipe, DatePipe],
  templateUrl: './caisse.component.html'
})
export class CaisseComponent implements OnInit {
  caisse = signal<Caisse | null>(null);
  agences = signal<Agence[]>([]);
  agenceId: number | null = null;
  soldeInitial: number | null = null;
  soldeReel: number | null = null;
  observation = '';
  message = signal('');

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    if (this.auth.hasRole('SUPER_ADMIN')) {
      this.api.getAgences().subscribe(a => {
        this.agences.set(a);
        if (a.length) {
          this.agenceId = a[0].id!;
          this.load();
        }
      });
    } else {
      this.agenceId = this.auth.agenceId();
      this.load();
    }
  }

  load(): void {
    if (!this.agenceId) return;
    this.api.getCaisseJour(this.agenceId).subscribe({
      next: c => this.caisse.set(c),
      error: () => this.caisse.set(null)
    });
  }

  ouvrir(): void {
    if (!this.agenceId) return;
    this.api.ouvrirCaisse(this.agenceId, this.soldeInitial ?? undefined).subscribe({
      next: c => {
        this.caisse.set(c);
        this.message.set('Caisse ouverte');
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  cloturer(): void {
    if (!this.agenceId || this.soldeReel == null) return;
    this.api.cloturerCaisse(this.agenceId, this.soldeReel, this.observation).subscribe({
      next: c => {
        this.caisse.set(c);
        this.message.set('Caisse clôturée');
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }
}
