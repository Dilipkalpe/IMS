import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { getMongoUri } from '../config/db.js';
import { writeProgrammaticBackupArchive } from './programmaticDatabaseBackup.js';

const LOG_FILE_NAME = 'backup-log.jsonl';

function sanitizeFileName(fileName) {
  const base = path.basename(String(fileName ?? '').trim());
  if (!base || base !== fileName || base.includes('..')) {
    throw new Error('Invalid backup file name.');
  }
  if (!/^DatabaseBackup_\d{8}_\d{6}\.bak$/i.test(base)) {
    throw new Error('Backup file name must match DatabaseBackup_YYYYMMDD_HHMMSS.bak');
  }
  return base;
}

function isMongodumpMissingError(err) {
  const message = String(err?.message ?? err ?? '');
  return (
    err?.code === 'ENOENT' ||
    /mongodump was not found/i.test(message) ||
    /not recognized as an internal or external command/i.test(message)
  );
}

function runMongodump(uri, archivePath) {
  return new Promise((resolve, reject) => {
    const args = [`--uri=${uri}`, `--archive=${archivePath}`, '--gzip'];
    const proc = spawn('mongodump', args, { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'mongodump was not found. Install MongoDB Database Tools and ensure mongodump is on the system PATH.'
          )
        );
        return;
      }
      reject(err);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `mongodump exited with code ${code}`));
    });
  });
}

async function appendBackupLog(logDirectory, entry) {
  try {
    await fs.mkdir(logDirectory, { recursive: true });
    const logPath = path.join(logDirectory, LOG_FILE_NAME);
    await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (err) {
    console.warn(`Failed to write backup log: ${err.message}`);
  }
}

export async function createDatabaseBackup({ outputDirectory, fileName, requestedBy }) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected. Start MongoDB and ensure the API is running.');
  }

  const safeDir = path.resolve(String(outputDirectory ?? '').trim());
  const safeName = sanitizeFileName(fileName);
  const outputFilePath = path.join(safeDir, safeName);

  await fs.mkdir(safeDir, { recursive: true });

  try {
    await fs.access(safeDir, fs.constants.W_OK);
  } catch {
    throw new Error(`Cannot write to backup folder: ${safeDir}`);
  }

  const tempPath = `${outputFilePath}.tmp`;
  try {
    try {
      await runMongodump(getMongoUri(), tempPath);
    } catch (err) {
      if (!isMongodumpMissingError(err)) {
        throw err;
      }
      await fs.unlink(tempPath).catch(() => {});
      await writeProgrammaticBackupArchive(tempPath);
    }
    await fs.rename(tempPath, outputFilePath);
  } catch (err) {
    try {
      await fs.unlink(tempPath);
    } catch {
      /* ignore */
    }
    throw err;
  }

  const stat = await fs.stat(outputFilePath);
  if (stat.size < 64) {
    throw new Error('Backup file was created but appears incomplete.');
  }

  const logEntry = {
    timestampUtc: new Date().toISOString(),
    user: requestedBy || 'unknown',
    status: 'Success',
    filePath: outputFilePath,
    fileSizeBytes: stat.size
  };

  await appendBackupLog(safeDir, logEntry);

  return {
    filePath: outputFilePath,
    fileName: safeName,
    fileSizeBytes: stat.size,
    createdAtUtc: logEntry.timestampUtc
  };
}
