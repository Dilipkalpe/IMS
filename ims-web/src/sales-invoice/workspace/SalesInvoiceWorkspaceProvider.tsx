import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSalesInvoiceNavIntent, type SalesInvoiceOpenIntent } from '../context/SalesInvoiceNavIntent';
import { invalidateSalesInvoiceList } from '../repository/listCache';
import { recordToEditor } from '../repository/recordMappers';
import { useSalesInvoiceRepository } from '../repository/SalesInvoiceRepositoryContext';
import type { SalesInvoiceHeader, SalesInvoiceLineItem, SalesInvoiceTab } from '../types';
import { useSalesCustomerPicker } from '../../components/transaction/SalesCustomerPickerContext';
import { validateSalesWorkspaceDocument } from '../../components/transaction/salesWorkspaceValidation';
import { normalizeDocPrefix, prefixFromPeekNext } from '../../components/transaction/docPrefix';
import { closeWorkspaceTabWithoutConfirm } from '../../components/transaction/workspaceTabClose';
import { useWorkspaceListIntent } from '../../components/transaction/useWorkspaceListIntent';
import { confirmDiscardMultipleDirty, confirmDiscardUnsaved } from './confirmUnsaved';
import { createSalesInvoiceProductScanHandlers } from '../salesInvoiceProductActions';
import type { SalesProductInfo } from '../../components/transaction/salesProductLines';
import {
  applyLoadedDocument,
  countDirtyDocuments,
  createTabDocumentState,
  markDocumentDirty,
  markDocumentSaved,
  newTabUi,
  resetTabToNewBill,
  tabTitleFromState,
  type TabDocumentState,
} from './documentState';

interface SalesInvoiceWorkspaceContextValue {
  tabs: SalesInvoiceTab[];
  activeTabId: string;
  activeTab: SalesInvoiceTab | undefined;
  tabIds: string[];
  documents: Record<string, TabDocumentState>;
  getDocument: (tabId: string) => TabDocumentState;
  selectTab: (id: string) => void;
  closeTab: (id: string) => boolean;
  addTab: (intent?: 'new') => void;
  openDocumentInNewTab: (intent: SalesInvoiceOpenIntent) => Promise<void>;
  patchHeader: (tabId: string, key: keyof SalesInvoiceHeader, value: SalesInvoiceHeader[keyof SalesInvoiceHeader]) => void;
  patchLine: (tabId: string, lineId: string, patch: Partial<SalesInvoiceLineItem> | SalesInvoiceLineItem) => void;
  deleteLine: (tabId: string, lineId: string) => void;
  setBarcode: (tabId: string, value: string) => void;
  addLineFromScan: (tabId: string) => Promise<void>;
  addProductsFromBrowse: (tabId: string, products: SalesProductInfo[]) => Promise<void>;
  replaceLinesFromDeliveryChallans: (
    tabId: string,
    lines: SalesInvoiceLineItem[],
    dcReference: string,
  ) => void;
  setStatus: (tabId: string, message: string | null) => void;
  setErrors: (tabId: string, errors: TabDocumentState['errors']) => void;
  saveDocument: (tabId: string) => Promise<{ ok: boolean; firstField?: string; message?: string }>;
  reloadDocumentPayment: (
    tabId: string,
  ) => Promise<{ ok: boolean; paidAmount: number; balanceDue: number }>;
  prepareNewBill: (tabId: string, lineCount?: number) => Promise<void>;
  commitPrefix: (tabId: string) => Promise<void>;
  continueWithNextBill: (tabId: string) => Promise<void>;
  closeTabWithoutConfirm: (tabId: string) => number;
  requestCloseWorkspace: () => boolean;
  focusSeed: number;
}

const SalesInvoiceWorkspaceContext = createContext<SalesInvoiceWorkspaceContextValue | null>(null);

