# WPF → React — Full migration status & process

Last updated: 2026-06-06

## Summary

| Layer | Count | Status |
|-------|-------|--------|
| WPF `.xaml` screens | 92 | All have generated React stubs (`ims-web/src/wpf-ui/`) |
| Sidebar nav items | 68 | All routed |
| **Production React** (real logic + API) | **~30 screens** | See tables below |
| WPF placeholder only | ~38 menu routes | Generated stub via `refinedByXamlPath` / `ContentHost` |

**Resolution order:** `refinedScreenMap.tsx` override → `refinedByXamlPath` → `ContentHost` fallback.

---

## Production React (complete)

### Transactions — list → workspace → entry

| Module | NavKey | React path |
|--------|--------|------------|
| Sales Order | `sales-orders` | `ims-web/src/sales-order/` |
| Quotation | `quotation` | `ims-web/src/quotation/` *(web-only)* |
| Delivery Challan | `delivery-challan` | `ims-web/src/delivery-challan/` |
| Sales Invoice | `sales-invoice` | `ims-web/src/sales-invoice/` *(reference)* |
| Sales Return | `sales-return` | `ims-web/src/sales-return/` |
| Purchase Order | `purchase-orders` | `ims-web/src/purchase-order/` |
| GRN | `grn` | `ims-web/src/grn/` |
| Purchase Invoice | `purchase-invoice` | `ims-web/src/purchase-invoice/` |
| **Purchase Return** | `purchase-return` | `ims-web/src/purchase-return/` |

All nine modules: paging/sort/column filters, permissions, export, `Ctrl+N`, GST validation on save.

### Registers (8)

`ims-web/src/reports/DocumentRegisterScreen.tsx` — sales ×4, purchase ×4.

### Import (4)

`ims-web/src/reports/ImportPageScreen.tsx` — product, account, sales invoice, purchase invoice.

### Reports (1)

`ims-web/src/reports/SalesAnalysisReportScreen.tsx` — API-backed MIS.

### Shell

- `ims-web/src/windows/LoginWindow.tsx`
- `ims-web/src/windows/MainWindow.tsx`

### Partial

| Screen | NavKey | Notes |
|--------|--------|-------|
| Settings | `settings` | `SettingsScreen` + Sales/Purchase config panel only |
| Receipt Voucher entry | `receipt-voucher-entry` | Entry form only; list still stub |

---

## WPF placeholder only (next to convert)

### Priority A — API exists, use `StandardReportShell`

Wire like `SalesAnalysisReportScreen` / `DocumentRegisterScreen`:

| Screen | NavKey | API |
|--------|--------|-----|
| Ledger Report | `ledger-report` | `GET /api/reports/ledger` |
| Trial Balance | `trial-balance` | `GET /api/reports/trial-balance` |
| Trading / P&L / Balance Sheet | `trading-account`, `profit-loss`, `profit-loss-trading`, `balance-sheet` | `GET /api/reports/{endpoint}` |
| Opening / Closing Stock | `opening-stock`, `closing-stock` | `GET /api/reports/opening-stock`, `closing-stock` |
| Stock Summary | `stock-summary` | `GET /api/reports/stock-details-summary` |
| Stock Movements | `stock-movements` | `GET /api/reports/stock-movement` |
| Reorder Level | `reorder-level` | `GET /api/reports/reorder-level` |
| Profit Analysis | `profit-analysis` | `GET /api/reports/profit-analysis` |
| Purchase Analysis | `purchase-analysis` | `GET /api/reports/purchase-analysis` |
| Outstanding | `outstanding` | `GET /api/reports/outstanding` |
| Due Day / Due Amount | `due-day`, `due-amount` | `GET /api/reports/due-day`, `due-amount` |

### Priority B — Finance vouchers

| Screen | NavKey | Pattern |
|--------|--------|---------|
| Payment Voucher | `payment-voucher` | Clone receipt-voucher entry + list |
| Receipt Voucher list | `receipt-voucher` | Standard list + existing entry |
| Credit / Debit Note | `credit-note`, `debit-note` | Voucher entry shell |
| Bank / Petty Cash | `bank-entry`, `petty-cash` | Voucher entry shell |

### Priority C — Masters & admin

| Screen | NavKey | Pattern |
|--------|--------|---------|
| Product Master | `products` | `StandardListView` → CRUD + `ProductMasterFormView` |
| Account Master | `account-ledger` | Same with `AccountMasterFormView` |
| Product/Account sub-masters | `product-types`, `main-groups`, etc. | `StandardListView` + API |
| Financial Years | `financial-years` | Dedicated screen |
| Bill / Report designers | `bill-format-designer`, `report-formats-canvas` | Canvas designers |

### Priority D — Operations

| Screen | NavKey |
|--------|--------|
| Dashboard | `dashboard` |
| Stock Transfer | `stock-transfer` |
| BOM | `bom` |
| Job Work | `production-orders` |
| Payroll (×4) | `payroll-*` |

---

## Conversion process (repeatable)

### 1. Transaction module (clone)

```bash
# Extend tools/clone-sales-modules.mjs, then:
node tools/clone-sales-modules.mjs
node tools/fix-purchase-return.mjs   # if needed
```

Per module checklist:

1. `types.ts`, `mockData.ts`, `repository/*`, `recordMappers.ts`
2. `workspace/*Provider.tsx` — `validatePurchaseWorkspaceDocument` or `validateSalesWorkspaceDocument`
3. List screen — `useTransactionListLoader`, permissions, export
4. `refinedScreenMap.tsx` + `MainWindow.tsx` providers
5. Print mapper in `document/mappers/`
6. `npm run build`

Reference: `docs/TRANSACTION-MIGRATION-ROADMAP.md`

### 2. Report screen

1. Add types + `fetch*Report()` in `ims-web/src/api/reports.ts`
2. Create `*ReportScreen.tsx` using `StandardReportShell`
3. Export route in `reports/routes.tsx`
4. Wire `refinedScreenMap.tsx`

### 3. Master list

1. API client for entity CRUD
2. List screen (grid + paging) or reuse generated `StandardListView` with bindings
3. Form screen for add/edit

### 4. Generated stub pass (low traffic)

1. Open screen in XAML gallery
2. Replace `placeholders.ts` bindings with API hooks
3. Move from `refinedByXamlPath` to hand-built screen when logic is non-trivial

---

## Scorecard

| Category | Production React | Placeholder |
|----------|------------------|-------------|
| Sales transactions | 5 (+ Quotation) | 0 |
| Purchase transactions | 4 | 0 |
| Registers | 8 | 0 |
| Import | 4 | 0 |
| MIS / FS / Receivables / Inventory reports | 1 | ~15 |
| Finance vouchers | 1 partial | ~6 |
| Masters / admin | 1 partial | ~16 |
| Dashboard / ops / payroll | 0 | ~10 |

**All 9 core transaction modules are now on production React.** Next highest ROI: **Priority A reports** (APIs already exist).

---

## Related docs

- `docs/WPF-TO-REACT-MIGRATION.md` — infrastructure & phases
- `docs/TRANSACTION-MIGRATION-ROADMAP.md` — clone sequence
- `docs/SALES-PHASE-4-VERIFICATION.md` — sales parity matrix
- `docs/WPF-REACT-WORKFLOW-VALIDATION.md` — QA checklist
