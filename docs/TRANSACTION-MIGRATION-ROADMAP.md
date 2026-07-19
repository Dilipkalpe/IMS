# Transaction migration — platform & module sequence

Sales Invoice and Purchase Invoice established a **reusable transaction platform**. Further modules are **conversions**, not new architecture.

## Reference implementations

| Module | Status | Doc |
|--------|--------|-----|
| Sales Invoice | Reference (Phases 2a–2f) | `SALES-INVOICE-PARITY.md`, `SALES-INVOICE-*` |
| Purchase Invoice | Clone validated | `PURCHASE-INVOICE-MIGRATION.md` |
| Sales Order | Clone validated (v1) | `SALES-ORDER-CLONE-REPORT.md` |
| Quotation | Clone validated (v1) | `QUOTATION-CLONE-REPORT.md` |
| Purchase Order | Clone validated (v1) | `ims-web/src/purchase-order/` |
| GRN | Clone validated (v1) | `ims-web/src/grn/` |
| Delivery Challan | Clone validated (v1) | `ims-web/src/delivery-challan/` |
| Sales Return | Clone validated (v1) | `ims-web/src/sales-return/` |

## Shared platform (do not reimplement)

- Transaction shell + `sales-invoice.scss` layout tokens
- `CorporateDataGrid` + line display / virtualization patterns
- Workspace provider (per-tab state, dirty baseline, close guards)
- Repository abstraction (HTTP probe + local fallback + list cache invalidation)
- `use*Document` hook + `use*PrintActions`
- `document/*` print/export contracts
- `calculations.ts` + `gstTax.ts` (optional `GstTaxContext` per header shape)
- Keyboard: `FormKeyboardScope`, `useDocumentShortcuts`, `useWorkspaceTabShortcuts`
- Nav intent + `refinedScreenMap` route overrides

## Per-module replacements only

- `types.ts` (header + list row fields)
- `mockData.ts` / seed rows
- `repository/*` (API path, storage key, entity field names)
- `recordMappers.ts` (UI ↔ API)
- `taxContext.ts` or header adapter for GST (if party fields differ)
- `document/mappers/*PrintMapper.ts`
- `document/hooks/use*PrintActions.ts`
- Entry form labels + validation messages
- `documentTypes` key already in `document/contracts/documentTypes.ts`

## Success metrics (per module)

1. **% reused** — workspace, grid, keyboard, GST, print service, shell SCSS
2. **# module-specific files** — typically types, mockData, repository (5–8 files), mappers (2), screens (3), routes (1)
3. **WPF parity** — screenshot sign-off on acceptance track (not a clone blocker)

## Recommended conversion sequence

| Order | Module | Rationale |
|-------|--------|-----------|
| 1 | ~~Sales Order~~ ✓ | `SALES-ORDER-CLONE-REPORT.md` |
| 2 | ~~Quotation~~ ✓ | `QUOTATION-CLONE-REPORT.md` |
| 3 | ~~Purchase Order~~ ✓ | Mirror of SO on purchase side |
| 4 | ~~GRN~~ ✓ | Inventory receipt; stock direction `in` |
| 5 | ~~Delivery Challan~~ ✓, ~~Sales Return~~ ✓ | `ims-web/src/delivery-challan/`, `ims-web/src/sales-return/` |
| 6 | Purchase Return, finance vouchers | Remaining purchase docs; finance uses different shell |

API already exposes numbered-doc routes for sales orders: `GET/POST /api/sales-orders` (see `api/src/index.js`).

## Next clone: Purchase Return

**Reuse:** Same pattern as Sales Return (return header + warehouse/QC fields).

**Replace / adapt:** `documentType` `purchase_return`, supplier header, `/api/purchase-returns`.

**Parallel backlog:** Delivery Challan “Load from SO” picker (v1.1), GRN “Load from PO” picker (v1.1), Sales Order delete, SI/PI acceptance screenshots.

## Parallel acceptance tracks (not feature migration)

### Sales Invoice

- Screenshot sign-off (1200×720)
- Loading overlays / spinners
- Delete workflow
- Export Data popup (multi-target)
- Native PDF / bill-format designer API

### Purchase Invoice

- WPF field parity vs `PurchaseInvoiceEntryView.xaml`
- Screenshot sign-off
- Repository contract vs live API

## Milestone

Migration phase has shifted from **framework-building** to **scalable module conversion**. New modules should not add parallel workspace or repository designs unless a document type is structurally incompatible (e.g. non-line-based vouchers).
