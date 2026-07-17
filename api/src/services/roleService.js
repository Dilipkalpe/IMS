import { AppUser } from '../models/AppUser.js';
import * as roleRepo from '../repositories/roleRepository.js';
import * as menuPermService from './menuPermissionService.js';

function toRoleDto(role) {
  return {
    id: String(role._id),
    roleName: role.roleName,
    isActive: role.isActive !== false,
    isSystem: role.isSystem === true,
    isDeleted: role.isDeleted === true,
    createdBy: role.createdBy || null,
    createdDate: role.createdDate || null,
    modifiedBy: role.modifiedBy || null,
    modifiedDate: role.modifiedDate || null
  };
}

export async function listRoles() {
  const items = await roleRepo.findAllRoles();
  return items.map(toRoleDto);
}

export async function getRoleById(id) {
  const role = await roleRepo.findRoleById(id);
  if (!role) {
    const err = new Error('Role not found.');
    err.status = 404;
    throw err;
  }
  const perms = await menuPermService.getPermissionsForRole(role._id);
  return { role: toRoleDto(role), ...perms };
}

export async function createRole(payload, actor = null) {
  const roleName = String(payload.roleName ?? '').trim();
  if (!roleName) {
    const err = new Error('Role name is required.');
    err.status = 400;
    throw err;
  }

  const existing = await roleRepo.findRoleByName(roleName);
  if (existing) {
    const err = new Error('Role name already exists.');
    err.status = 409;
    throw err;
  }

  const role = await roleRepo.createRole({
    roleName,
    isActive: payload.isActive !== false,
    createdBy: actor,
    createdDate: new Date()
  });

  if (Array.isArray(payload.permissions) && payload.permissions.length) {
    await menuPermService.savePermissionsForRole(role._id, payload.permissions);
  } else {
    const err = new Error('At least one menu permission (View) must be selected.');
    err.status = 400;
    throw err;
  }

  return getRoleById(role._id);
}

export async function updateRole(id, payload, actor = null) {
  const role = await roleRepo.findRoleById(id);
  if (!role) {
    const err = new Error('Role not found.');
    err.status = 404;
    throw err;
  }

  const roleName = payload.roleName !== undefined ? String(payload.roleName).trim() : role.roleName;
  if (!roleName) {
    const err = new Error('Role name is required.');
    err.status = 400;
    throw err;
  }

  const duplicate = await roleRepo.findRoleByName(roleName, { excludeId: id });
  if (duplicate) {
    const err = new Error('Role name already exists.');
    err.status = 409;
    throw err;
  }

  const updated = await roleRepo.updateRoleById(id, {
    roleName,
    isActive: payload.isActive !== undefined ? payload.isActive !== false : role.isActive !== false,
    modifiedBy: actor
  });

  if (Array.isArray(payload.permissions)) {
    await menuPermService.savePermissionsForRole(id, payload.permissions);
  }

  return getRoleById(updated._id);
}

export async function setRoleActive(id, isActive, actor = null) {
  const role = await roleRepo.findRoleById(id);
  if (!role) {
    const err = new Error('Role not found.');
    err.status = 404;
    throw err;
  }
  if (role.isSystem && isActive === false) {
    const err = new Error('System roles cannot be deactivated.');
    err.status = 400;
    throw err;
  }
  await roleRepo.updateRoleById(id, { isActive: isActive !== false, modifiedBy: actor });
  return getRoleById(id);
}

export async function deleteRole(id, actor = null) {
  const role = await roleRepo.findRoleById(id);
  if (!role) {
    const err = new Error('Role not found.');
    err.status = 404;
    throw err;
  }
  if (role.isSystem) {
    const err = new Error('System roles cannot be deleted.');
    err.status = 400;
    throw err;
  }

  const assigned = await AppUser.countDocuments({
    activeStatus: { $ne: false },
    $or: [
      { roleId: role._id },
      { role: new RegExp(`^${role.roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    ]
  });
  if (assigned > 0) {
    const err = new Error('Cannot delete role assigned to active users.');
    err.status = 409;
    throw err;
  }

  const deleted = await roleRepo.softDeleteRoleById(id, actor);
  if (!deleted) {
    const err = new Error('Role could not be deleted.');
    err.status = 400;
    throw err;
  }
  return { ok: true, id: String(id) };
}

export async function listActiveRoleNames() {
  const items = await roleRepo.findAllRoles();
  return items.filter((r) => r.isActive !== false).map((r) => r.roleName);
}
