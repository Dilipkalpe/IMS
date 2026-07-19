/**
 * Set the same login password on every AppUser (does not delete users).
 * Usage: node scripts/set-all-user-passwords.js [password]
 * Default password: admin
 */
import 'dotenv/config';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { AppUser } from '../src/models/AppUser.js';
import { hashPassword } from '../src/services/auth.js';

const newPassword = process.argv[2] || 'admin';

await connectDb();
const hash = hashPassword(newPassword);
const result = await AppUser.updateMany({}, { $set: { passwordHash: hash } });
console.log(`Updated ${result.modifiedCount} user(s). Login password for all users: ${newPassword}`);
console.log('Example: admin / ' + newPassword);
await disconnectDb();
