# Purchase Invoice — cloned from Sales Invoice reference

Purchase Invoice proves the Sales Invoice transaction framework can be reused with **module-specific mappers and repositories** only.

## Reused unchanged

| Layer | Location |
|-------|----------|
| `CorporateDataGrid` | `components/datagrid/` |
| Transaction shell SCSS | `sales-invoice/sales-invoice.scss` (imported by purchase screens) |
| Keyboard | `keyboard/*`, `useDocumentShortcuts`, `useWorkspaceTabShortcuts` |
| GST / totals math | `sales-invoice/calculations.ts`, `gstTax.ts` |
| Print/export services | `document/DocumentPrintService`, stub providers |
| Workspace pattern | Tab bar, dirty baseline, close guards (mirrored in `purchase-invoice/workspace/`) |

## Purchase-specific

| Piece | Path |
|-------|------|
| Types | `purchase-invoice/types.ts` — supplier, GRN ref, company/supplier GSTIN |
| Repository | `purchase-invoice/repository/*` — `/api/purchase-invoices`, `ims.purchaseInvoices.v1` |
| Workspace provider | `PurchaseInvoiceWorkspaceProvider.tsx` |
| Document hook | `usePurchaseInvoiceDocument.ts` |
| Print mapper | `document/mappers/purchaseInvoicePrintMapper.ts` |
| Nav | `NavKeys.PurchaseInvoice`, `purchase-invoice-entry` |

## Field mapping (Sales → Purchase)

| Sales Invoice | Purchase Invoice |
|---------------|------------------|
| customer | supplier |
| dcReference | grnReference |
| sellerGstin | companyGstin |
| customerGstin | supplierGstin |
| SI prefix | PI prefix |

GST context: `purchaseGstContext()` maps company GSTIN → seller side, supplier GSTIN → customer side for `validateGstTax` / interstate rules.

## Navigation

- **Purchase → Purchase Invoice** → list (`NavKeys.PurchaseInvoice`)
- **New / Edit / double-click** → `purchase-invoice-entry` workspace
- Providers: `PurchaseInvoiceRepositoryProvider`, `PurchaseInvoiceNavIntentProvider` (nested in `MainWindow`)

## Success criteria (clone gate)

- [x] List loads from repository (HTTP or local)
- [x] Workspace tabs with isolated document state
- [x] Save/load round-trip
- [x] GST totals follow place of supply (shared calculation layer)
- [x] Print uses `purchase_invoice` document type
- [ ] Purchase-only validation (e.g. GRN link rules) — future
- [ ] Pixel pass on purchase-specific labels — uses shared `si-*` layout

## Next modules

See **`TRANSACTION-MIGRATION-ROADMAP.md`** for platform reuse metrics and sequence. **Sales Order v1** clone report: **`SALES-ORDER-CLONE-REPORT.md`**. Next: Quotation, Purchase Order, GRN.
