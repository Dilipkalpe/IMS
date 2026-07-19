# Sales Invoice — Print / Export (Phase 2d)

**WPF references:** `Services/SalesOrderPrintService.cs`, `BillFormatPrintResolver.cs`, `StandardListView.xaml` (`ExportDataPopup`), entry `SavePrintNextCommand` / F12.

**React module:** `ims-web/src/document/` — contracts, providers, mapper; wired from `sales-invoice/` screens.

## Architecture

```
UI (Sales Invoice)          Document layer (reusable)
─────────────────          ───────────────────────────
useSalesInvoiceDocument    mapSalesInvoiceToPrintableDocument()
  getUiSnapshot()    →     PrintableDocumentV1 (schema v1)
       │                          │
       ▼                          ▼
useSalesInvoicePrintActions  DocumentPrintService
  print / preview / export     ├─ BillFormatProvider (resolve format)
  savePrintNext (F12)          ├─ PrintProvider (preview / print)
                               └─ ExportProvider (PDF/CSV/list)
```

- **UI state** stays in `useSalesInvoiceDocument` (header, lines, totals).
- **Printable state** is `PrintableDocumentV1` — no React refs, versioned `schemaVersion: 1`.
- Screens call **interfaces** only (`useSalesInvoicePrintActions`, `useDocumentPrintService`); stubs live under `document/providers/`.

## Contracts

| File | Purpose |
|------|---------|
| `contracts/printableDocument.ts` | `PrintableDocumentV1`, lines, totals |
| `contracts/billFormat.ts` | `BillFormatKey`: standard, thermal, gst, custom |
| `contracts/documentTypes.ts` | `sales_invoice`, `purchase_invoice`, … |
| `contracts/printExportRequests.ts` | Print/export/list request DTOs |

## Providers (stubbed)

| Interface | Stub | Real (future) |
|-----------|------|----------------|
| `PrintProvider` | Browser window + HTML | Report engine / `PrintDialog` |
| `BillFormatProvider` | Static catalog (standard/thermal/gst/custom) | Mongo templates / designer API |
| `ExportProvider` | CSV download; PDF → HTML file | `SalesBillPdfExporter`, Excel |

Default GST format for sales invoice: `billFormatKeyForDocumentType('sales_invoice')` → `gst`.

## Workspace integration

| Action | Path |
|--------|------|
| **Print** button | `SalesInvoiceEntryForm` → `print(snapshot)` |
| **F12** Save+Print+Next | `savePrintNext(snapshot, onSave)` — validates, stub save, then print without dialog |
| **Export Data** (list) | `SalesInvoiceListScreen` → `exportList({ documentType, columns, rows, target: 'excel' })` |

`DocumentPrintProvider` wraps the main window content host so any transaction screen can resolve the same service.

## Manual verification

1. Open **Sales → Sales Invoice** → **New** → fill customer, bill no, qty on a line.
2. **Print** — popup with HTML invoice (GST layout stub); status banner shows result.
3. **F12** or **S+P** — validation errors if incomplete; otherwise save message + print.
4. List **Export Data** — downloads `Sales_Invoice_Register_excel.csv` (stub CSV).
5. DevTools: no imports from `stubPrintRenderer` in `sales-invoice/*` (only `document/*`).

## Exit criteria (Phase 2d)

- [x] Normalized print payload (`PrintableDocumentV1`)
- [x] Print/export via provider interfaces
- [x] UI does not depend on stub implementation details
- [x] Purchase Invoice can reuse `DocumentPrintService` + new mapper
- [ ] Export Data popup menu (Excel / PDF / Print choices) — list uses Excel stub only
- [ ] Wire real PDF/print APIs when backend is ready

## Next phases

1. API persistence + per-tab document state  
2. IGST / interstate rules in `calculations.ts`  
3. Manual screenshot sign-off  
4. Clone pattern for **Purchase Invoice**
