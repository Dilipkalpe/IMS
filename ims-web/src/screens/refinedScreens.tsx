/**
 * Lazy refined screens — transaction shell + generated view per XAML path.
 */
import { lazy, Suspense, useMemo, type ComponentType } from 'react';
import { PageLoadingFallback } from '../components/loading';
import { xamlUiManifest } from '../wpf-ui/manifest';
import { RefinedScreenShell } from './RefinedScreenShell';

function createLazyRefinedScreen(xamlPath: string, shellClassName?: string): ComponentType {
  function LazyRefinedScreen() {
    const LazyView = useMemo(() => {
      const loader = xamlUiManifest[xamlPath];
      if (!loader) return null;
      return lazy(loader as () => Promise<{ default: ComponentType<unknown> }>);
    }, []);

    if (!LazyView) {
      return (
        <RefinedScreenShell className={shellClassName}>
          <p style={{ padding: 24 }}>Missing view: {xamlPath}</p>
        </RefinedScreenShell>
      );
    }

    return (
      <RefinedScreenShell className={shellClassName}>
        <Suspense fallback={<PageLoadingFallback />}>
          <LazyView />
        </Suspense>
      </RefinedScreenShell>
    );
  }
  LazyRefinedScreen.displayName = `Refined(${xamlPath})`;
  return LazyRefinedScreen;
}

const p = (path: string, shell: string) => createLazyRefinedScreen(path, shell);

