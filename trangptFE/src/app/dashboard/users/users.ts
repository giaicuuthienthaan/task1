import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth.service';
import { PositionItem, RoleItem, UserItem, UserRequest } from '../../auth.types';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users.html',
  styleUrl: '../admin-page.css'
})
export class UsersComponent implements OnInit {
  users: UserItem[] = [];
  roles: RoleItem[] = [];
  positions: PositionItem[] = [];
  canCreate = false;
  canUpdate = false;
  canDelete = false;
  editingId: number | null = null;
  selectedRoleCodes: string[] = [];
  form: UserRequest = this.emptyForm();
  isLoading = true;
  errorMessage = '';

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.authService.loadMe().subscribe({
      next: (me) => {
        this.canCreate = me.superAdmin || me.permissions.includes('USER_CREATE');
        this.canUpdate = me.superAdmin || me.permissions.includes('USER_UPDATE');
        this.canDelete = me.superAdmin || me.permissions.includes('USER_DELETE');
        this.loadUsers();
        this.loadFormOptions();
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc thong tin phan quyen.';
        this.isLoading = false;
      }
    });
  }

  save() {
    const request: UserRequest = {
      ...this.form,
      positionId: this.form.positionId ? Number(this.form.positionId) : null,
      roleCodes: [...this.selectedRoleCodes]
    };
    const action = this.editingId
      ? this.authService.updateUser(this.editingId, request)
      : this.authService.createUser(request);

    action.subscribe({
      next: () => {
        this.cancelEdit();
        this.loadUsers();
      },
      error: () => this.errorMessage = 'Khong luu duoc user. Kiem tra username, password va role codes.'
    });
  }

  edit(user: UserItem) {
    this.editingId = user.id;
    this.form = {
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      positionId: user.positionId,
      status: user.status,
      roleCodes: user.roles
    };
    this.selectedRoleCodes = [...user.roles];
  }

  delete(user: UserItem) {
    if (!confirm(`Xoa user ${user.username}?`)) {
      return;
    }
    this.authService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage = 'Khong xoa duoc user.'
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.selectedRoleCodes = [];
    this.form = this.emptyForm();
  }

  isRoleSelected(roleCode: string) {
    return this.selectedRoleCodes.includes(roleCode);
  }

  toggleRole(roleCode: string, checked: boolean) {
    if (checked) {
      this.selectedRoleCodes = Array.from(new Set([...this.selectedRoleCodes, roleCode]));
      return;
    }
    this.selectedRoleCodes = this.selectedRoleCodes.filter((code) => code !== roleCode);
  }

  private loadUsers() {
    this.isLoading = true;
    this.authService.loadUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Khong tai duoc danh sach users.';
        this.isLoading = false;
      }
    });
  }

  private loadFormOptions() {
    if (!this.canCreate && !this.canUpdate) {
      return;
    }
    this.authService.loadRoles().subscribe({
      next: (roles) => this.roles = roles
    });
    this.authService.loadAdminOverview().subscribe({
      next: (overview) => this.positions = overview.positions
    });
  }

  private emptyForm(): UserRequest {
    return {
      username: '',
      email: '',
      password: '',
      fullName: '',
      positionId: null,
      status: 'ACTIVE',
      roleCodes: []
    };
  }
}
