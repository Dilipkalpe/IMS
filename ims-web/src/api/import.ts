import { authHeaders } from './authToken';
import { getApiBaseUrl } from './config';

export interface ImportResult {
  success: boolean;
  type: string;
  label: string;
  navigateKey: string;
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  documents: string[];
}

export async function downloadImportTemplate(importType: string): Promise<void> {
  const base = getApiBaseUrl();
  const url = `${base}/api/import/${encodeURIComponent(importType)}/template`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] ?? `IMS_${importType}_template.xlsx`;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function importExcelFile(importType: string, file: File): Promise<ImportResult> {
  const base = getApiBaseUrl();
  const url = `${base}/api/import/${encodeURIComponent(importType)}`;
  const form = new FormData();
  form.append('file', file, file.name);

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<ImportResult>;
}
