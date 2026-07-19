# Sales Invoice — WPF → React parity tracker

**WPF sources:** `Views/StandardListView.xaml` (list), `Views/SalesInvoiceWorkspaceView.xaml` (tabs), `Views/SalesInvoiceEntryView.xaml`, `Views/Controls/SalesInvoiceLineItemsPanel.xaml`, `Views/Controls/TransactionEntryBottomPanel.xaml`, `Views/Controls/TransactionGstTotalsRail.xaml`, `Views/Controls/TransactionSalesGstHeaderRow.xaml`, `Themes/Generic.xaml` (`TransactionEntryShell`).

**React module:** `ims-web/src/sales-invoice/` — lazy routes via `sales-invoice/routes.tsx`, nav keys `sales-invoice` (list) and `sales-invoice-entry` (workspace).

## Implemented (this pass)

| Area | Status | Notes |
|------|--------|--------|
| List → workspace navigation | Done | New / Edit / double-click → `sales-invoice-entry` via `AppNavigationProvider` |
| Workspace tab bar | Done | Add/close/select tabs; mirrors `TransactionWorkspaceTabBar` chip style |
| Entry shell + layout | Done | 2-column grid (main + 200px totals rail), section borders |
| Header fields (6-col) | Done | Prefix, invoice no, customer, dates, DC ref |
| GST header row | Done | Seller/customer GSTIN, place of supply, payment type/mode |
| Line items grid | Done | `CorporateDataGrid` — editable Qty/Rate/Sale Rate/Disc %, computed tax columns |
| Barcode scan | Done | Enter adds line; does not use Enter-as-tab on scan field |
| Totals rail | Done | Mock GST math via `calculations.ts` |
| Bottom narration + actions | Done | Icon rail; F7/F11/F12; Print/F12 via document print service |
| Validation | Partial | Customer, bill no, lines, qty > 0; inline field errors + status banner |
| Grid keyboard | Done | Tab/Enter between editable cells; Escape blurs |
| List grid | Done | Read-only list grid; double-click opens workspace |
| Virtualization | Done | Line grid when `lines.length > 40`; list when `rows > 50` |
| Lazy loading | Done | Sales Invoice screens code-split from main bundle |
| Keyboard workflow | Done | Phase 2a — `docs/SALES-INVOICE-KEYBOARD.md` |
| Pixel / layout (Phase 2b) | Done | Tokens + SCSS aligned to XAML — `docs/SALES-INVOICE-PIXEL-PASS.md` |

## Parity gaps (documented — reuse pattern when fixing)

### Pixel / layout

- [x] Transaction shell border `#8FA3B7`, title gradient `#DBE9F6`→`#BCD2EA`, page bg `#E6EBF1`
- [x] Section borders `BorderBrush`, 10px padding, 6px gutters (entry)
- [x] Line grid black borders, 24px rows, 26px headers (`TransactionLineGrid`)
- [x] Scan bar accent-light + `#999` border, 180px barcode width
- [x] Action rail 44×44 (`SalesSideButton`), Next/Close secondary
- [x] Totals rail 200px, 10/8 padding, accent-light highlights on invoice total + balance
- [x] Workspace tab bar gradient + TabChip 8px radius (separate close 22×28)
- [x] List SoList accent borders, 8px radius cards, 42/44 grid, alternating rows
- [ ] **Manual screenshot diff** at 1200×720 (capture WPF + React side-by-side — dev verification)
- [ ] `DatePicker` chrome vs native `<input type="date">` (non-blocking)
- [ ] Stat counter cards — no icon host / gradient (`StatCounterCard`) (non-blocking)
- [ ] Product picker combo in scan row (non-blocking — feature)
- [ ] Export Data popup menu (non-blocking — feature)

### Data / behavior

- [x] Repository save/load/list — Phase 2e (`SALES-INVOICE-PERSISTENCE.md`); local fallback + HTTP when API up
- [ ] Full WPF field parity on API payload (salesMan, customerDetails, stock)
- [ ] Product browse dialog (`Browse…` on line panel)
- [ ] Customer search / add-new on combo
- [ ] Prefix auto-commit / read-only rules (`IsEntryPrefixReadOnly`, `IsBillNoReadOnly`)
- [x] Inter-state IGST vs CGST+SGST — Phase 2f (`docs/SALES-INVOICE-GST.md`, `npm run test:gst`)
- [ ] Paid amount editing on totals rail (read-only in React)
- [ ] Record payment, save pipelines (API)
- [x] Print / export via `document/*` providers (stub) — see `SALES-INVOICE-PRINT-EXPORT.md`
- [ ] Column preferences / persisted grid columns (WPF `ManageColumnsCommand`)
- [ ] Pagination bar wiring (list shows static “Page 1 of 1”)
- [ ] Loading overlay on list fetch
- [x] Per-tab document state — `SalesInvoiceWorkspaceProvider` (Phase 2e)

