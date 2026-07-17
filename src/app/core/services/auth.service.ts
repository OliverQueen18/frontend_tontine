import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, RoleType, ChangePasswordPayload, UpdateProfilePayload, UserProfile } from '../models/models';

const ACCESS_KEY = 'tm_access';
const REFRESH_KEY = 'tm_refresh';
const USER_KEY = 'tm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<AuthResponse | null>(this.loadUser());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser()?.accessToken);
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly mustChangePassword = computed(() => !!this.currentUser()?.mustChangePassword);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string, rememberMe = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
      username,
      password,
      rememberMe
    }).pipe(tap(res => this.persist(res, rememberMe)));
  }

  forgotPassword(username: string): Observable<{ message: string; maskedEmail?: string; expiresInSeconds?: number }> {
    return this.http.post<{ message: string; maskedEmail?: string; expiresInSeconds?: number }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { username }
    );
  }

  verifyOtp(username: string, otp: string): Observable<{ message: string; resetToken?: string }> {
    return this.http.post<{ message: string; resetToken?: string }>(
      `${environment.apiUrl}/auth/verify-otp`,
      { username, otp }
    );
  }

  resetPassword(username: string, resetToken: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { username, resetToken, newPassword }
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(tap(res => {
        const remember = !!localStorage.getItem(REFRESH_KEY) || !!localStorage.getItem(USER_KEY);
        this.persist(res, remember);
      }));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/connexion']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY)
      || sessionStorage.getItem(ACCESS_KEY)
      || this.currentUser()?.accessToken
      || null;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
      || sessionStorage.getItem(REFRESH_KEY)
      || this.currentUser()?.refreshToken
      || null;
  }

  hasRole(...roles: RoleType[]): boolean {
    const role = this.currentUser()?.role;
    return !!role && roles.includes(role);
  }

  isCollecteur(): boolean {
    return this.hasRole('AGENT', 'ADMIN_AGENCE');
  }

  agenceId(): number | null {
    return this.currentUser()?.agenceId ?? null;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/auth/me`);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${environment.apiUrl}/auth/profile`, payload).pipe(
      tap(profile => this.patchStoredUser({ nomComplet: profile.nomComplet }))
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, payload).pipe(
      tap(() => this.patchStoredUser({ mustChangePassword: false }))
    );
  }

  private patchStoredUser(partial: Partial<AuthResponse>): void {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...partial };
    const storage = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  private persist(res: AuthResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(k => other.removeItem(k));
    storage.setItem(ACCESS_KEY, res.accessToken);
    storage.setItem(REFRESH_KEY, res.refreshToken);
    storage.setItem(USER_KEY, JSON.stringify(res));
    this.currentUser.set(res);
  }

  private loadUser(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  }
}
