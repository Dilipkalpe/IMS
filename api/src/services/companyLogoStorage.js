import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const MAX_LOGO_BYTES = 350_000;
const LOGO_DATA_URI_RE = /^data:image\/(png|jpe?g|gif|webp);base64,/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_ROOT = path.resolve(__dirname, '..', '..');
export const COMPANY_LOGO_DIR = path.join(API_ROOT, 'uploads', 'company-logos');

const MIME_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const EXT_TO_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function normalizeCompanyCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

function logoFileBase(code) {
  return normalizeCompanyCode(code).replace(/[^A-Z0-9_-]/g, '_');
}

export function companyLogoPublicPath(code) {
  const normalized = normalizeCompanyCode(code);
  return `/api/companies/by-code/${encodeURIComponent(normalized)}/logo`;
}

function detectImageMeta(buffer) {
  if (!buffer || buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: 'image/png', ext: '.png' };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mime: 'image/gif', ext: '.gif' };
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }
  return null;
}

function parseDataUri(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  if (!LOGO_DATA_URI_RE.test(raw)) {
    const err = new Error('Company logo must be a PNG, JPEG, GIF, or WebP image.');
    err.status = 400;
    throw err;
  }
  const comma = raw.indexOf(',');
  const payload = comma >= 0 ? raw.slice(comma + 1) : '';
  let buffer;
  try {
    buffer = Buffer.from(payload, 'base64');
  } catch {
    const err = new Error('Company logo base64 payload is invalid.');
    err.status = 400;
    throw err;
  }
  if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) {
    const err = new Error(`Company logo is too large (max ${Math.round(MAX_LOGO_BYTES / 1024)} KB).`);
    err.status = 400;
    throw err;
  }
  const meta = detectImageMeta(buffer);
  if (!meta) {
    const err = new Error('Company logo file content is not a supported image.');
    err.status = 400;
    throw err;
  }
  return { buffer, ...meta };
}

export async function ensureLogoDir() {
  await fs.mkdir(COMPANY_LOGO_DIR, { recursive: true });
}

async function removeExistingLogoFiles(code) {
  const base = logoFileBase(code);
  await Promise.all(
    Object.values(MIME_TO_EXT)
      .filter((ext, index, arr) => arr.indexOf(ext) === index)
      .map(async (ext) => {
        const filePath = path.join(COMPANY_LOGO_DIR, `${base}${ext}`);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          if (err?.code !== 'ENOENT') throw err;
        }
      }),
  );
}

export async function saveCompanyLogoFromInput(code, input) {
  const normalized = normalizeCompanyCode(code);
  if (!normalized) {
    const err = new Error('Company code is required to store a logo.');
    err.status = 400;
    throw err;
  }

  const raw = String(input ?? '').trim();
  if (!raw) {
    await deleteCompanyLogoFiles(normalized);
    return '';
  }

  if (isCompanyLogoUrl(raw)) {
    return raw;
  }

  const parsed = parseDataUri(raw);
  await ensureLogoDir();
  await removeExistingLogoFiles(normalized);

  const fileName = `${logoFileBase(normalized)}${parsed.ext}`;
  const filePath = path.join(COMPANY_LOGO_DIR, fileName);
  await fs.writeFile(filePath, parsed.buffer);

  return companyLogoPublicPath(normalized);
}

export async function deleteCompanyLogoFiles(code) {
  await removeExistingLogoFiles(code);
}

/** Rename on-disk logo when company code changes; returns new public path or empty string. */
export async function renameCompanyLogoFiles(oldCode, newCode) {
  const oldBase = logoFileBase(oldCode);
  const newBase = logoFileBase(newCode);
  if (oldBase === newBase) return companyLogoPublicPath(newCode);

  for (const ext of Object.keys(EXT_TO_MIME)) {
    const oldPath = path.join(COMPANY_LOGO_DIR, `${oldBase}${ext}`);
    const newPath = path.join(COMPANY_LOGO_DIR, `${newBase}${ext}`);
    try {
      await fs.access(oldPath);
      await removeExistingLogoFiles(newCode);
      await fs.rename(oldPath, newPath);
      return companyLogoPublicPath(newCode);
    } catch (err) {
      if (err?.code === 'ENOENT') continue;
      throw err;
    }
  }
  return '';
}

export async function readCompanyLogoFile(code) {
  const base = logoFileBase(code);
  for (const ext of Object.keys(EXT_TO_MIME)) {
    const filePath = path.join(COMPANY_LOGO_DIR, `${base}${ext}`);
    try {
      const buffer = await fs.readFile(filePath);
      return { buffer, mime: EXT_TO_MIME[ext], filePath };
    } catch (err) {
      if (err?.code !== 'ENOENT') throw err;
    }
  }
  return null;
}

export function isInlineLogoDataUri(value) {
  return LOGO_DATA_URI_RE.test(String(value ?? '').trim());
}

export function isCompanyLogoUrl(value) {
  const raw = String(value ?? '').trim();
  return raw.startsWith('/api/companies/by-code/') && raw.endsWith('/logo');
}

/** Lazy migration: inline base64 in MongoDB -> file on disk. */
export async function migrateInlineCompanyLogo(companyDoc) {
  if (!companyDoc || !isInlineLogoDataUri(companyDoc.logoImage)) {
    return companyDoc?.logoImage ?? '';
  }
  const logoUrl = await saveCompanyLogoFromInput(companyDoc.code, companyDoc.logoImage);
  companyDoc.logoImage = logoUrl;
  await companyDoc.save();
  return logoUrl;
}

export function toCompanyLogoDto(companyLike) {
  const raw = String(companyLike?.logoImage ?? '').trim();
  const hasInline = isInlineLogoDataUri(raw);
  const hasUrl = isCompanyLogoUrl(raw);
  const hasLogo = hasInline || hasUrl;
  const logoUrl = hasUrl ? raw : hasInline ? companyLogoPublicPath(companyLike.code) : '';
  return {
    hasLogo,
    logoUrl,
    logoImage: logoUrl,
  };
}