export function SalesInvoiceWorkspaceProvider({
  children,
  lineCount = 0,
}: {
  children: ReactNode;
  lineCount?: number;
}) {
  const repository = useSalesInvoiceRepository();
  const { validCustomerNames } = useSalesCustomerPicker();
  const { consumeOpenIntent } = useSalesInvoiceNavIntent();
  const initialTabId = 'tab-1';
  const [tabs, setTabs] = useState<SalesInvoiceTab[]>(() => [
    newTabUi(initialTabId, 'New Invoice', true),
  ]);
  const [tabCounter, setTabCounter] = useState(2);
  const [documents, setDocuments] = useState<Record<string, TabDocumentState>>(() => ({
    [initialTabId]: createTabDocumentState(lineCount),
  }));
  const [focusSeed, setFocusSeed] = useState(0);

  const activeTab = tabs.find((t) => t.isSelected) ?? tabs[0];
  const activeTabId = activeTab?.id ?? initialTabId;
  const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);

  const syncTabTitle = useCallback((tabId: string, doc: TabDocumentState) => {
    const title = tabTitleFromState(doc);
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, title } : t)));
  }, []);

  const updateDocument = useCallback(
    (tabId: string, updater: (doc: TabDocumentState) => TabDocumentState) => {
      setDocuments((prev) => {
        const current = prev[tabId];
        if (!current) return prev;
        const next = updater(current);
        syncTabTitle(tabId, next);
        return { ...prev, [tabId]: next };
      });
    },
    [syncTabTitle],
  );

  const getDocument = useCallback(
    (tabId: string) => {
      const doc = documents[tabId];
      if (!doc) throw new Error(`Missing document for tab ${tabId}`);
      return doc;
    },
    [documents],
  );

  const loadIntoTab = useCallback(
    async (tabId: string, intent: SalesInvoiceOpenIntent) => {
      updateDocument(tabId, (d) => ({ ...d, isLoading: true, loadError: null }));
      try {
        let record;
        if (intent.type === 'edit') {
          record = await repository.loadById(intent.documentId);
        } else if (intent.type === 'editFormatted') {
          record = await repository.loadByFormatted(intent.formatted);
        } else {
          const fresh = createTabDocumentState(lineCount);
          const prefix = normalizeDocPrefix(fresh.header.entryDocPrefix, 'SI');
          const next = await repository.peekNextNo(prefix);
          const header = {
            ...fresh.header,
            entryDocPrefix: prefixFromPeekNext(next, prefix),
            billNo: String(next.docNo),
          };
          updateDocument(tabId, (d) =>
            applyLoadedDocument(d, d.documentId ?? d.clientDocumentId, header, fresh.lines, 'New invoice.'),
          );
          return;
        }
        const editor = recordToEditor(record);
        updateDocument(tabId, (d) =>
          applyLoadedDocument(
            d,
            editor.documentId,
            editor.header,
            editor.lines,
            `Loaded ${record.formattedDocNo}.`,
            editor.paymentLinks,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Load failed.';
        updateDocument(tabId, (d) => ({
          ...d,
          isLoading: false,
          loadError: message,
          statusMessage: message,
        }));
      }
    },
    [lineCount, repository, updateDocument],
  );

  const openDocumentInNewTab = useCallback(
    async (intent: SalesInvoiceOpenIntent) => {
      const id = `tab-${tabCounter}`;
      setTabCounter((c) => c + 1);
      setTabs((prev) => [
        ...prev.map((t) => ({ ...t, isSelected: false })),
        newTabUi(id, intent.type === 'new' ? 'New Invoice' : 'Loading…', true),
      ]);
      setDocuments((prev) => ({ ...prev, [id]: createTabDocumentState(lineCount) }));
      setFocusSeed((s) => s + 1);
      await loadIntoTab(id, intent);
    },
    [lineCount, loadIntoTab, tabCounter],
  );

  const selectTab = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => ({ ...t, isSelected: t.id === id })));
    setFocusSeed((s) => s + 1);
  }, []);

  const closeTab = useCallback(
    (id: string): boolean => {
      const doc = documents[id];
      if (doc?.isDirty) {
        const ok = confirmDiscardUnsaved(
          'Discard unsaved changes?',
          `Tab "${tabs.find((t) => t.id === id)?.title ?? 'Invoice'}" has unsaved edits.`,
        );
        if (!ok) return false;
      }
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        if (!prev[idx]?.isSelected) return next;
        const newActive = next[Math.min(idx, next.length - 1)];
        return next.map((t) => ({ ...t, isSelected: t.id === newActive.id }));
      });
      setDocuments((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setFocusSeed((s) => s + 1);
      return true;
    },
    [documents, tabs],
  );

  const addTab = useCallback(() => {
    void openDocumentInNewTab({ type: 'new' });
  }, [openDocumentInNewTab]);

  const patchHeader = useCallback(
    (tabId: string, key: keyof SalesInvoiceHeader, value: SalesInvoiceHeader[keyof SalesInvoiceHeader]) => {
      updateDocument(tabId, (d) => {
        const header = { ...d.header, [key]: value };
        const errors = d.errors.filter((e) => e.field !== key);
        return markDocumentDirty({ ...d, errors, statusMessage: null }, header, d.lines);
      });
    },
    [updateDocument],
  );

  const patchLine = useCallback(
    (tabId: string, lineId: string, patch: Partial<SalesInvoiceLineItem> | SalesInvoiceLineItem) => {
      updateDocument(tabId, (d) => {
        const lines = d.lines.map((row) => {
          if (row.id !== lineId) return row;
          return typeof patch === 'object' && 'id' in patch && patch.id === lineId
            ? (patch as SalesInvoiceLineItem)
            : { ...row, ...patch };
        });
        return markDocumentDirty({ ...d, statusMessage: null }, d.header, lines);
      });
    },
    [updateDocument],
  );

  const deleteLine = useCallback(
    (tabId: string, lineId: string) => {
      updateDocument(tabId, (d) => {
        const filtered = d.lines.filter((r) => r.id !== lineId);
        const lines = filtered.map((r, i) => ({ ...r, sr: i + 1 }));
        return markDocumentDirty(d, d.header, lines);
      });
    },
    [updateDocument],
  );

  const setBarcode = useCallback(
    (tabId: string, value: string) => {
      updateDocument(tabId, (d) => ({ ...d, barcode: value }));
    },
    [updateDocument],
  );

  const replaceLinesFromDeliveryChallans = useCallback(
    (tabId: string, lines: SalesInvoiceLineItem[], dcReference: string) => {
      updateDocument(tabId, (d) => {
        const header = { ...d.header, dcReference };
        const message = `Loaded ${lines.length} line(s) from delivery challan(s).`;
        return markDocumentDirty({ ...d, statusMessage: message, errors: [] }, header, lines);
      });
    },
    [updateDocument],
  );

  const { addLineFromScan, addProductsFromBrowse } = useMemo(
    () =>
      createSalesInvoiceProductScanHandlers({
        getDoc: (tabId) => documents[tabId],
        updateDocument,
        markDirty: markDocumentDirty,
      }),
    [documents, updateDocument],
  );

  const setStatus = useCallback(
    (tabId: string, message: string | null) => {
      updateDocument(tabId, (d) => ({ ...d, statusMessage: message }));
    },
    [updateDocument],
  );

  const setErrors = useCallback(
    (tabId: string, errors: TabDocumentState['errors']) => {
      updateDocument(tabId, (d) => ({ ...d, errors }));
    },
    [updateDocument],
  );

  const validateDocument = useCallback(
    (doc: TabDocumentState) =>
      validateSalesWorkspaceDocument({
        header: doc.header,
        lines: doc.lines,
        validCustomerNames,
        billNoLabel: 'Invoice number',
      }),
    [validCustomerNames],
  );

  const saveDocument = useCallback(
    async (tabId: string) => {
      const doc = documents[tabId];
      if (!doc) return { ok: false, message: 'Tab not found.' };
      if (doc.isSaving) return { ok: false, message: 'Save already in progress.' };
      const errors = validateDocument(doc);
      if (errors.length > 0) {
        setErrors(tabId, errors);
        setStatus(tabId, 'Fix validation errors before continuing.');
        return { ok: false, firstField: errors[0].field, message: 'Validation failed.' };
      }
      setErrors(tabId, []);
      updateDocument(tabId, (d) => ({ ...d, isSaving: true }));
      try {
        const result = await repository.save({
          id: doc.documentId,
          header: doc.header,
          lines: doc.lines,
          status: 'open',
        });
        const editor = recordToEditor(result.record);
        updateDocument(tabId, (d) =>
          markDocumentSaved(
            d,
            editor.documentId,
            editor.header,
            editor.lines,
            result.created ? `Created ${result.record.formattedDocNo}.` : `Saved ${result.record.formattedDocNo}.`,
            editor.paymentLinks,
          ),
        );
        invalidateSalesInvoiceList();
        return { ok: true, message: result.record.formattedDocNo };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed.';
        updateDocument(tabId, (d) => ({ ...d, isSaving: false, statusMessage: message }));
        return { ok: false, message };
      }
    },
    [documents, repository, setErrors, setStatus, updateDocument, validateDocument],
  );

  const reloadDocumentPayment = useCallback(
    async (tabId: string) => {
      const doc = documents[tabId];
      if (!doc?.documentId) {
        return { ok: false, paidAmount: 0, balanceDue: 0 };
      }

      try {
        const record = await repository.loadById(doc.documentId);
        const paidAmount = record.paidAmount ?? 0;
        const balanceDue = record.balanceDue ?? 0;
        const paymentLinks = record.paymentLinks ?? [];
        updateDocument(tabId, (d) => ({
          ...d,
          header: { ...d.header, paidAmount },
          paymentLinks,
          statusMessage: `Payment updated for ${record.formattedDocNo}.`,
        }));
        return { ok: true, paidAmount, balanceDue };
      } catch {
        return { ok: false, paidAmount: 0, balanceDue: 0 };
      }
    },
    [documents, repository, updateDocument],
  );

  const prepareNewBill = useCallback(
    async (tabId: string) => {
      const fresh = createTabDocumentState(lineCount);
      const prefix = normalizeDocPrefix(fresh.header.entryDocPrefix, 'SI');
      const next = await repository.peekNextNo(prefix);
      const header = {
        ...fresh.header,
        entryDocPrefix: prefixFromPeekNext(next, prefix),
        billNo: String(next.docNo),
      };
      updateDocument(tabId, (d) => resetTabToNewBill(d, header, fresh.lines, 'New bill ready.'));
    },
    [lineCount, repository, updateDocument],
  );

  const commitPrefix = useCallback(
    async (tabId: string) => {
      const doc = documents[tabId];
      if (!doc || doc.documentId) return;
      const prefix = normalizeDocPrefix(doc.header.entryDocPrefix, 'SI');
      const next = await repository.peekNextNo(prefix);
      updateDocument(tabId, (d) => {
        const header = {
          ...d.header,
          entryDocPrefix: prefixFromPeekNext(next, prefix),
          billNo: String(next.docNo),
        };
        return markDocumentDirty({ ...d, statusMessage: null }, header, d.lines);
      });
    },
    [documents, repository, updateDocument],
  );

  const closeTabWithoutConfirm = useCallback(
    (id: string) =>
      closeWorkspaceTabWithoutConfirm(id, setTabs, setDocuments, setFocusSeed),
    [],
  );

  const continueWithNextBill = useCallback(
    async (tabId: string) => {
      await openDocumentInNewTab({ type: 'new' });
      closeTabWithoutConfirm(tabId);
    },
    [closeTabWithoutConfirm, openDocumentInNewTab],
  );

  const defaultNewIntent = useMemo(() => ({ type: 'new' as const }), []);

  useWorkspaceListIntent({
    initialTabId,
    consumeOpenIntent,
    loadIntoTab,
    defaultNewIntent,
    onIntentLoaded: () => setFocusSeed((s) => s + 1),
  });


  const requestCloseWorkspace = useCallback((): boolean => {
    const dirty = countDirtyDocuments(documents);
    if (dirty > 0 && !confirmDiscardMultipleDirty(dirty)) return false;
    return true;
  }, [documents]);

  const value = useMemo(
    (): SalesInvoiceWorkspaceContextValue => ({
      tabs,
      activeTabId,
      activeTab,
      tabIds,
      documents,
      getDocument,
      selectTab,
      closeTab,
      addTab,
      openDocumentInNewTab,
      patchHeader,
      patchLine,
      deleteLine,
      setBarcode,
      addLineFromScan,
      addProductsFromBrowse,
      replaceLinesFromDeliveryChallans,
      setStatus,
      setErrors,
      saveDocument,
      reloadDocumentPayment,
      prepareNewBill,
      commitPrefix,
      continueWithNextBill,
      closeTabWithoutConfirm,
      requestCloseWorkspace,
      focusSeed,
    }),
    [
      activeTab,
      activeTabId,
      addTab,
      addLineFromScan,
      addProductsFromBrowse,
      replaceLinesFromDeliveryChallans,
      closeTab,
      closeTabWithoutConfirm,
      commitPrefix,
      continueWithNextBill,
      deleteLine,
      documents,
      focusSeed,
      getDocument,
      openDocumentInNewTab,
      patchHeader,
      patchLine,
      prepareNewBill,
      requestCloseWorkspace,
      saveDocument,
      selectTab,
      setBarcode,
      setErrors,
      setStatus,
      tabIds,
      tabs,
    ],
  );

  return (
    <SalesInvoiceWorkspaceContext.Provider value={value}>{children}</SalesInvoiceWorkspaceContext.Provider>
  );
}

export function useSalesInvoiceWorkspace(): SalesInvoiceWorkspaceContextValue {
  const ctx = useContext(SalesInvoiceWorkspaceContext);
  if (!ctx) throw new Error('SalesInvoiceWorkspaceProvider is required.');
  return ctx;
}
