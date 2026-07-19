/** Fix entry forms missing secondary actions and action rail. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'src');

const forms = [
  { file: 'purchase-order/PurchaseOrderEntryForm.tsx', moduleKey: 'purchase-order' },
  { file: 'grn/GrnEntryForm.tsx', moduleKey: 'grn' },
  { file: 'purchase-invoice/PurchaseInvoiceEntryForm.tsx', moduleKey: 'purchase-invoice' },
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

for (const form of forms) {
  const filePath = path.join(src, form.file);
  let text = fs.readFileSync(filePath, 'utf8');

  if (!text.includes('handleDocumentSecondaryAction')) {
    text = text.replace(/import \{ use\w+PrintActions \} from '[^']+';\n/, (m) => m + extraImports);
  }

  if (!text.includes('registerPrintPreviousSnapshot')) {
    text = text.replace(
      /if \(label === 'Print'\) \{\n        const outcome = await print\(snapshot, true\);\n        doc\.setStatus\(outcome\.message\);\n        return;\n      \}/,
      `if (label === 'Print') {
        const outcome = await print(snapshot, true);
        if (outcome.ok) registerPrintPreviousSnapshot('${form.moduleKey}', snapshot);
        doc.setStatus(outcome.message);
        return;
      }`,
    );
    text = text.replace(
      /doc\.setStatus\(outcome\.message\);\n      if \(outcome\.ok\) \{\n        if \(doc\.isEdit\) \{/,
      `if (outcome.ok) registerPrintPreviousSnapshot('${form.moduleKey}', snapshot);
      doc.setStatus(outcome.message);
      if (outcome.ok) {
        if (doc.isEdit) {`,
    );
  }

  if (!text.includes('handleDocumentSecondaryAction(label')) {
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
  );`,
    );
  }

  if (!text.includes('const entryActions = buildDocumentEntryActions')) {
    text = text.replace(
      /useDocumentShortcuts\(\{/,
      `const entryActions = buildDocumentEntryActions({
    saveButtonRef,
    disabled: doc.isSaving || doc.isLoading,
  });

  useDocumentShortcuts({`,
    );
  }

  text = text.replace(
    /<div className="si-action-rail" role="toolbar" aria-label="Document actions">[\s\S]*?<\/div>\n            <\/div>\n          <\/section>/,
    `<DocumentEntryActionRail actions={entryActions} onAction={(action) => void runAction(action)} />
            </div>
          </section>`,
  );

  fs.writeFileSync(filePath, text);
  console.log('fixed:', form.file);
}

console.log('done');