### Keyboard

- [x] Enter-as-tab, tab order, grid arrows, F7/F11/F12, validation focus — see `SALES-INVOICE-KEYBOARD.md`
- [ ] Prefix commit on navigate (non-blocking)
- [ ] List grid keyboard open row (non-blocking)
- [ ] Delete column in tab order (non-blocking)

### Print / export

- [x] Canonical print model + provider interfaces — `docs/SALES-INVOICE-PRINT-EXPORT.md`
- [x] Entry Print + F12 (`savePrintNext`) through `DocumentPrintService`
- [x] List Export Data → `exportList` (CSV stub)
- [ ] Bill format designer API output
- [ ] `ExportDataPopup` multi-target menu (Excel / PDF / Print)

## Performance notes

- Default entry loads **8** lines; pass `lineCount` to `SalesInvoiceEntryForm` for stress (e.g. 200) — virtualization kicks in above **40** lines.
- List sample has 4 rows; extend `SAMPLE_LIST_ROWS` or generate rows to test list virtualization (>50).

## Reuse for other documents

Copy module structure:

1. `types.ts` + `calculations.ts` + `use*Document.ts`
2. `*EntryForm.tsx` + line grid wrapper
3. `*ListScreen.tsx` + `*WorkspaceScreen.tsx`
4. Register in `refinedScreenMap.tsx` (nav key + `*-entry` key)

Purchase Invoice, Sales Order, Delivery Challan share `SalesInvoiceLineItemsPanel` in WPF — same `CorporateDataGrid` column set can be parameterized.

**Clone gate:** Sales Invoice is the canonical template. **Purchase Invoice** is the first clone — see `docs/PURCHASE-INVOICE-MIGRATION.md`. Sales Order, Quotation, and GRN follow the same pattern.

## Phase 2 — near-parity (recommended order)

Track migration completeness here; feature delivery can ship incrementally against these items.

| # | Focus | Primary touchpoints | Done when |
|---|--------|---------------------|-----------|
| 1 | **Pixel / layout** | `transaction-tokens.scss`, `sales-invoice.scss`, grid variants | **Phase 2b done** — manual screenshot sign-off pending; see `docs/SALES-INVOICE-PIXEL-PASS.md` |
| 2 | **Keyboard workflow** | `ims-web/src/keyboard/*` | **Phase 2a done** — `docs/SALES-INVOICE-KEYBOARD.md` |
| 3 | **DataGrid edge cases + perf** | `CorporateDataGrid`, `VirtualGridRow`, `lineDisplay.ts` | **Phase 2c done** — `docs/SALES-INVOICE-PERF.md`; stress `?stressLines=500` |
| 4 | **Print / export architecture** | `ims-web/src/document/*` | **Phase 2d done** — `docs/SALES-INVOICE-PRINT-EXPORT.md`; popup menu + real PDF pending |
| 5 | **API + persistence** | `repository/*`, `workspace/*` | **Phase 2e done** — `docs/SALES-INVOICE-PERSISTENCE.md`; pagination overlay optional |
| 6 | **IGST / interstate rules** | `gstTax.ts`, `calculations.ts` | **Phase 2f done** — `docs/SALES-INVOICE-GST.md` |

## Manual test checklist

1. Menu **Sales → Sales Invoice** — list with stats and toolbar.
2. **New** — workspace with one tab and entry form.
3. Edit barcode field, Enter — new line appended.
4. Edit Qty in grid, Tab through Rate / Disc — totals update.
5. Clear customer, Save — validation errors.
6. F11 — save stub status; F12 / Print — HTML preview popup (allow popups).
7. List Export Data — CSV download of visible rows.
8. F7 — cancel to list.
7. Resize window below 1100px — totals rail stacks responsively.
8. Workflow dropdown — `sales-invoice-list` / `sales-invoice-workspace` traceability.
