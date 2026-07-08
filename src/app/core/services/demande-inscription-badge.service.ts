import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DemandeInscriptionBadgeService {
  readonly count = signal(0);

  constructor(private api: ApiService, private auth: AuthService) {}

  refresh(): void {
    if (!this.auth.hasRole('SUPER_ADMIN')) {
      this.count.set(0);
      return;
    }
    this.api.countDemandesInscriptionEnAttente().subscribe({
      next: count => this.count.set(count),
      error: () => this.count.set(0)
    });
  }
}
