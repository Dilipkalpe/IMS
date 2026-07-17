import { AppUser } from './models/AppUser.js';
import { Role } from './models/Role.js';
import * as roleRepo from './repositories/roleRepository.js';
import * as menuPermService from './services/menuPermissionService.js';
import * as permRepo from './repositories/rolePermissionRepository.js';

const ADMIN_ROLE = 'Administrator';

export async function bootstrapRolesMenus() {
  await menuPermService.ensureMenuCatalogSeeded();

  let adminRole = await roleRepo.findRoleByName(ADMIN_ROLE);
  if (!adminRole) {
    adminRole = await Role.create({
      roleName: ADMIN_ROLE,
      isActive: true,
      isSystem: true,
      createdBy: 'system',
      createdDate: new Date()
    });
  } else if (!adminRole.isSystem) {
    await Role.updateOne({ _id: adminRole._id }, { $set: { isSystem: true } });
  }

  const existingPerms = await permRepo.countPermissionsWithView(adminRole._id);
  if (existingPerms === 0) {
    const menus = await menuPermService.getMenuTree();
    const allPerms = menuPermService.allPermissionsFromMenus(menus, { fullAccess: true });
    const rows = allPerms.map((p) => ({
      roleId: adminRole._id,
      menuId: p.menuId,
      menuKey: p.menuKey,
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      createdDate: new Date()
    }));
    await permRepo.replacePermissionsForRole(adminRole._id, rows);
    console.log('Role Master: seeded Administrator permissions.');
  }

  const adminUser = await AppUser.findOne({ username: 'admin' });
  if (adminUser && !adminUser.roleId) {
    adminUser.roleId = adminRole._id;
    adminUser.role = ADMIN_ROLE;
    await adminUser.save();
  }

  const roleCount = await Role.countDocuments({ isDeleted: { $ne: true } });
  if (roleCount === 1) {
    console.log('Role Master: menus and Administrator role ready.');
  }
}
