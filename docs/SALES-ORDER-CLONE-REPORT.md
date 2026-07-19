# Sales Order v1 — platform clone report

Checkpoint after the first **Sales Order** transaction module built on the shared platform (narrow v1 scope per roadmap).

## Summary

| Metric | Sales Order | Purchase Invoice (reference) |
|--------|-------------|------------------------------|
| Module-specific `.ts/.tsx` files | **21** | 22 |
| Print/export mappers (module + `document/`) | **2** (`recordMappers`, `salesOrderPrintMapper`) | 2 |
| Extra module helpers | 0 (`taxContext` inlined via `taxContextFromHeader`) | 1 (`taxContext.ts`) |
| **Estimated platform reuse** | **~78%** | ~76% |
| **Build** | **Pass** (`npm run build`) | Pass |

Reuse estimate: module file count and shared imports (GST `calculations` / `gstTax`, grid, keyboard, `sales-invoice.scss`, workspace lifecycle, `DocumentPrintService`) vs module-only repository, mappers, screens, and workspace provider.

## New module-specific files

| Area | Path |
|------|------|
| Types / seed | `sales-order/types.ts`, `mockData.ts`, `lineDisplay.ts` |
| Repository | `sales-order/repository/*` — `/api/sales-orders`, `ims.salesOrders.v1`, HTTP + local |
| Workspace | `sales-order/workspace/SalesOrderWorkspaceProvider.tsx`, `documentState.ts`, `confirmUnsaved.ts` |
| UI | `SalesOrderListScreen.tsx`, `SalesOrderWorkspaceScreen.tsx`, `SalesOrderEntryForm.tsx`, `routes.tsx` |
| Hook | `useSalesOrderDocument.ts` |
| Components | `components/SalesOrderLineItemsGrid.tsx`, `SalesOrderTotalsRail.tsx` |
| Nav | `context/SalesOrderNavIntent.tsx` |
| Print (shared package) | `document/mappers/salesOrderPrintMapper.ts`, `document/hooks/useSalesOrderPrintActions.ts` |

## Shared components reused unchanged

| Layer | Location |
|-------|----------|
| `CorporateDataGrid` | `components/datagrid/` |
| Transaction shell SCSS | `sales-invoice/sales-invoice.scss` |
| Keyboard | `keyboard/*`, `useDocumentShortcuts`, `useWorkspaceTabShortcuts` |
| GST / totals | `sales-invoice/calculations.ts`, `gstTax.ts` (`taxContextFromHeader`) |
| Print/export | `DocumentPrintService`, stub bill formats (`sales_order` in `documentTypes`) |
| Workspace pattern | Tab bar, dirty baseline, `confirmUnsaved`, close guards |
| Line display math | Re-exports / delegates to `sales-invoice/lineDisplay` |

## v1 scope delivered

- [x] Repository (`/api/sales-orders` + `localStorage` fallback)
- [x] List screen (`NavKeys.SalesOrders`)
- [x] Workspace tabs + entry screen (`sales-order-entry`)
- [x] Save / load (edit from list; new tab numbering via `peekNextNo('SO')`)
- [x] Print / export stub (`sales_order` document type, list export)
- [x] GST / totals on shared calculation layer
- [x] Dirty tracking and navigation guards

## Intentionally deferred (v1)

- Quotation → SO conversion
- SO → invoice conversion
- Order fulfillment / advanced status workflows
- Linked-document navigation
- Inventory reservation
- Delete action in entry UI (repository supports `deleteById`; not wired)

## Navigation wiring

- `refinedScreenMap`: `NavKeys.SalesOrders` → list; `sales-order-entry` → workspace
- `MainWindow`: `SalesOrderRepositoryProvider`, `SalesOrderNavIntentProvider`

## Field mapping (SO-specific)

| UI header | API / record |
|-----------|----------------|
| `entryDocPrefix` | `soPrefix` |
| `billNo` | `docNo` |
| `orderDate` | `soDate` |
| `customer` | `customer` |
| `paymentTerms` | `paymentTerms` |
| `deliveryPriority` | `deliveryPriority` |

## WPF parity gaps

| Area | Gap |
|------|-----|
| Labels / layout | Uses shared `si-*` layout; SO-specific pixel pass not done |
| Actions | No payment, conversion, or fulfillment buttons from WPF |
| Status | Simplified filter (Open/Draft/Confirmed); no advanced transitions |
| List | Standard list pattern; not WPF `SalesOrderListView` chrome |
| Delete | WPF may expose delete; React entry has no delete yet |
| Screenshots | Pending acceptance stream (parallel to clone work) |

## Conclusion

Metrics align with **Purchase Invoice**: most effort is configuration (DTOs, repository, record mapper, print mapper, header fields, validation). The shared transaction platform was **not** extended for Sales Order v1 — confirming the architecture scales to the next transaction family without drift.

Next in sequence: **Purchase Order**, then GRN. **Quotation v1:** `QUOTATION-CLONE-REPORT.md`.
