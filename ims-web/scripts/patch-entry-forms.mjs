/**
 * Patches transaction entry forms with extended toolbar actions.
 * Run: node scripts/patch-entry-forms.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'src');

const forms = [
  {
    file: 'purchase-order/PurchaseOrderEntryForm.tsx',
    moduleKey: 'purchase-order',
    navKey: 'PurchaseOrders',
    printHook: 'usePurchaseOrderPrintActions',
    printImport: '../document/hooks/usePurchaseOrderPrintActions',
    wsHook: 'usePurchaseOrderWorkspace',
    wsImport: './workspace/PurchaseOrderWorkspaceProvider',
  },
  {
    file: 'grn/GrnEntryForm.tsx',
    moduleKey: 'grn',
    navKey: 'Grn',
    printHook: 'useGrnPrintActions',
    printImport: '../document/hooks/useGrnPrintActions',
    wsHook: 'useGrnWorkspace',
    wsImport: './workspace/GrnWorkspaceProvider',
  },
  {
    file: 'purchase-invoice/PurchaseInvoiceEntryForm.tsx',
    moduleKey: 'purchase-invoice',
    navKey: 'PurchaseInvoice',
    printHook: 'usePurchaseInvoicePrintActions',
    printImport: '../document/hooks/usePurchaseInvoicePrintActions',
    wsHook: 'usePurchaseInvoiceWorkspace',
    wsImport: './workspace/PurchaseInvoiceWorkspaceProvider',
  },
  {
    file: 'purchase-return/PurchaseReturnEntryForm.tsx',
    moduleKey: 'purchase-return',
    navKey: 'PurchaseReturn',
    printHook: 'usePurchaseReturnPrintActions',
    printImport: '../document/hooks/usePurchaseReturnPrintActions',
    wsHook: 'usePurchaseReturnWorkspace',
    wsImport: './workspace/PurchaseReturnWorkspaceProvider',
  },
  {
    file: 'quotation/QuotationEntryForm.tsx',
    moduleKey: 'quotation',
    navKey: 'Quotation',
    printHook: 'useQuotationPrintActions',
    printImport: '../document/hooks/useQuotationPrintActions',
    wsHook: 'useQuotationWorkspace',
    wsImport: './workspace/QuotationWorkspaceProvider',
  },
  {
    file: 'delivery-challan/DeliveryChallanEntryForm.tsx',
    moduleKey: 'delivery-challan',
    navKey: 'DeliveryChallan',
    printHook: 'useDeliveryChallanPrintActions',
    printImport: '../document/hooks/useDeliveryChallanPrintActions',
    wsHook: 'useDeliveryChallanWorkspace',
    wsImport: './workspace/DeliveryChallanWorkspaceProvider',
  },
  {
    file: 'sales-return/SalesReturnEntryForm.tsx',
    moduleKey: 'sales-return',
    navKey: 'SalesReturn',
    printHook: 'useSalesReturnPrintActions',
    printImport: '../document/hooks/useSalesReturnPrintActions',
    wsHook: 'useSalesReturnWorkspace',
    wsImport: './workspace/SalesReturnWorkspaceProvider',
  },
];

const extraImports = `import {
  buildDocumentEntryActions,
  DocumentEntryActionRail,
} from '../components/transaction/DocumentEntryActionRail';
import {
  handleDocumentSecondaryAction,
  registerPrintPreviousSnapshot,
} from '../components/transaction/documentSecondaryActions';
`;

function patch(form) {
  const filePath = path.join(src, form.file);
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.includes('handleDocumentSecondaryAction')) {
    console.log('skip:', form.file);
    return;
  }

  text = text.replace(
    new RegExp(`import \\{ ${form.printHook} \\} from '[^']+';\\n`),
    (m) => m + extraImports,
  );

  text = text.replace(
    /if \(label === 'Print'\) \{\n        const outcome = await print\(snapshot, true\);\n        doc\.setStatus\(outcome\.message\);\n        return;\n      \}\n      const outcome = await savePrintNext/,
    `if (label === 'Print') {
        const outcome = await print(snapshot, true);
        if (outcome.ok) registerPrintPreviousSnapshot('${form.moduleKey}', snapshot);
        doc.setStatus(outcome.message);
        return;
      }
      const outcome = await savePrintNext`,
  );

  text = text.replace(
    /doc\.setStatus\(outcome\.message\);\n      if \(outcome\.ok\) \{\n        if \(doc\.isEdit\) \{/,
    `if (outcome.ok) registerPrintPreviousSnapshot('${form.moduleKey}', snapshot);
      doc.setStatus(outcome.message);
      if (outcome.ok) {
        if (doc.isEdit) {`,
  );

  const secondaryBlock = `
      const handled = await handleDocumentSecondaryAction(label, {
        moduleKey: '${form.moduleKey}',
        setStatus: doc.setStatus,
        getUiSnapshot: doc.getUiSnapshot,
        printSnapshot: print,
        openByFormatted: async (formatted) => {
          await ws.openDocumentInNewTab({ type: 'editFormatted', formatted });
        },
        duplicateToNewTab: async () => {
          await ws.duplicateToNewTab(tabId);
        },
        currentFormatted: () => {
          const h = doc.header;
          return h.billNo ? \`\${h.entryDocPrefix}-\${h.billNo}\` : undefined;
        },
      });
      if (handled) return;
`;

  text = text.replace(
    /if \(label === 'Print' \|\| label === 'Save, Print, Next \(F12\)'\) \{\n        await runPrintFlow\(label\);\n        return;\n      \}\n      const result = await doc\.tryAction\(label\);/,
    `if (label === 'Print' || label === 'Save, Print, Next (F12)') {
        await runPrintFlow(label);
        return;
      }
${secondaryBlock}
      const result = await doc.tryAction(label);`,
  );

  text = text.replace(
    /\[doc, focusValidationError, navigate, runPrintFlow, ws\],\n  \);/,
    `[doc, focusValidationError, navigate, runPrintFlow, tabId, ws],
  );

  const entryActions = \`buildDocumentEntryActions({
    saveButtonRef,
    disabled: doc.isSaving || doc.isLoading,
  })\`;`,
  );

  text = text.replace(
    /useDocumentShortcuts\(\{/,
    `const entryActions = buildDocumentEntryActions({
    saveButtonRef,
    disabled: doc.isSaving || doc.isLoading,
  });

  useDocumentShortcuts({`,
  );

  text = text.replace(
    /<div className="si-action-rail" role="toolbar" aria-label="Document actions">[\s\S]*?<\/div>\n            <\/div>\n          <\/section>/,
    `<DocumentEntryActionRail actions={entryActions} onAction={(action) => void runAction(action)} />
            </div>
          </section>`,
  );

  fs.writeFileSync(filePath, text);
  console.log('patched:', form.file);
}

for (const form of forms) patch(form);
console.log('done');
