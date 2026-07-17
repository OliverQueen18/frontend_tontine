import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshInFlight: ReturnType<AuthService['refresh']> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthRoute = req.url.includes('/auth/login')
    || req.url.includes('/auth/refresh')
    || req.url.includes('/auth/forgot-password')
    || req.url.includes('/auth/verify-otp')
    || req.url.includes('/auth/reset-password');

  const token = auth.getAccessToken();
  const authedReq = token && !isAuthRoute
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const alreadyRetried = req.headers.has('X-Auth-Retry');
      // 401 = non authentifié (après correctif backend).
      // 403 aussi tant que le backend prod renvoie encore 403 pour JWT expiré.
      const maybeExpired = err.status === 401
        || (err.status === 403 && !alreadyRetried);

      if (!maybeExpired || isAuthRoute || !auth.getRefreshToken() || alreadyRetried) {
        return throwError(() => err);
      }

      if (!refreshInFlight) {
        refreshInFlight = auth.refresh().pipe(
          shareReplay(1),
          finalize(() => {
            refreshInFlight = null;
          })
        );
      }

      return refreshInFlight.pipe(
        switchMap(res => next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${res.accessToken}`,
            'X-Auth-Retry': '1'
          }
        }))),
        catchError(refreshErr => {
          auth.logout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
