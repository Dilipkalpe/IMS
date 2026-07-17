import { apiFetch } from './client';
import type { MenuPermission } from '../context/MenuPermissionContext';

export interface RoleDto {
  id: string;
  roleName: string;
  isActive: boolean;
  isSystem: boolean;
  isDeleted?: boolean;
}

export interface MenuTreeNode {
  id: string;
  menuKey: string;
  menuName: string;
  parentMenuKey: string | null;
  menuOrder: number;
  isSection: boolean;
  children: MenuTreeNode[];
}

export interface RoleDetailResponse {
  role?: RoleDto;
  menus: MenuTreeNode[];
  permissions: MenuPermission[];
}

export interface RoleSavePayload {
  roleName: string;
  isActive: boolean;
  permissions: MenuPermission[];
}

export async function fetchRoles(): Promise<RoleDto[]> {
  const result = await apiFetch<{ items: RoleDto[] }>('/api/roles');
  return Array.isArray(result.items) ? result.items : [];
}

export async function fetchActiveRoleNames(): Promise<string[]> {
  const result = await apiFetch<{ items: string[] }>('/api/roles/active-names');
  return Array.isArray(result.items) ? result.items : [];
}

export async function getRoleById(id: string): Promise<RoleDetailResponse> {
  return apiFetch<RoleDetailResponse>(`/api/roles/${encodeURIComponent(id)}`);
}

export async function fetchMenuTree(): Promise<MenuTreeNode[]> {
  const result = await apiFetch<{ menus: MenuTreeNode[] }>('/api/menus');
  return Array.isArray(result.menus) ? result.menus : [];
}

export async function createRole(payload: RoleSavePayload): Promise<RoleDetailResponse> {
  return apiFetch<RoleDetailResponse>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRole(id: string, payload: RoleSavePayload): Promise<RoleDetailResponse> {
  return apiFetch<RoleDetailResponse>(`/api/roles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function setRoleActive(id: string, isActive: boolean): Promise<RoleDetailResponse> {
  return apiFetch<RoleDetailResponse>(`/api/roles/${encodeURIComponent(id)}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteRole(id: string): Promise<void> {
  await apiFetch(`/api/roles/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
