import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../auth.service';
import { AdminOverviewResponse, MeResponse } from '../../auth.types';

@Component({
  selector: 'app-overview',
  standalone: true,
  templateUrl: './overview.html',
  styleUrl: '../admin-page.css'
})
export class OverviewComponent implements OnInit {
  me: MeResponse | null = null;
  overview: AdminOverviewResponse | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.authService.loadMe().subscribe({
      next: (me) => {
        this.me = me;
        if (me.superAdmin) {
          this.loadAdminOverview();
          return;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc thong tin tai khoan.';
        this.isLoading = false;
      }
    });
  }

  private loadAdminOverview() {
    this.authService.loadAdminOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc du lieu PostgreSQL.';
        this.isLoading = false;
      }
    });
  }
}
