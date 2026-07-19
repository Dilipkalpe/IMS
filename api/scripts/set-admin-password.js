/**
 * Set password for username admin.
 * Usage: node scripts/set-admin-password.js [newPassword]
 * Default password: admin
 */
import 'dotenv/config';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { AppUser } from '../src/models/AppUser.js';
import { hashPassword } from '../src/services/auth.js';

const newPassword = process.argv[2] || 'admin';

await connectDb();
const user = await AppUser.findOne({ username: 'admin' }).select('+passwordHash');
if (!user) {
  console.error('No admin user found. Run: npm run ensure:users');
  process.exit(1);
}
user.passwordHash = hashPassword(newPassword);
await user.save();
console.log(`Admin password updated. Login: admin / ${newPassword}`);
await disconnectDb();
