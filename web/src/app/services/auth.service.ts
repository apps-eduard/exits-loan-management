import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginResponse, AuthTokens } from '../models/auth.model';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private logger = inject(LoggerService);

  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.logger.info('🔧 AuthService initialized');
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      this.logger.debug('🔑 Token found in storage, loading user profile...');
      // Load user profile
      this.getProfile().subscribe({
        next: (response) => {
          this.currentUserSubject.next(response.data.user);
          this.logger.authSuccess(response.data.user.email, response.data.user.role);
        },
        error: (err) => {
          this.logger.error('Failed to load user profile from token', err);
          this.logout();
        }
      });
    } else {
      this.logger.debug('No token found in storage');
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    this.logger.info(`🔐 Attempting login for: ${email}`);
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          this.setTokens(response.data.tokens);
          this.currentUserSubject.next(response.data.user);
          this.logger.authSuccess(response.data.user.email, response.data.user.role);
          this.logger.success(`User permissions loaded`, {
            permissions: response.data.user.permissions
          });
        }
      })
    );
  }

  logout(): void {
    const user = this.getCurrentUser();
    this.logger.info(`🚪 Logging out: ${user?.email || 'unknown'}`);
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe();
    }
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.logger.success('Logged out successfully');
    this.router.navigate(['/auth/login']);
  }

  getProfile(): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.get<{ success: boolean; data: { user: User } }>(
      `${this.API_URL}/auth/profile`
    );
  }

  refreshToken(): Observable<{ success: boolean; data: { tokens: AuthTokens } }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ success: boolean; data: { tokens: AuthTokens } }>(
      `${this.API_URL}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.setTokens(response.data.tokens);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user is a Super Admin
   * Super Admins can access all tenants
   */
  isSuperAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.isSuperAdmin === true;
    } catch (error) {
      this.logger.error('Failed to parse token for super admin check', error);
      return false;
    }
  }

  /**
   * Get tenant ID from JWT token
   */
  getTenantId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.tenantId || null;
    } catch (error) {
      this.logger.error('Failed to parse token for tenant ID', error);
      return null;
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    const has = user?.permissions.includes(permission) ?? false;
    if (!has) {
      this.logger.debug(`❌ Permission check failed: ${permission}`, {
        userPermissions: user?.permissions || []
      });
    }
    return has;
  }

  hasAnyPermission(permissions: string[]): boolean {
    const result = permissions.some(p => this.hasPermission(p));
    this.logger.debug(`Permission check (ANY): ${result}`, {
      required: permissions,
      userPermissions: this.getCurrentUser()?.permissions || []
    });
    return result;
  }
}
