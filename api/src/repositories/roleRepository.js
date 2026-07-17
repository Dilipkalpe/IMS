import { Role } from '../models/Role.js';

export async function findAllRoles({ includeDeleted = false } = {}) {
  const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
  return Role.find(filter).sort({ roleName: 1 }).lean();
}

export async function findRoleById(id) {
  return Role.findOne({ _id: id, isDeleted: { $ne: true } }).lean();
}

export async function findRoleByName(roleName, { excludeId = null } = {}) {
  const filter = {
    roleName: new RegExp(`^${escapeRegex(roleName)}$`, 'i'),
    isDeleted: { $ne: true }
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Role.findOne(filter).lean();
}

export async function createRole(data) {
  return Role.create(data);
}

export async function updateRoleById(id, data) {
  return Role.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { ...data, modifiedDate: new Date() },
    { new: true, runValidators: true }
  ).lean();
}

export async function softDeleteRoleById(id, modifiedBy = null) {
  return Role.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true }, isSystem: { $ne: true } },
    { isDeleted: true, isActive: false, modifiedBy, modifiedDate: new Date() },
    { new: true }
  ).lean();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
