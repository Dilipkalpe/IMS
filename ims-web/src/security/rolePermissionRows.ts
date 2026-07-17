import type { MenuPermission } from '../context/MenuPermissionContext';
import type { MenuTreeNode } from '../api/roles';

export interface PermissionRowState {
  menuKey: string;
  menuName: string;
  indent: number;
  isSection: boolean;
  parentKey: string | null;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  childKeys: string[];
}

function isSectionKey(menuKey: string): boolean {
  return menuKey.toLowerCase().startsWith('section-');
}

function appendMenu(
  menu: MenuTreeNode,
  indent: number,
  parentKey: string | null,
  permByKey: Map<string, MenuPermission>,
  rows: PermissionRowState[],
  childMap: Map<string, string[]>,
): void {
  const perm = permByKey.get(menu.menuKey);
  const row: PermissionRowState = {
    menuKey: menu.menuKey,
    menuName: menu.menuName,
    indent,
    isSection: menu.isSection,
    parentKey,
    canView: perm?.canView === true,
    canAdd: perm?.canAdd === true,
    canEdit: perm?.canEdit === true,
    canDelete: perm?.canDelete === true,
    canExport: perm?.canExport === true,
    childKeys: [],
  };
  rows.push(row);
  if (parentKey) {
    const siblings = childMap.get(parentKey) ?? [];
    siblings.push(menu.menuKey);
    childMap.set(parentKey, siblings);
  }
  childMap.set(menu.menuKey, []);

  const children = [...menu.children].sort(
    (a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0) || a.menuName.localeCompare(b.menuName),
  );
  for (const child of children) {
    appendMenu(child, indent + 1, menu.menuKey, permByKey, rows, childMap);
  }
  row.childKeys = childMap.get(menu.menuKey) ?? [];
}

export function buildPermissionRows(
  menus: MenuTreeNode[],
  permissions: MenuPermission[],
): PermissionRowState[] {
  const permByKey = new Map(permissions.map((p) => [p.menuKey, p]));
  const rows: PermissionRowState[] = [];
  const childMap = new Map<string, string[]>();

  const roots = [...menus].sort(
    (a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0) || a.menuName.localeCompare(b.menuName),
  );
  for (const menu of roots) {
    appendMenu(menu, 0, null, permByKey, rows, childMap);
  }

  return syncAllParents(rows, childMap);
}

function rowMap(rows: PermissionRowState[]): Map<string, PermissionRowState> {
  return new Map(rows.map((r) => [r.menuKey, r]));
}

function syncFromChildren(
  row: PermissionRowState,
  byKey: Map<string, PermissionRowState>,
): PermissionRowState {
  if (row.childKeys.length === 0) return row;

  const children = row.childKeys.map((k) => byKey.get(k)!);
  const allView = children.every((c) => c.canView);
  const anyView = children.some((c) => c.canView);

  const next: PermissionRowState = {
    ...row,
    canView: allView,
    canAdd: anyView ? row.canAdd : false,
    canEdit: anyView ? row.canEdit : false,
    canDelete: anyView ? row.canDelete : false,
    canExport: anyView ? row.canExport : false,
  };

  if (!anyView) {
    next.canAdd = false;
    next.canEdit = false;
    next.canDelete = false;
    next.canExport = false;
  }

  return next;
}

function syncAllParents(
  rows: PermissionRowState[],
  childMap: Map<string, string[]>,
): PermissionRowState[] {
  let next = [...rows];
  const maxIndent = Math.max(0, ...next.map((r) => r.indent));

  for (let indent = maxIndent; indent >= 0; indent -= 1) {
    const byKey = rowMap(next);
    next = next.map((row) => {
      if (row.indent !== indent || row.childKeys.length === 0) return row;
      return syncFromChildren(row, byKey);
    });
  }

  void childMap;
  return next;
}

function setCanViewRecursive(
  rows: PermissionRowState[],
  menuKey: string,
  value: boolean,
): PermissionRowState[] {
  const byKey = rowMap(rows);

  const apply = (key: string, view: boolean): void => {
    const row = byKey.get(key);
    if (!row) return;

    row.canView = view;
    if (!view) {
      row.canAdd = false;
      row.canEdit = false;
      row.canDelete = false;
      row.canExport = false;
    }
    for (const childKey of row.childKeys) {
      apply(childKey, view);
    }
  };

  apply(menuKey, value);
  return syncAllParents(rows, new Map());
}

