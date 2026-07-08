import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleType } from '../models/models';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/connexion']);
  }
  // Changement de mot de passe obligatoire : on bloque tout sauf la page profil.
  if (auth.mustChangePassword() && !state.url.startsWith('/app/profil')) {
    return router.createUrlTree(['/app/profil']);
  }
  return true;
};

export const roleGuard = (...roles: RoleType[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/connexion']);
  }
  if (auth.hasRole(...roles)) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard']);
};
