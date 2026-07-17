import type { InvoicePaymentLink } from '../../types/invoicePaymentLink';
import type { SalesInvoiceHeader, SalesInvoiceLineItem, SalesInvoiceTab } from '../types';
import { createNewDocumentState, serializeDocumentBaseline } from '../repository/recordMappers';

export interface TabDocumentState {
  /** Persisted repository id; null until first save. */
  documentId: string | null;
  /** Stable client id for print/export before persist. */
  clientDocumentId: string;
  header: SalesInvoiceHeader;
  lines: SalesInvoiceLineItem[];
  barcode: string;
  errors: { field: string; message: string }[];
  statusMessage: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  baseline: string;
  paymentLinks: InvoicePaymentLink[];
}

export function newClientDocumentId(): string {
  return `temp:${crypto.randomUUID()}`;
}

export function resetTabToNewBill(
  state: TabDocumentState,
  header: SalesInvoiceHeader,
  lines: SalesInvoiceLineItem[],
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
    paymentLinks: [],
  };
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
    paymentLinks: [],
  };
}

export function applyLoadedDocument(
  state: TabDocumentState,
  documentId: string,
  header: SalesInvoiceHeader,
  lines: SalesInvoiceLineItem[],
  statusMessage?: string,
  paymentLinks: InvoicePaymentLink[] = [],
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
    paymentLinks,
  };
}

export function markDocumentDirty(state: TabDocumentState, header: SalesInvoiceHeader, lines: SalesInvoiceLineItem[]): TabDocumentState {
  const serialized = serializeDocumentBaseline(header, lines);
  return {
    ...state,
    header,
    lines,
    isDirty: serialized !== state.baseline,
  };
}

export function markDocumentSaved(
  state: TabDocumentState,
  documentId: string,
  header: SalesInvoiceHeader,
  lines: SalesInvoiceLineItem[],
  message: string,
  paymentLinks: InvoicePaymentLink[] = state.paymentLinks,
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
    paymentLinks,
  };
}

export function tabTitleFromState(state: TabDocumentState): string {
  const prefix = state.header.entryDocPrefix || 'SI';
  const no = state.header.billNo?.trim();
  if (no) return `${prefix}-${no}${state.isDirty ? ' *' : ''}`;
  return `New Invoice${state.isDirty ? ' *' : ''}`;
}

export function newTabUi(id: string, title: string, selected = false): SalesInvoiceTab {
  return { id, title, isSelected: selected };
}

export function countDirtyDocuments(documents: Record<string, TabDocumentState>): number {
  return Object.values(documents).filter((d) => d.isDirty).length;
}
