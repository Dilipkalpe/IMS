/**
 * Ensures default AppUser accounts exist (does not purge other data).
 * Run: npm run ensure:users
 */
import 'dotenv/config';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { AppUser } from '../src/models/AppUser.js';
import { hashPassword } from '../src/services/auth.js';

const DEFAULT_PASSWORD = 'Ims@2024';
const passwordHash = hashPassword(DEFAULT_PASSWORD);

const users = [
  { employeeId: 'EMP-ADMIN', username: 'admin', fullName: 'System Administrator', role: 'Administrator', department: 'Administration', email: 'admin@ims.local', activeStatus: true },
  { employeeId: 'EMP-1001', username: 'jsmith', fullName: 'John Smith', role: 'Manager', department: 'Sales', email: 'jsmith@ims.local', activeStatus: true },
  { employeeId: 'EMP-1002', username: 'rpillai', fullName: 'Rahul Pillai', role: 'Sales', department: 'Sales', email: 'rpillai@ims.local', activeStatus: true },
  { employeeId: 'EMP-1003', username: 'kmehta', fullName: 'Kavita Mehta', role: 'Purchase', department: 'Purchase', email: 'kmehta@ims.local', activeStatus: true },
  { employeeId: 'EMP-1004', username: 'astore', fullName: 'Store Keeper', role: 'Store', department: 'Inventory', email: 'store@ims.local', activeStatus: true },
  { employeeId: 'EMP-1005', username: 'finance', fullName: 'Finance User', role: 'Accounts', department: 'Finance', email: 'finance@ims.local', activeStatus: true }
];

async function main() {
  await connectDb();
  let created = 0;
  let updated = 0;

  for (const u of users) {
    const existing = await AppUser.findOne({ username: u.username }).select('+passwordHash');
    if (!existing) {
      await AppUser.create({ ...u, passwordHash });
      created++;
      continue;
    }
    if (!existing.passwordHash) {
      existing.passwordHash = passwordHash;
      await existing.save();
      updated++;
    }
  }

  const total = await AppUser.countDocuments();
  console.log(`Users ready: ${total} total (${created} created, ${updated} password set).`);
  console.log(`Login: admin / ${DEFAULT_PASSWORD}`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
