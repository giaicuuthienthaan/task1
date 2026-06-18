import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../auth.service';
import { PermissionItem } from '../../auth.types';

@Component({
  selector: 'app-permissions',
  standalone: true,
  templateUrl: './permissions.html',
  styleUrl: '../admin-page.css'
})
export class PermissionsComponent implements OnInit {
  permissions: PermissionItem[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.loadPermissions();
  }

  private loadPermissions() {
    this.isLoading = true;
    this.authService.loadPermissions().subscribe({
      next: (permissions) => {
        this.permissions = permissions;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc danh sach permissions.';
        this.isLoading = false;
      }
    });
  }
}
