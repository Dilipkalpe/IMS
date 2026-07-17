import { apiFetch } from './client';

export interface GridColumnDefinition {
  key: string;
  header: string;
  mandatory: boolean;
  defaultVisible: boolean;
}

export interface GridColumnPreferences {
  moduleKey: string;
  columns: GridColumnDefinition[];
  mandatoryColumnKeys: string[];
  defaultVisibleColumnKeys: string[];
  visibleColumnKeys: string[];
  hasUserOverride: boolean;
  hasGlobalDefault: boolean;
  globalVisibleColumnKeys: string[] | null;
  userVisibleColumnKeys: string[] | null;
}

export interface GridColumnModulesResponse {
  modules: { key: string; title: string }[];
}

export async function fetchGridColumnModules(): Promise<GridColumnModulesResponse> {
  return apiFetch<GridColumnModulesResponse>('/api/grid-columns/modules');
}

export async function fetchGridColumnPreferences(moduleKey: string): Promise<GridColumnPreferences> {
  const key = encodeURIComponent(moduleKey);
  return apiFetch<GridColumnPreferences>(`/api/grid-columns/${key}`);
}

export async function saveGridColumnPreferences(
  moduleKey: string,
  visibleColumnKeys: string[],
): Promise<GridColumnPreferences> {
  const key = encodeURIComponent(moduleKey);
  return apiFetch<GridColumnPreferences>(`/api/grid-columns/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ visibleColumnKeys }),
  });
}

export async function resetGridColumnPreferences(moduleKey: string): Promise<GridColumnPreferences> {
  const key = encodeURIComponent(moduleKey);
  return apiFetch<GridColumnPreferences>(`/api/grid-columns/${key}/reset`, {
    method: 'POST',
  });
}

export async function saveGridColumnGlobalDefault(
  moduleKey: string,
  visibleColumnKeys: string[],
): Promise<GridColumnPreferences> {
  const key = encodeURIComponent(moduleKey);
  return apiFetch<GridColumnPreferences>(`/api/grid-columns/${key}/global-default`, {
    method: 'PUT',
    body: JSON.stringify({ visibleColumnKeys }),
  });
}

export async function resetGridColumnGlobalDefault(moduleKey: string): Promise<GridColumnPreferences> {
  const key = encodeURIComponent(moduleKey);
  return apiFetch<GridColumnPreferences>(`/api/grid-columns/${key}/global-default/reset`, {
    method: 'POST',
  });
}
