import type { SalesOrderHeader, SalesOrderLineItem, SalesOrderTab } from '../types';
import { createNewDocumentState, serializeDocumentBaseline } from '../repository/recordMappers';

export interface TabDocumentState {
  documentId: string | null;
  clientDocumentId: string;
  header: SalesOrderHeader;
  lines: SalesOrderLineItem[];
  barcode: string;
  errors: { field: string; message: string }[];
  statusMessage: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  baseline: string;
}

export function newClientDocumentId(): string {
  return `temp:${crypto.randomUUID()}`;
}

export function createTabDocumentState(lineCount = 0, documentId: string | null = null): TabDocumentState {
  const { header, lines } = createNewDocumentState(lineCount);
  return {
    documentId,
    clientDocumentId: documentId ?? newClientDocumentId(),
    header,
    lines,
    barcode: '',
    errors: [],
    statusMessage: null,
    isDirty: false,
    isLoading: false,
    isSaving: false,
    loadError: null,
    baseline: serializeDocumentBaseline(header, lines),
  };
}

export function applyLoadedDocument(
  state: TabDocumentState,
  documentId: string | null,
  header: SalesOrderHeader,
  lines: SalesOrderLineItem[],
  statusMessage?: string,
): TabDocumentState {
  const baseline = serializeDocumentBaseline(header, lines);
  return {
    ...state,
    documentId,
    clientDocumentId: documentId ?? state.clientDocumentId,
    header,
    lines,
    barcode: '',
    errors: [],
    statusMessage: statusMessage ?? null,
    isDirty: false,
    isLoading: false,
    isSaving: false,
    loadError: null,
    baseline,
  };
}

export function markDocumentDirty(
  state: TabDocumentState,
  header: SalesOrderHeader,
  lines: SalesOrderLineItem[],
): TabDocumentState {
  return { ...state, header, lines, isDirty: serializeDocumentBaseline(header, lines) !== state.baseline };
}

export function markDocumentSaved(
  state: TabDocumentState,
  documentId: string,
  header: SalesOrderHeader,
  lines: SalesOrderLineItem[],
  message: string,
): TabDocumentState {
  const baseline = serializeDocumentBaseline(header, lines);
  return {
    ...state,
    documentId,
    clientDocumentId: documentId,
    header,
    lines,
    isDirty: false,
    isSaving: false,
    statusMessage: message,
    baseline,
  };
}

export function resetTabToNewBill(
  state: TabDocumentState,
  header: SalesOrderHeader,
  lines: SalesOrderLineItem[],
  message: string,
): TabDocumentState {
  const baseline = serializeDocumentBaseline(header, lines);
  return {
    ...state,
    documentId: null,
    clientDocumentId: newClientDocumentId(),
    header,
    lines,
    barcode: '',
    errors: [],
    statusMessage: message,
    isDirty: false,
    isLoading: false,
    isSaving: false,
    loadError: null,
    baseline,
  };
}

export function tabTitleFromState(state: TabDocumentState): string {
  const prefix = state.header.entryDocPrefix || 'SO';
  const no = state.header.billNo?.trim();
  if (no) return `${prefix}-${no}${state.isDirty ? ' *' : ''}`;
  return `New Order${state.isDirty ? ' *' : ''}`;
}

export function newTabUi(id: string, title: string, selected = false): SalesOrderTab {
  return { id, title, isSelected: selected };
}

export function countDirtyDocuments(documents: Record<string, TabDocumentState>): number {
  return Object.values(documents).filter((d) => d.isDirty).length;
}
