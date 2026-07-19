import 'dotenv/config';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { AppUser } from '../src/models/AppUser.js';
import { authenticateUser, hashPassword, verifyPassword } from '../src/services/auth.js';

await connectDb();

const admin = await AppUser.findOne({ username: 'admin' }).select('+passwordHash');
console.log('admin found:', !!admin);
console.log('active:', admin?.activeStatus);
console.log('has passwordHash:', !!admin?.passwordHash);
console.log('passwordHash prefix:', admin?.passwordHash?.slice(0, 20));

const test = verifyPassword('Ims@2024', admin?.passwordHash);
console.log('verifyPassword(Ims@2024):', test);

const fresh = hashPassword('Ims@2024');
console.log('fresh hash verify:', verifyPassword('Ims@2024', fresh));

const result = await authenticateUser('admin', 'Ims@2024');
console.log('authenticateUser:', JSON.stringify(result, null, 2));

await disconnectDb();
