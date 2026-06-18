import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../auth.service';
import { MeResponse } from '../../auth.types';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrl: '../admin-page.css'
})
export class ProfileComponent implements OnInit {
  me: MeResponse | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.authService.loadMe().subscribe({
      next: (me) => {
        this.me = me;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc profile.';
        this.isLoading = false;
      }
    });
  }

  canUpdateProfile() {
    return Boolean(this.me?.superAdmin || this.me?.permissions.includes('PROFILE_UPDATE'));
  }
}
