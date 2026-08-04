import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Caisse, CaisseControle } from '../models/models';

/** Vérifie que la caisse du jour est ouverte et qu'aucune caisse antérieure n'est ouverte. */
@Injectable({ providedIn: 'root' })
export class CaisseOuverteService {
  /** true = peut opérer, false = bloqué, null = en attente de vérification. */
  readonly ouverte = signal<boolean | null>(null);
  readonly controle = signal<CaisseControle | null>(null);

  constructor(private api: ApiService, private auth: AuthService) {}

  /** Vérifie si les opérations caisse sont autorisées pour l'agence donnée. */
  check(agenceId?: number | null): Observable<boolean> {
    const id = agenceId ?? this.auth.agenceId();
    if (id == null) {
      this.ouverte.set(null);
      this.controle.set(null);
      return of(false);
    }
    return this.api.getCaisseControle(id).pipe(
      map(c => {
        this.controle.set(c);
        return !!c.peutOperer;
      }),
      tap(ok => this.ouverte.set(ok)),
      catchError(() => {
        this.ouverte.set(false);
        this.controle.set(null);
        return of(false);
      })
    );
  }

  /** true tant que la caisse n'est pas confirmée ouverte pour l'agence. */
  isBlocked(): boolean {
    return this.ouverte() !== true;
  }

  get canOpenCaisse(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER');
  }

  get caissesAnterieuresOuvertes(): Caisse[] {
    return this.controle()?.caissesAnterieuresOuvertes || [];
  }

  get hasAnterieuresOuvertes(): boolean {
    return this.caissesAnterieuresOuvertes.length > 0;
  }

  get messageBlocage(): string {
    const msg = this.controle()?.message;
    if (msg) {
      return msg;
    }
    if (this.canOpenCaisse) {
      return "La caisse du jour n'est pas ouverte. Ouvrez-la dans le menu Caisse avant d'effectuer des collectes, restitutions ou opérations.";
    }
    return "La caisse du jour n'est pas ouverte. Contactez le caissier ou l'administrateur de l'agence pour l'ouvrir.";
  }
}
