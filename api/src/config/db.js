import mongoose from 'mongoose';

let activeYearDbName = null;
let configConn = null;
let yearSwitchQueue = Promise.resolve();

export function getMongoUri() {
  // Use 127.0.0.1 (IPv4) — avoids ::1 ECONNREFUSED when no server listens on IPv6 localhost
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ims';
}

export function parseDbNameFromUri(uri = getMongoUri()) {
  const match = String(uri).match(/\/([^/?]+)(\?.*)?$/);
  return match ? match[1] : 'ims';
}

export function getMongoBaseUri() {
  const uri = getMongoUri();
  // If uri ends with /dbName (common), strip it so we can append /IWM_2526 etc.
  // Keep querystring intact.
  const match = uri.match(/^(.*?)(\/[^/?]+)?(\?.*)?$/);
  if (!match) return uri;
  const base = match[1];
  const qs = match[3] || '';
  return `${base}${qs}`;
}

export function getYearMongoUri(dbName) {
  const base = getMongoBaseUri();
  const [noQs, qs] = base.split('?');
  const suffix = qs ? `?${qs}` : '';
  return `${noQs}/${dbName}${suffix}`;
}

export function getActiveYearDbName() {
  return activeYearDbName;
}

export function getConfigConnection() {
  if (!configConn) {
    configConn = mongoose.createConnection();
  }
  return configConn;
}

function getConnectedDbName() {
  const conn = mongoose.connection;
  if (conn.readyState !== 1) return null;
  try {
    return conn.db?.databaseName ?? conn.name ?? null;
  } catch {
    return null;
  }
}

export async function dropDatabaseByName(dbName) {
  const name = String(dbName || '').trim();
  if (!name) throw new Error('Database name is required.');
  if (!configConn || configConn.readyState !== 1) throw new Error('Config database is not connected.');
  const client = configConn.getClient();
  await client.db(name).dropDatabase();
}

export async function connectDb() {
  const uri = getMongoUri();
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  activeYearDbName = parseDbNameFromUri(uri);

  const safeUri = uri.includes('@') ? uri.replace(/\/\/([^@]+)@/, '//***@') : uri;
  console.log(`MongoDB connected: ${safeUri}`);

  // Config connection for shared metadata (FinancialYear etc.)
  // Keep this separate so config models always use the shared DB even when the
  // default mongoose connection switches to a year DB.
  if (!configConn) {
    configConn = mongoose.createConnection();
  }
  if (configConn.readyState !== 1) {
    await configConn.openUri(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB (config) connected: ${safeUri}`);
  }
}

export async function switchToYearDb(dbName) {
  const name = String(dbName || '').trim();
  if (!name) {
    throw new Error('Year database name is required');
  }

  const run = yearSwitchQueue.then(async () => {
    const conn = mongoose.connection;

    if (conn.readyState === 2) {
      await conn.asPromise();
    }

    if (conn.readyState === 1) {
      const current = getConnectedDbName();
      if (current === name) {
        activeYearDbName = name;
        return;
      }

      // Different financial-year database — reconnect (serialized via yearSwitchQueue).
      await conn.close();
    }

    const uri = getYearMongoUri(name);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    activeYearDbName = name;

    const safeUri = uri.includes('@') ? uri.replace(/\/\/([^@]+)@/, '//***@') : uri;
    console.log(`MongoDB (year) connected: ${safeUri}`);
  });

  // Keep queue chain alive for later switches; errors still propagate via `await run`.
  yearSwitchQueue = run.catch((err) => {
    console.error('MongoDB year switch failed:', err);
  });
  await run;
}

export async function disconnectDb() {
  try {
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  try {
    if (configConn && configConn.readyState === 1) await configConn.close();
  } catch {
    /* ignore */
  }
  configConn = null;
  activeYearDbName = null;
  yearSwitchQueue = Promise.resolve();
}
