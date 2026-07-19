# WPF ↔ React workflow validation

Use this checklist when comparing the React UI (`ims-web`) to the WPF app (`IMS`).

## How to validate in React

```bash
cd ims-web
npm run dev
```

1. Sign in → main shell  
2. Use the sidebar for **menu workflows** (same keys as WPF `NavKeys`)  
3. Use header **Workflows** dropdown for **entry workspaces**, master forms, and designers  
4. Header shows the active **WPF XAML path** for the current screen  

## Parity status legend

| Status | Meaning |
|--------|---------|
| **refined-shell** | Wrapped in `RefinedScreenShell` + correct XAML component; layout from generator |
| **generated-structure** | Auto-XAML tree present; spacing/templates may differ |
| **manual-pass-needed** | Designers, DataGrid editing, charts, print preview need custom React work |

## Core workflows

| Workflow | WPF | React nav key | React XAML | Status |
|----------|-----|---------------|------------|--------|
| Login | `LoginWindow.xaml` | (app route) | `windows/LoginWindow.tsx` | refined-shell |
| Main shell | `MainWindow.xaml` | — | `windows/MainWindow.tsx` | refined-shell |
| Dashboard | `DashboardViewModel` → `DashboardView` | `dashboard` | `Views/DashboardView.xaml` | refined-shell |
| Settings | `SettingsViewModel` → `SettingsView` | `settings` | `Views/SettingsView.xaml` | refined-shell |

## Sales / purchase (list → workspace → entry)

| Workflow | WPF list VM | WPF workspace | React list key | React workspace key |
|----------|-------------|---------------|----------------|---------------------|
| Sales Order | `SalesOrdersViewModel` | `SalesOrderWorkspaceViewModel` | `sales-orders` | `sales-order-entry` |
| Delivery Challan | `DeliveryChallansViewModel` | `DeliveryChallanWorkspaceViewModel` | `delivery-challan` | `delivery-challan-entry` |
| Sales Invoice | `SalesInvoicesViewModel` | `SalesInvoiceWorkspaceViewModel` | `sales-invoice` | `sales-invoice-entry` |
| Sales Return | `SalesReturnsViewModel` | `SalesReturnWorkspaceViewModel` | `sales-return` | `sales-return-entry` |
| Purchase Order | `PurchaseOrdersViewModel` | `PurchaseOrderWorkspaceViewModel` | `purchase-orders` | `purchase-order-entry` |
| GRN | `PurchaseGrnsViewModel` | `GrnWorkspaceViewModel` | `grn` | `grn-entry` |
| Purchase Invoice | `PurchaseInvoicesViewModel` | `PurchaseInvoiceWorkspaceViewModel` | `purchase-invoice` | `purchase-invoice-entry` |
| Purchase Return | `PurchaseReturnsViewModel` | `PurchaseReturnWorkspaceViewModel` | `purchase-return` | `purchase-return-entry` |

**WPF validation steps:** Open list → New/Edit → workspace tabs → line items / GST / save bar.  
**React:** Same keys via sidebar (list) or **Workflows** dropdown (workspace).

## Master data

| Workflow | WPF form view | React key |
|----------|---------------|-----------|
| Product Master (list) | `StandardListView` | `products` |
| Product Master (form) | `ProductMasterFormView` | `product-master-form` |
| Account Master (list) | `StandardListView` | `account-ledger` |
| Account Master (form) | `AccountMasterFormView` | `account-master-form` |
| Dynamic sub-page forms | `DynamicFormView` / `SubPageView` | Gallery / future sub-nav |

## Finance vouchers

| Workflow | WPF entry view | React menu key |
|----------|----------------|----------------|
| Payment Voucher | `PaymentVoucherEntryView` | `payment-voucher` (list) |
| Receipt Voucher | `ReceiptVoucherEntryView` | `receipt-voucher` |
| Credit / Debit Note | `CreditNoteEntryView` / `DebitNoteEntryView` | `credit-note` / `debit-note` |
| Petty Cash | `CashEntryEntryView` | `petty-cash` |
| Bank Entry | `BankEntryEntryView` | `bank-entry` |

Entry views are in `refinedByXamlPath`; list screens use `StandardListView`.

## Reports & registers

All report menu items map to dedicated report XAML components (see `navigationRouteMap.ts`).  
Registers share `DocumentRegisterReportView.xaml`.  
Financial statements share `FinancialStatementReportView.xaml`.

## Designers (manual pass needed)

| Workflow | WPF | React key |
|----------|-----|-----------|
| Bill Format Master | `BillFormatDesignerView` | `bill-format-design` |
| Report formats (canvas) | `ReportFormatDesignerView` | `report-format-design` |

## Import

| Workflow | React key |
|----------|-----------|
| Import Product | `import-product` |
| Import Account | `import-account` |
| Import Sales Invoice | `import-sales-invoice` |
| Import Purchase Invoice | `import-purchase-invoice` |

## Code references

- Route map: `ims-web/src/navigation/navigationRouteMap.ts`
- Refined wrappers: `ims-web/src/screens/refinedScreens.tsx`
- Screen resolver: `ims-web/src/navigation/resolveScreen.tsx`
- Workflow specs: `ims-web/src/navigation/workflowRegistry.ts`

## Remaining gaps (expected)

- Live API / MVVM bindings (placeholders only)
- `DataGrid` cell editing, sorting, column prefs
- Dashboard charts (`DashboardBarChart`, etc.)
- Report/bill canvas designer interactions
- Print preview / `DocumentViewer`
