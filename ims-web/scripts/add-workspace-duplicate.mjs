/**
 * Adds duplicateToNewTab to transaction workspace providers (one-time parity patch helper).
 * Run: node scripts/add-workspace-duplicate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'src');

const modules = [
  {
    dir: 'quotation/workspace/QuotationWorkspaceProvider.tsx',
    tabTitle: 'Duplicated quotation',
    prefixFn: 'normalizeSoPrefix(source.header.entryDocPrefix)',
    nextPrefix: 'next.soPrefix',
  },
  {
    dir: 'delivery-challan/workspace/DeliveryChallanWorkspaceProvider.tsx',
    tabTitle: 'Duplicated challan',
    prefixFn: 'normalizeSoPrefix(source.header.entryDocPrefix)',
    nextPrefix: 'next.soPrefix',
  },
  {
    dir: 'sales-invoice/workspace/SalesInvoiceWorkspaceProvider.tsx',
    tabTitle: 'Duplicated invoice',
    prefixFn: 'normalizeDocPrefix(source.header.entryDocPrefix, "INV")',
    nextPrefix: 'prefixFromPeekNext(next)',
    extraImport: "import { normalizeDocPrefix, prefixFromPeekNext } from '../../components/transaction/docPrefix';",
  },
  {
    dir: 'sales-return/workspace/SalesReturnWorkspaceProvider.tsx',
    tabTitle: 'Duplicated return',
    prefixFn: 'normalizeSoPrefix(source.header.entryDocPrefix)',
    nextPrefix: 'next.soPrefix',
  },
  {
    dir: 'purchase-order/workspace/PurchaseOrderWorkspaceProvider.tsx',
    tabTitle: 'Duplicated PO',
    prefixFn: "normalizeDocPrefix(source.header.entryDocPrefix, 'PO')",
    nextPrefix: 'prefixFromPeekNext(next)',
  },
  {
    dir: 'grn/workspace/GrnWorkspaceProvider.tsx',
    tabTitle: 'Duplicated GRN',
    prefixFn: "normalizeDocPrefix(source.header.entryDocPrefix, 'GRN')",
    nextPrefix: 'prefixFromPeekNext(next)',
  },
  {
    dir: 'purchase-invoice/workspace/PurchaseInvoiceWorkspaceProvider.tsx',
    tabTitle: 'Duplicated bill',
    prefixFn: "normalizeDocPrefix(source.header.entryDocPrefix, 'PI')",
    nextPrefix: 'prefixFromPeekNext(next)',
  },
  {
    dir: 'purchase-return/workspace/PurchaseReturnWorkspaceProvider.tsx',
    tabTitle: 'Duplicated return',
    prefixFn: "normalizeDocPrefix(source.header.entryDocPrefix, 'PR')",
    nextPrefix: 'prefixFromPeekNext(next)',
  },
];

function patch(filePath, mod) {
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.includes('duplicateToNewTab')) {
    console.log('skip (exists):', mod.dir);
    return;
  }

  if (mod.extraImport && !text.includes('prefixFromPeekNext')) {
    text = text.replace(
      /import \{ normalizeDocPrefix[^;]+;\n/,
      (m) => m + mod.extraImport + '\n',
    );
  }

  text = text.replace(
    /continueWithNextBill: \(tabId: string\) => Promise<void>;\n/,
    'continueWithNextBill: (tabId: string) => Promise<void>;\n  duplicateToNewTab: (sourceTabId: string) => Promise<void>;\n',
  );

  const block = `
  const duplicateToNewTab = useCallback(
    async (sourceTabId: string) => {
      const source = documents[sourceTabId];
      if (!source) throw new Error('Nothing to duplicate.');
      const id = \`tab-\${tabCounter}\`;
      setTabCounter((c) => c + 1);
      const prefix = ${mod.prefixFn};
      const next = await repository.peekNextNo(prefix);
      const header = {
        ...source.header,
        entryDocPrefix: ${mod.nextPrefix},
        billNo: String(next.docNo),
      };
      const lines = source.lines.map((line) => ({ ...line, id: crypto.randomUUID() }));
      setTabs((prev) => [
        ...prev.map((t) => ({ ...t, isSelected: false })),
        newTabUi(id, '${mod.tabTitle}', true),
      ]);
      setDocuments((prev) => ({
        ...prev,
        [id]: applyLoadedDocument(createTabDocumentState(lineCount), null, header, lines, 'Duplicated — review and save.'),
      }));
      setFocusSeed((s) => s + 1);
    },
    [documents, lineCount, repository, tabCounter],
  );
`;

  text = text.replace(
    /const continueWithNextBill = useCallback\([\s\S]*?\[closeTabWithoutConfirm, openDocumentInNewTab\],\n  \);\n\n  const defaultNewIntent/,
    (m) => m.replace('\n\n  const defaultNewIntent', `${block}\n  const defaultNewIntent`),
  );

  text = text.replace(
    /continueWithNextBill,\n      closeTabWithoutConfirm,/,
    'continueWithNextBill,\n      duplicateToNewTab,\n      closeTabWithoutConfirm,',
  );

  text = text.replace(
    /continueWithNextBill,\n      deleteLine,/,
    'continueWithNextBill,\n      duplicateToNewTab,\n      deleteLine,',
  );

  fs.writeFileSync(filePath, text);
  console.log('patched:', mod.dir);
}

for (const mod of modules) {
  patch(path.join(src, mod.dir), mod);
}

console.log('done');
