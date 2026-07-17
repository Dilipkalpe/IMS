/** Normalize Mongo/API document id for list rows and delete calls. */
export function recordDocumentId(record: { _id?: string; id?: string }): string {
  const raw = record._id ?? record.id;
  return raw != null && String(raw).trim() !== '' ? String(raw) : '';
}
