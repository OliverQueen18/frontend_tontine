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
      // Pas d'agence connue : ne pas bloquer définitivement (SUPER_ADMIN multi-agences).
      // La vérification se fera avec l'agence du client au moment de l'opération.
      this.ouverte.set(null);
      this.controle.set(null);
      return of(true);
    }
    this.ouverte.set(null);
    return this.api.getCaisseControle(id).pipe(
      map(c => {
        this.controle.set(c);
        return !!c.peutOperer;
      }),
      tap(ok => this.ouverte.set(ok)),
      catchError((err) => {
        this.ouverte.set(false);
        this.controle.set({
          peutOperer: false,
          message: err?.error?.message || "Impossible de vérifier la caisse. Réessayez."
        });
        return of(false);
      })
    );
  }

  /** true seulement quand le contrôle a confirmé que les opérations sont bloquées. */
  isBlocked(): boolean {
    return this.ouverte() === false;
  }

  /** Contrôle encore en cours (ou agence non résolue). */
  isPending(): boolean {
    return this.ouverte() === null;
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
