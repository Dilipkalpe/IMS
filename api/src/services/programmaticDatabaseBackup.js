import { createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { finished } from 'stream/promises';
import mongoose from 'mongoose';

const BACKUP_FORMAT = 'ims-mongo-json-v1';

function serializeDoc(doc) {
  if (doc?._id && typeof doc._id.toString === 'function') {
    return { ...doc, _id: { $oid: doc._id.toString() } };
  }
  return doc;
}

function createGzipWriter(outputFilePath) {
  const gzip = createGzip({ level: 6 });
  const fileStream = createWriteStream(outputFilePath);
  gzip.pipe(fileStream);

  const write = (chunk) =>
    new Promise((resolve, reject) => {
      const ok = gzip.write(chunk, 'utf8', (err) => {
        if (err) reject(err);
      });
      if (ok) resolve();
      else gzip.once('drain', resolve);
    });

  const end = () =>
    new Promise((resolve, reject) => {
      gzip.end(() => finished(fileStream).then(resolve).catch(reject));
    });

  return { write, end };
}

/**
 * Exports all non-system collections to a gzip-compressed JSON archive (.bak).
 * Streams collection-by-collection to avoid JSON.stringify size limits on large databases.
 */
export async function writeProgrammaticBackupArchive(outputFilePath) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected. Start MongoDB and ensure the API is running.');
  }

  const db = mongoose.connection.db;
  const collectionInfos = await db.listCollections().toArray();
  const collectionNames = collectionInfos
    .map((c) => c.name)
    .filter((name) => name && !name.startsWith('system.'))
    .sort();

  const { write, end } = createGzipWriter(outputFilePath);

  await write(
    `{"format":${JSON.stringify(BACKUP_FORMAT)}` +
      `,"exportedAtUtc":${JSON.stringify(new Date().toISOString())}` +
      `,"database":${JSON.stringify(db.databaseName)}` +
      ',"collections":{'
  );

  for (let i = 0; i < collectionNames.length; i++) {
    const name = collectionNames[i];
    if (i > 0) await write(',');
    await write(`${JSON.stringify(name)}:[`);

    const cursor = db.collection(name).find({}).batchSize(250);
    let first = true;
    for await (const doc of cursor) {
      const serialized = JSON.stringify(serializeDoc(doc));
      await write(first ? serialized : `,${serialized}`);
      first = false;
    }
    await write(']');
  }

  await write('}}');
  await end();
}
