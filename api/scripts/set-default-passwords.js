/**
 * Sets password admin on all AppUser rows missing passwordHash.
 * Safe to run without wiping data: node scripts/set-default-passwords.js
 */
import 'dotenv/config';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { AppUser } from '../src/models/AppUser.js';
import { hashPassword } from '../src/services/auth.js';

const DEFAULT_PASSWORD = 'admin';

async function main() {
  await connectDb();
  const hash = hashPassword(DEFAULT_PASSWORD);
  const result = await AppUser.updateMany(
    { $or: [{ passwordHash: { $exists: false } }, { passwordHash: null }, { passwordHash: '' }] },
    { $set: { passwordHash: hash } }
  );
  console.log(`Updated ${result.modifiedCount} user(s) with default password: ${DEFAULT_PASSWORD}`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
