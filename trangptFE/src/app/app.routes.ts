import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard';
import { LoginComponent } from './login/login';
import { OverviewComponent } from './dashboard/overview/overview';
import { PermissionsComponent } from './dashboard/permissions/permissions';
import { PositionsComponent } from './dashboard/positions/positions';
import { ProfileComponent } from './dashboard/profile/profile';
import { RolesComponent } from './dashboard/roles/roles';
import { TreeTableDemoComponent } from './dashboard/tree-table-demo/tree-table-demo';
import { UsersComponent } from './dashboard/users/users';
import { RegisterInfoComponent } from './register-info/register-info';

export const routes: Routes = [
  { path: 'register-info', component: RegisterInfoComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'overview', component: OverviewComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'users', component: UsersComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'permissions', component: PermissionsComponent },
      { path: 'positions', component: PositionsComponent },
      { path: 'tree-table-demo', component: TreeTableDemoComponent },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

