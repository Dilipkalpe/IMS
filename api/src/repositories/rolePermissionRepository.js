import { RoleMenuPermission } from '../models/RoleMenuPermission.js';

export async function findPermissionsByRoleId(roleId) {
  return RoleMenuPermission.find({ roleId }).lean();
}

export async function replacePermissionsForRole(roleId, rows) {
  await RoleMenuPermission.deleteMany({ roleId });
  if (!rows.length) return [];
  return RoleMenuPermission.insertMany(rows);
}

export async function countPermissionsWithView(roleId) {
  return RoleMenuPermission.countDocuments({ roleId, canView: true });
}
