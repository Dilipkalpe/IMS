import { allMenuDefinitions } from '../constants/menuCatalog.js';
import * as menuRepo from '../repositories/menuRepository.js';
import * as permRepo from '../repositories/rolePermissionRepository.js';

function toMenuDto(menu) {
  return {
    id: String(menu._id),
    menuKey: menu.menuKey,
    menuName: menu.menuName,
    parentMenuId: menu.parentMenuId ? String(menu.parentMenuId) : null,
    parentMenuKey: menu.parentMenuKey || null,
    menuUrl: menu.menuUrl || '',
    menuOrder: menu.menuOrder ?? 0,
    icon: menu.icon || '',
    isActive: menu.isActive !== false,
    isSection: menu.isSection === true
  };
}

function toPermissionDto(row) {
  return {
    id: String(row._id),
    roleId: String(row.roleId),
    menuId: String(row.menuId),
    menuKey: row.menuKey,
    canView: row.canView === true,
    canAdd: row.canAdd === true,
    canEdit: row.canEdit === true,
    canDelete: row.canDelete === true,
    canExport: row.canExport === true
  };
}

export function buildMenuTree(menus) {
  const byKey = new Map(menus.map((m) => [m.menuKey, { ...toMenuDto(m), children: [] }]));
  const roots = [];

  for (const node of byKey.values()) {
    const parentKey = node.parentMenuKey;
    if (parentKey && byKey.has(parentKey)) {
      byKey.get(parentKey).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list) => {
    list.sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0) || a.menuName.localeCompare(b.menuName));
    for (const n of list) sortNodes(n.children);
  };
  sortNodes(roots);
  return roots;
}

export async function ensureMenuCatalogSeeded() {
  const defs = allMenuDefinitions();
  const keyToId = new Map();

  for (const def of defs.filter((d) => d.isSection)) {
    const saved = await menuRepo.upsertMenuByKey(def.menuKey, {
      menuKey: def.menuKey,
      menuName: def.menuName,
      parentMenuId: null,
      parentMenuKey: null,
      menuUrl: def.menuUrl || def.menuKey,
      menuOrder: def.menuOrder ?? 0,
      icon: def.icon || '',
      isActive: true,
      isSection: true
    });
    keyToId.set(def.menuKey, saved._id);
  }

  for (const def of defs.filter((d) => !d.isSection)) {
    const parentId = def.parentKey ? keyToId.get(def.parentKey) ?? null : null;
    const saved = await menuRepo.upsertMenuByKey(def.menuKey, {
      menuKey: def.menuKey,
      menuName: def.menuName,
      parentMenuId: parentId,
      parentMenuKey: def.parentKey || null,
      menuUrl: def.menuUrl || def.menuKey,
      menuOrder: def.menuOrder ?? 0,
      icon: def.icon || '',
      isActive: true,
      isSection: false
    });
    keyToId.set(def.menuKey, saved._id);
  }

  return keyToId;
}

export async function getMenuTree() {
  const menus = await menuRepo.findAllMenus();
  return buildMenuTree(menus);
}

export async function getPermissionsForRole(roleId) {
  const [menus, rows] = await Promise.all([
    menuRepo.findAllMenus(),
    permRepo.findPermissionsByRoleId(roleId)
  ]);
  return {
    menus: buildMenuTree(menus),
    permissions: rows.map(toPermissionDto)
  };
}

export function allPermissionsFromMenus(menus, { fullAccess = true } = {}) {
  const result = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      result.push({
        menuKey: node.menuKey,
        menuId: node.id,
        canView: fullAccess,
        canAdd: fullAccess,
        canEdit: fullAccess,
        canDelete: fullAccess,
        canExport: fullAccess
      });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(menus);
  return result;
}

function normalizePermissionInput(item, menuByKey) {
  const menuKey = String(item.menuKey ?? '').trim();
  if (!menuKey) return null;
  const menu = menuByKey.get(menuKey);
  if (!menu) return null;

  const canView = item.canView === true;
  const canAdd = item.canAdd === true;
  const canEdit = item.canEdit === true;
  const canDelete = item.canDelete === true;
  const canExport = item.canExport === true;

  if (!canView && !canAdd && !canEdit && !canDelete && !canExport) return null;

  return {
    menuId: menu._id,
    menuKey,
    canView,
    canAdd: canView ? canAdd : false,
    canEdit: canView ? canEdit : false,
    canDelete: canView ? canDelete : false,
    canExport: canView ? canExport : false
  };
}

export async function savePermissionsForRole(roleId, permissionItems) {
  const menus = await menuRepo.findAllMenus();
  const menuByKey = new Map(menus.map((m) => [m.menuKey, m]));
  const normalized = (Array.isArray(permissionItems) ? permissionItems : [])
    .map((item) => normalizePermissionInput(item, menuByKey))
    .filter(Boolean);

  const hasViewOnLeaf = normalized.some((p) => {
    const menu = menuByKey.get(p.menuKey);
    return menu && !menu.isSection && p.canView;
  });

  if (!hasViewOnLeaf) {
    const err = new Error('At least one menu permission (View) must be selected.');
    err.status = 400;
    throw err;
  }

  const rows = normalized.map((p) => ({
    roleId,
    menuId: p.menuId,
    menuKey: p.menuKey,
    canView: p.canView,
    canAdd: p.canAdd,
    canEdit: p.canEdit,
    canDelete: p.canDelete,
    canExport: p.canExport,
    createdDate: new Date()
  }));

  await permRepo.replacePermissionsForRole(roleId, rows);
  return getPermissionsForRole(roleId);
}

export async function resolveUserPermissions(user) {
  if (!user) return [];

  const roleName = String(user.role ?? '').trim();
  if (/^administrator$/i.test(roleName)) {
    const menus = await menuRepo.findAllMenus();
    const tree = buildMenuTree(menus);
    return allPermissionsFromMenus(tree, { fullAccess: true });
  }

  const { Role } = await import('../models/Role.js');
  let role = null;
  if (user.roleId) {
    role = await Role.findOne({ _id: user.roleId, isDeleted: { $ne: true }, isActive: { $ne: false } }).lean();
  }
  if (!role && roleName) {
    role = await Role.findOne({
      roleName: new RegExp(`^${roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      isDeleted: { $ne: true },
      isActive: { $ne: false }
    }).lean();
  }
  if (!role) return [];

  const rows = await permRepo.findPermissionsByRoleId(role._id);
  return rows.map((r) => ({
    menuKey: r.menuKey,
    menuId: String(r.menuId),
    canView: r.canView === true,
    canAdd: r.canAdd === true,
    canEdit: r.canEdit === true,
    canDelete: r.canDelete === true,
    canExport: r.canExport === true
  }));
}
