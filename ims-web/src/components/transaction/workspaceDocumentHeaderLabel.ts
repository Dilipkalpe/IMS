export interface WorkspaceHeaderDocument {
  documentId: string | null;
  header: {
    entryDocPrefix?: string;
    billNo?: string;
  };
}

/** Main-window breadcrumb suffix for an open workspace tab. */
export function workspaceDocumentHeaderLabel(doc: WorkspaceHeaderDocument | undefined): string {
  if (!doc?.documentId) return 'New';
  const prefix = doc.header.entryDocPrefix?.trim();
  const no = doc.header.billNo?.trim();
  if (prefix && no) return `${prefix}-${no}`;
  if (no) return no;
  return 'New';
}
