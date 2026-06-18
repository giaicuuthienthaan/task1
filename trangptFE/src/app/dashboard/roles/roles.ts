import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth.service';
import { PermissionItem, RoleItem, RoleRequest } from '../../auth.types';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './roles.html',
  styleUrl: '../admin-page.css'
})
export class RolesComponent implements OnInit {
  roles: RoleItem[] = [];
  permissions: PermissionItem[] = [];
  canCreate = false;
  canUpdate = false;
  canDelete = false;
  canAssignPermission = false;
  editingId: number | null = null;
  selectedPermissionCodes: string[] = [];
  form: RoleRequest = this.emptyForm();
  isLoading = true;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.authService.loadMe().subscribe({
      next: (me) => {
        this.canCreate = me.superAdmin || me.permissions.includes('ROLE_CREATE');
        this.canUpdate = me.superAdmin || me.permissions.includes('ROLE_UPDATE');
        this.canDelete = me.superAdmin || me.permissions.includes('ROLE_DELETE');
        this.canAssignPermission = me.superAdmin || me.permissions.includes('PERMISSION_ASSIGN');
        this.loadRoles();
        this.loadPermissions();
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc thong tin phan quyen.';
        this.isLoading = false;
      }
    });
  }

  save() {
    const permissionCodes = [...this.selectedPermissionCodes];
    const request: RoleRequest = { ...this.form, permissionCodes };

    if (this.editingId && !this.canUpdate && this.canAssignPermission) {
      this.authService.assignRolePermissions(this.editingId, { permissionCodes }).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadRoles();
        },
        error: () => this.errorMessage = 'Khong gan duoc permission cho role.'
      });
      return;
    }

    const action = this.editingId
      ? this.authService.updateRole(this.editingId, request)
      : this.authService.createRole(request);

    action.subscribe({
      next: () => {
        if (this.editingId && this.canAssignPermission) {
          this.authService.assignRolePermissions(this.editingId, { permissionCodes }).subscribe({
            next: () => {
              this.cancelEdit();
              this.loadRoles();
            },
            error: () => this.errorMessage = 'Khong gan duoc permission cho role.'
          });
          return;
        }
        this.cancelEdit();
        this.loadRoles();
      },
      error: () => this.errorMessage = 'Khong luu duoc role. Kiem tra permission codes.'
    });
  }

  edit(role: RoleItem) {
    this.editingId = role.id;
    this.form = {
      code: role.code,
      name: role.name,
      description: role.description || '',
      permissionCodes: role.permissions
    };
    this.selectedPermissionCodes = [...role.permissions];
  }

  delete(role: RoleItem) {
    if (!confirm(`Xoa role ${role.code}?`)) {
      return;
    }
    this.authService.deleteRole(role.id).subscribe({
      next: () => this.loadRoles(),
      error: () => this.errorMessage = 'Khong xoa duoc role. Role co the dang duoc user su dung.'
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.selectedPermissionCodes = [];
    this.form = this.emptyForm();
  }

  isPermissionSelected(permissionCode: string) {
    return this.selectedPermissionCodes.includes(permissionCode);
  }

  togglePermission(permissionCode: string, checked: boolean) {
    if (checked) {
      this.selectedPermissionCodes = Array.from(new Set([...this.selectedPermissionCodes, permissionCode]));
      return;
    }
    this.selectedPermissionCodes = this.selectedPermissionCodes.filter((code) => code !== permissionCode);
  }

  private loadRoles() {
    this.isLoading = true;
    this.authService.loadRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc danh sach roles.';
        this.isLoading = false;
      }
    });
  }

  private loadPermissions() {
    if (!this.canAssignPermission) {
      return;
    }
    this.authService.loadPermissions().subscribe({
      next: (permissions) => this.permissions = permissions,
      error: () => this.errorMessage = 'Khong tai duoc danh sach permissions.'
    });
  }

  private emptyForm(): RoleRequest {
    return { code: '', name: '', description: '', permissionCodes: [] };
  }
}