function setDetailPermission(
  rows: PermissionRowState[],
  menuKey: string,
  field: 'canAdd' | 'canEdit' | 'canDelete' | 'canExport',
  value: boolean,
): PermissionRowState[] {
  const next = rows.map((row) => {
    if (row.menuKey !== menuKey) return row;
    const updated = { ...row, [field]: value };
    if (value && !updated.canView) {
      updated.canView = true;
    }
    return updated;
  });
  return syncAllParents(next, new Map());
}

function cloneRows(rows: PermissionRowState[]): PermissionRowState[] {
  return rows.map((r) => ({ ...r }));
}

export function updatePermissionRow(
  rows: PermissionRowState[],
  menuKey: string,
  update:
    | { field: 'canView'; value: boolean | null }
    | { field: 'canAdd' | 'canEdit' | 'canDelete' | 'canExport'; value: boolean },
): PermissionRowState[] {
  const working = cloneRows(rows);
  if (update.field === 'canView') {
    if (update.value === null) return working;
    return setCanViewRecursive(working, menuKey, update.value);
  }
  return setDetailPermission(working, menuKey, update.field, update.value);
}

export function getViewCheckState(row: PermissionRowState, rows: PermissionRowState[]): boolean | null {
  if (row.childKeys.length === 0) return row.canView;

  const byKey = rowMap(rows);
  const children = row.childKeys.map((k) => byKey.get(k)!);
  if (children.every((c) => c.canView)) return true;
  if (children.every((c) => !c.canView)) return false;
  return null;
}

export function selectAllView(rows: PermissionRowState[]): PermissionRowState[] {
  const roots = rows.filter((r) => r.parentKey === null);
  let next = cloneRows(rows);
  for (const root of roots) {
    next = setCanViewRecursive(next, root.menuKey, true);
  }
  return next;
}

export function clearAllPermissions(rows: PermissionRowState[]): PermissionRowState[] {
  const roots = rows.filter((r) => r.parentKey === null);
  let next = cloneRows(rows);
  for (const root of roots) {
    next = setCanViewRecursive(next, root.menuKey, false);
  }
  return next;
}

export function rowsToPermissionPayload(rows: PermissionRowState[]): MenuPermission[] {
  return rows
    .filter(
      (r) => r.canView || r.canAdd || r.canEdit || r.canDelete || r.canExport,
    )
    .map((r) => ({
      menuKey: r.menuKey,
      canView: r.canView,
      canAdd: r.canAdd,
      canEdit: r.canEdit,
      canDelete: r.canDelete,
      canExport: r.canExport,
    }));
}

export function validateRolePermissions(rows: PermissionRowState[]): string | null {
  const payload = rowsToPermissionPayload(rows);
  const hasView = payload.some((p) => p.canView && !isSectionKey(p.menuKey));
  if (!hasView) {
    return 'At least one menu View permission must be selected.';
  }
  return null;
}

export function filterPermissionRows(
  rows: PermissionRowState[],
  filterText: string,
): PermissionRowState[] {
  const filter = filterText.trim().toLowerCase();
  if (!filter) return rows;

  const byKey = rowMap(rows);

  const rowOrDescendantMatches = (row: PermissionRowState): boolean => {
    if (row.menuName.toLowerCase().includes(filter)) return true;
    return row.childKeys.some((key) => {
      const child = byKey.get(key);
      return child ? rowOrDescendantMatches(child) : false;
    });
  };

  const visible = new Set<string>();
  for (const row of rows) {
    if (row.menuName.toLowerCase().includes(filter) || rowOrDescendantMatches(row)) {
      let current: PermissionRowState | undefined = row;
      while (current) {
        visible.add(current.menuKey);
        current = current.parentKey ? byKey.get(current.parentKey) : undefined;
      }
    }
  }

  return rows.filter((r) => visible.has(r.menuKey));
}
