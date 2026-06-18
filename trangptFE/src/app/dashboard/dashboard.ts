import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth.service';
import { MeResponse } from '../auth.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  me: MeResponse | null = null;
  isLoading = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.authService.loadMe().subscribe({
      next: (me) => {
        this.me = me;
        this.isLoading = false;
      },
      error: () => {
        this.authService.logout();
        this.router.navigateByUrl('/login');
      }
    });
  }

  logout() {
    const redirected = this.authService.logout();
    if (!redirected) {
      this.router.navigateByUrl('/login');
    }
  }

  canAccess(permission: string) {
    return Boolean(this.me?.superAdmin || this.me?.permissions.includes(permission));
  }
}
