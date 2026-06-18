import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  loginMode: 'normal' | 'superadmin' | null = null;
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  private readonly keycloakBaseUrl = 'https://id.smartsolutionvn.com.vn/realms/ssvn/protocol/openid-connect';
  private readonly clientId = 'ssvn-platform-client-id';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      this.handleKeycloakCallback(code);
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  chooseMode(mode: 'normal' | 'superadmin') {
    this.errorMessage = '';
    this.loginMode = mode;
    if (mode === 'superadmin') {
      this.loginWithKeycloak();
    }
  }

  login() {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => this.redirectByPermission(),
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Tai khoan hoac mat khau khong dung.';
      }
    });
  }

  backToModeSelection() {
    this.loginMode = null;
    this.username = '';
    this.password = '';
    this.errorMessage = '';
  }

  private async loginWithKeycloak() {
    this.isLoading = true;
    const verifier = this.createCodeVerifier();
    const challenge = await this.createCodeChallenge(verifier);
    const redirectUri = `${window.location.origin}/login`;

    sessionStorage.setItem('pkce_code_verifier', verifier);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    window.location.href = `${this.keycloakBaseUrl}/auth?${params.toString()}`;
  }

  private handleKeycloakCallback(code: string) {
    const verifier = sessionStorage.getItem('pkce_code_verifier');
    if (!verifier) {
      this.errorMessage = 'Phien dang nhap Keycloak khong hop le.';
      return;
    }

    this.isLoading = true;
    this.authService.exchangeKeycloakCode({
      code,
      redirectUri: `${window.location.origin}/login`,
      codeVerifier: verifier
    }).subscribe({
      next: () => {
        sessionStorage.removeItem('pkce_code_verifier');
        window.history.replaceState({}, document.title, '/login');
        this.redirectByPermission();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Khong dang nhap duoc bang Keycloak.';
      }
    });
  }

  private redirectByPermission() {
    this.authService.loadMe().subscribe({
      next: (me) => {
        if (me.superAdmin || me.permissions.includes('DASHBOARD_VIEW')) {
          this.router.navigateByUrl('/dashboard/overview');
          return;
        }
        if (me.permissions.includes('PROFILE_VIEW')) {
          this.router.navigateByUrl('/dashboard/profile');
          return;
        }

        this.authService.logout();
        this.isLoading = false;
        this.errorMessage = 'Tai khoan chua duoc cap quyen truy cap trang.';
      },
      error: () => {
        this.authService.logout();
        this.isLoading = false;
        this.errorMessage = 'Khong tai duoc thong tin phan quyen.';
      }
    });
  }

  private createCodeVerifier() {
    const values = new Uint8Array(32);
    crypto.getRandomValues(values);
    return this.base64UrlEncode(values);
  }

  private async createCodeChallenge(verifier: string) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  private base64UrlEncode(values: Uint8Array) {
    return btoa(String.fromCharCode(...values))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
