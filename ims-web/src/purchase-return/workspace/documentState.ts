import type { PurchaseReturnHeader, PurchaseReturnLineItem, PurchaseReturnTab } from '../types';
import { createNewDocumentState, serializeDocumentBaseline } from '../repository/recordMappers';

export interface TabDocumentState {
  documentId: string | null;
  clientDocumentId: string;
  header: PurchaseReturnHeader;
  lines: PurchaseReturnLineItem[];
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

export function createTabDocumentState(lineCount = 8, documentId: string | null = null): TabDocumentState {
  const { header, lines } = createNewDocumentState(lineCount);
  return {
    documentId,
    clientDocumentId: documentId ?? newClientDocumentId(),
    header,
    lines,
    barcode: '',
    errors: [],
    statusMessage: null,
    isDirty: !documentId,
    isLoading: false,
    isSaving: false,
    loadError: null,
    baseline: serializeDocumentBaseline(header, lines),
  };
}

export function applyLoadedDocument(
  state: TabDocumentState,
  documentId: string,
  header: PurchaseReturnHeader,
  lines: PurchaseReturnLineItem[],
  statusMessage?: string,
): TabDocumentState {
  const baseline = serializeDocumentBaseline(header, lines);
  return {
    ...state,
    documentId,
    clientDocumentId: documentId,
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
  header: PurchaseReturnHeader,
  lines: PurchaseReturnLineItem[],
): TabDocumentState {
  return { ...state, header, lines, isDirty: serializeDocumentBaseline(header, lines) !== state.baseline };
}

export function markDocumentSaved(
  state: TabDocumentState,
  documentId: string,
  header: PurchaseReturnHeader,
  lines: PurchaseReturnLineItem[],
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
  header: PurchaseReturnHeader,
  lines: PurchaseReturnLineItem[],
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
  return `New Return${state.isDirty ? ' *' : ''}`;
}

export function newTabUi(id: string, title: string, selected = false): PurchaseReturnTab {
  return { id, title, isSelected: selected };
}

export function countDirtyDocuments(documents: Record<string, TabDocumentState>): number {
  return Object.values(documents).filter((d) => d.isDirty).length;
}
