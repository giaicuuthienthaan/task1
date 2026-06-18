import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  AdminOverviewResponse,
  MeResponse,
  PermissionAssignRequest,
  PermissionItem,
  PositionRequest,
  RoleItem,
  RoleRequest,
  TokenExchangeRequest,
  TokenResponse,
  UserItem,
  UserRequest
} from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBaseUrl = 'http://localhost:8080';
  private readonly keycloakLogoutUrl = 'https://id.smartsolutionvn.com.vn/realms/ssvn/protocol/openid-connect/logout';

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiBaseUrl}/api/auth/login`, {
      username,
      password
    }).pipe(
      tap((token) => this.saveToken(token, 'database'))
    );
  }

  exchangeKeycloakCode(request: TokenExchangeRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiBaseUrl}/api/auth/token`, request).pipe(
      tap((token) => this.saveToken(token, 'keycloak'))
    );
  }

  loadMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiBaseUrl}/api/me`, { headers: this.authHeaders() });
  }

  loadAdminOverview(): Observable<AdminOverviewResponse> {
    return this.http.get<AdminOverviewResponse>(`${this.apiBaseUrl}/api/dashboard`, { headers: this.authHeaders() });
  }

  loadUsers(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(`${this.apiBaseUrl}/api/users`, { headers: this.authHeaders() });
  }

  loadRoles(): Observable<RoleItem[]> {
    return this.http.get<RoleItem[]>(`${this.apiBaseUrl}/api/roles`, { headers: this.authHeaders() });
  }

  loadPermissions(): Observable<PermissionItem[]> {
    return this.http.get<PermissionItem[]>(`${this.apiBaseUrl}/api/permissions`, { headers: this.authHeaders() });
  }

  createUser(request: UserRequest) {
    return this.http.post<void>(`${this.apiBaseUrl}/api/users`, request, { headers: this.authHeaders() });
  }

  updateUser(id: number, request: UserRequest) {
    return this.http.put<void>(`${this.apiBaseUrl}/api/users/${id}`, request, { headers: this.authHeaders() });
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/users/${id}`, { headers: this.authHeaders() });
  }

  createRole(request: RoleRequest) {
    return this.http.post<void>(`${this.apiBaseUrl}/api/roles`, request, { headers: this.authHeaders() });
  }

  updateRole(id: number, request: RoleRequest) {
    return this.http.put<void>(`${this.apiBaseUrl}/api/roles/${id}`, request, { headers: this.authHeaders() });
  }

  deleteRole(id: number) {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/roles/${id}`, { headers: this.authHeaders() });
  }

  assignRolePermissions(roleId: number, request: PermissionAssignRequest) {
    return this.http.put<void>(`${this.apiBaseUrl}/api/roles/${roleId}/permissions`, request, { headers: this.authHeaders() });
  }

  createPosition(request: PositionRequest) {
    return this.http.post<void>(`${this.apiBaseUrl}/api/admin/positions`, request, { headers: this.authHeaders() });
  }

  updatePosition(id: number, request: PositionRequest) {
    return this.http.put<void>(`${this.apiBaseUrl}/api/admin/positions/${id}`, request, { headers: this.authHeaders() });
  }

  deletePosition(id: number) {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/admin/positions/${id}`, { headers: this.authHeaders() });
  }

  logout() {
    const loginProvider = localStorage.getItem('login_provider');
    const idToken = localStorage.getItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('login_provider');
    sessionStorage.removeItem('pkce_code_verifier');

    if (loginProvider === 'keycloak') {
      const params = new URLSearchParams({
        id_token_hint: idToken ?? '',
        post_logout_redirect_uri: `${window.location.origin}/login`
      });
      window.location.href = `${this.keycloakLogoutUrl}?${params.toString()}`;
      return true;
    }
    return false;
  }

  isLoggedIn() {
    return Boolean(this.getAccessToken());
  }

  private getAccessToken() {
    return localStorage.getItem('access_token') ?? '';
  }

  private authHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` });
  }

  private saveToken(token: TokenResponse, loginProvider: 'database' | 'keycloak') {
    localStorage.setItem('access_token', token.access_token);
    localStorage.setItem('login_provider', loginProvider);
    if (token.refresh_token) {
      localStorage.setItem('refresh_token', token.refresh_token);
    }
    if (token.id_token) {
      localStorage.setItem('id_token', token.id_token);
    }
  }
}
