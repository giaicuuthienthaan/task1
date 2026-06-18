export interface MeResponse {
  id: number | null;
  username: string;
  email: string;
  fullName: string;
  status: string;
  superAdmin: boolean;
  roles: string[];
  permissions: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

export interface TokenExchangeRequest {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface AdminOverviewResponse {
  users: UserItem[];
  roles: RoleItem[];
  permissions: PermissionItem[];
  positions: PositionItem[];
}

export interface UserItem {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string;
  positionId: number | null;
  positionName: string | null;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleItem {
  id: number;
  code: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PositionItem {
  id: number;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  positionId: number | null;
  status: string;
  roleCodes: string[];
}

export interface RoleRequest {
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}

export interface PermissionRequest {
  code: string;
  name: string;
  description: string;
}

export interface PositionRequest {
  code: string;
  name: string;
  description: string;
}

export interface PermissionAssignRequest {
  permissionCodes: string[];
}