export const refinedByXamlPath = {
  'Views/DashboardView.xaml': p('Views/DashboardView.xaml', 'dashboard-screen'),
  'Views/StandardListView.xaml': p('Views/StandardListView.xaml', 'standard-list-screen'),
  'Views/SettingsView.xaml': p('Views/SettingsView.xaml', 'settings-screen'),
  'Views/AccountMasterFormView.xaml': p('Views/AccountMasterFormView.xaml', 'account-master-screen'),
  'Views/ProductMasterFormView.xaml': p('Views/ProductMasterFormView.xaml', 'product-master-screen'),
  'Views/DynamicFormView.xaml': p('Views/DynamicFormView.xaml', 'dynamic-form-screen'),
  'Views/SalesEntryFormView.xaml': p('Views/SalesEntryFormView.xaml', 'sales-entry-form-screen'),
  'Views/StockTransferView.xaml': p('Views/StockTransferView.xaml', 'stock-transfer-screen'),
  'Views/FinancialYearManagementView.xaml': p('Views/FinancialYearManagementView.xaml', 'financial-year-screen'),
  'Views/ImportPageView.xaml': p('Views/ImportPageView.xaml', 'import-page-screen'),
  'Views/BomView.xaml': p('Views/BomView.xaml', 'bom-screen'),
  'Views/BillFormatDesignerView.xaml': p('Views/BillFormatDesignerView.xaml', 'bill-format-designer-screen'),
  'Views/WorkOrderView.xaml': p('Views/WorkOrderView.xaml', 'work-order-screen'),
  'Views/SubPageView.xaml': p('Views/SubPageView.xaml', 'sub-page-screen'),

  'Views/SalesOrderWorkspaceView.xaml': p('Views/SalesOrderWorkspaceView.xaml', 'sales-order-workspace-screen'),
  'Views/DeliveryChallanWorkspaceView.xaml': p('Views/DeliveryChallanWorkspaceView.xaml', 'delivery-challan-workspace-screen'),
  'Views/SalesInvoiceWorkspaceView.xaml': p('Views/SalesInvoiceWorkspaceView.xaml', 'sales-invoice-workspace-screen'),
  'Views/SalesReturnWorkspaceView.xaml': p('Views/SalesReturnWorkspaceView.xaml', 'sales-return-workspace-screen'),
  'Views/PurchaseOrderWorkspaceView.xaml': p('Views/PurchaseOrderWorkspaceView.xaml', 'purchase-order-workspace-screen'),
  'Views/GrnWorkspaceView.xaml': p('Views/GrnWorkspaceView.xaml', 'grn-workspace-screen'),
  'Views/PurchaseInvoiceWorkspaceView.xaml': p('Views/PurchaseInvoiceWorkspaceView.xaml', 'purchase-invoice-workspace-screen'),
  'Views/PurchaseReturnWorkspaceView.xaml': p('Views/PurchaseReturnWorkspaceView.xaml', 'purchase-return-workspace-screen'),

  'Views/SalesOrderEntryView.xaml': p('Views/SalesOrderEntryView.xaml', 'sales-order-entry-screen'),
  'Views/DeliveryChallanEntryView.xaml': p('Views/DeliveryChallanEntryView.xaml', 'delivery-challan-entry-screen'),
  'Views/SalesInvoiceEntryView.xaml': p('Views/SalesInvoiceEntryView.xaml', 'sales-invoice-entry-screen'),
  'Views/SalesReturnEntryView.xaml': p('Views/SalesReturnEntryView.xaml', 'sales-return-entry-screen'),
  'Views/PurchaseOrderEntryView.xaml': p('Views/PurchaseOrderEntryView.xaml', 'purchase-order-entry-screen'),
  'Views/GrnEntryView.xaml': p('Views/GrnEntryView.xaml', 'grn-entry-screen'),
  'Views/PurchaseInvoiceEntryView.xaml': p('Views/PurchaseInvoiceEntryView.xaml', 'purchase-invoice-entry-screen'),
  'Views/PurchaseReturnEntryView.xaml': p('Views/PurchaseReturnEntryView.xaml', 'purchase-return-entry-screen'),

  'Views/PaymentVoucherEntryView.xaml': p('Views/PaymentVoucherEntryView.xaml', 'payment-voucher-screen'),
  'Views/ReceiptVoucherEntryView.xaml': p('Views/ReceiptVoucherEntryView.xaml', 'receipt-voucher-screen'),
  'Views/CreditNoteEntryView.xaml': p('Views/CreditNoteEntryView.xaml', 'credit-note-screen'),
  'Views/DebitNoteEntryView.xaml': p('Views/DebitNoteEntryView.xaml', 'debit-note-screen'),
  'Views/CashEntryEntryView.xaml': p('Views/CashEntryEntryView.xaml', 'cash-entry-screen'),
  'Views/BankEntryEntryView.xaml': p('Views/BankEntryEntryView.xaml', 'bank-entry-screen'),

  'Views/LedgerReportView.xaml': p('Views/LedgerReportView.xaml', 'ledger-report-screen'),
  'Views/TrialBalanceReportView.xaml': p('Views/TrialBalanceReportView.xaml', 'trial-balance-screen'),
  'Views/FinancialStatementReportView.xaml': p('Views/FinancialStatementReportView.xaml', 'financial-statement-screen'),
  'Views/OpeningStockReportView.xaml': p('Views/OpeningStockReportView.xaml', 'opening-stock-screen'),
  'Views/ClosingStockReportView.xaml': p('Views/ClosingStockReportView.xaml', 'closing-stock-screen'),
  'Views/StockMovementReportView.xaml': p('Views/StockMovementReportView.xaml', 'stock-movement-screen'),
  'Views/StockDetailsSummaryReportView.xaml': p('Views/StockDetailsSummaryReportView.xaml', 'stock-summary-screen'),
  'Views/ReorderLevelReportView.xaml': p('Views/ReorderLevelReportView.xaml', 'reorder-level-screen'),
  'Views/ProfitAnalysisReportView.xaml': p('Views/ProfitAnalysisReportView.xaml', 'profit-analysis-screen'),
  'Views/PurchaseAnalysisReportView.xaml': p('Views/PurchaseAnalysisReportView.xaml', 'purchase-analysis-screen'),
  'Views/SalesAnalysisReportView.xaml': p('Views/SalesAnalysisReportView.xaml', 'sales-analysis-screen'),
  'Views/OutstandingReportView.xaml': p('Views/OutstandingReportView.xaml', 'outstanding-report-screen'),
  'Views/DueDayReportView.xaml': p('Views/DueDayReportView.xaml', 'due-day-screen'),
  'Views/DueAmountReportView.xaml': p('Views/DueAmountReportView.xaml', 'due-amount-screen'),
  'Views/DocumentRegisterReportView.xaml': p('Views/DocumentRegisterReportView.xaml', 'document-register-screen'),

  'Reporting/Designer/Views/ReportFormatDesignerView.xaml': p(
    'Reporting/Designer/Views/ReportFormatDesignerView.xaml',
    'report-format-designer-screen',
  ),
} as const;

export const SettingsScreen = refinedByXamlPath['Views/SettingsView.xaml'];
export const AccountMasterFormScreen = refinedByXamlPath['Views/AccountMasterFormView.xaml'];
export const SalesInvoiceWorkspaceScreen = refinedByXamlPath['Views/SalesInvoiceWorkspaceView.xaml'];
export const DashboardScreen = refinedByXamlPath['Views/DashboardView.xaml'];
