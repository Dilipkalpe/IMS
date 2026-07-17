import { AppUser } from './models/AppUser.js';
import { hashPassword } from './services/auth.js';

const DEFAULT_PASSWORD = 'admin';

const defaultUsers = [
  { employeeId: 'EMP-ADMIN', username: 'admin', fullName: 'System Administrator', role: 'Administrator', department: 'Administration', email: 'admin@ims.local', activeStatus: true, canPrintBarcodeLabels: true },
  { employeeId: 'EMP-1001', username: 'jsmith', fullName: 'John Smith', role: 'Manager', department: 'Sales', email: 'jsmith@ims.local', activeStatus: true },
  { employeeId: 'EMP-1002', username: 'rpillai', fullName: 'Rahul Pillai', role: 'Sales', department: 'Sales', email: 'rpillai@ims.local', activeStatus: true },
  { employeeId: 'EMP-1003', username: 'kmehta', fullName: 'Kavita Mehta', role: 'Purchase', department: 'Purchase', email: 'kmehta@ims.local', activeStatus: true, canPrintBarcodeLabels: true },
  { employeeId: 'EMP-1004', username: 'astore', fullName: 'Store Keeper', role: 'Store', department: 'Inventory', email: 'store@ims.local', activeStatus: true },
  { employeeId: 'EMP-1005', username: 'finance', fullName: 'Finance User', role: 'Accounts', department: 'Finance', email: 'finance@ims.local', activeStatus: true }
];

/** Creates default login users when the database has none (safe for existing data). */
export async function bootstrapUsersIfEmpty() {
  const count = await AppUser.countDocuments();
  if (count > 0) return;

  const passwordHash = hashPassword(DEFAULT_PASSWORD);
  await AppUser.insertMany(defaultUsers.map((u) => ({ ...u, passwordHash })));
  console.log(`\nCreated default AppUser accounts (login: admin / ${DEFAULT_PASSWORD}).`);
  console.log('Or run: npm run ensure:users\n');
}
