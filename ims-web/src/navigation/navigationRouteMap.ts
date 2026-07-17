import { NavKeys, type NavKey } from './navKeys';

/**
 * Maps navigation keys (IMS NavigationCatalog) → WPF XAML path in wpf-ui manifest.
 * Aligned with MainWindow.xaml DataTemplates + NavigationCatalog.CreateViewModel.
 */
export const navigationRouteMap: Record<string, string> = {
  [NavKeys.Dashboard]: 'Views/DashboardView.xaml',

  // Master lists (StandardListView in WPF MainWindow)
  [NavKeys.Products]: 'Views/StandardListView.xaml',
  [NavKeys.ProductTypes]: 'Views/StandardListView.xaml',
  [NavKeys.MainGroups]: 'Views/StandardListView.xaml',
  [NavKeys.SubGroups]: 'Views/StandardListView.xaml',
  [NavKeys.AssemblyTypes]: 'Views/StandardListView.xaml',
  [NavKeys.Machines]: 'Views/StandardListView.xaml',
  [NavKeys.Warehouses]: 'Views/StandardListView.xaml',
  [NavKeys.SaleUom]: 'Views/StandardListView.xaml',
  [NavKeys.PurchaseUom]: 'Views/StandardListView.xaml',
  [NavKeys.StockLevels]: 'Views/StandardListView.xaml',
  [NavKeys.Suppliers]: 'Views/StandardListView.xaml',
  [NavKeys.AccountLedger]: 'Views/StandardListView.xaml',
  [NavKeys.CompanyRegistration]: 'Views/StandardListView.xaml',
  [NavKeys.CustomerTypes]: 'Views/StandardListView.xaml',
  [NavKeys.UserRoles]: 'Views/StandardListView.xaml',
  [NavKeys.RoleMaster]: 'Views/RoleMasterView.xaml',
  [NavKeys.BillFormatDesigner]: 'Views/StandardListView.xaml',
  [NavKeys.ReportFormatsCanvas]: 'Views/StandardListView.xaml',
  [NavKeys.WorkCenters]: 'Views/StandardListView.xaml',
  [NavKeys.ProductionOrders]: 'Views/StandardListView.xaml',
  [NavKeys.Bom]: 'Views/BomView.xaml',

  // Sales / purchase document lists
  [NavKeys.SalesOrders]: 'Views/SalesOrderListView.xaml',
  [NavKeys.Quotation]: 'Views/StandardListView.xaml',
  [NavKeys.DeliveryChallan]: 'Views/StandardListView.xaml',
  [NavKeys.SalesInvoice]: 'Views/StandardListView.xaml',
  [NavKeys.SalesReturn]: 'Views/StandardListView.xaml',
  [NavKeys.PurchaseOrders]: 'Views/StandardListView.xaml',
  [NavKeys.Grn]: 'Views/StandardListView.xaml',
  [NavKeys.PurchaseInvoice]: 'Views/StandardListView.xaml',
  [NavKeys.PurchaseReturn]: 'Views/StandardListView.xaml',

  // Finance lists
  [NavKeys.PaymentVoucher]: 'Views/StandardListView.xaml',
  [NavKeys.ReceiptVoucher]: 'Views/StandardListView.xaml',
  [NavKeys.CreditNote]: 'Views/StandardListView.xaml',
  [NavKeys.DebitNote]: 'Views/StandardListView.xaml',
  [NavKeys.PettyCash]: 'Views/StandardListView.xaml',
  [NavKeys.BankEntry]: 'Views/StandardListView.xaml',

  // Dedicated screens
  [NavKeys.Settings]: 'Views/SettingsView.xaml',
  [NavKeys.StockTransfer]: 'Views/StockTransferView.xaml',
  [NavKeys.FinancialYears]: 'Views/FinancialYearManagementView.xaml',
  [NavKeys.StockMovements]: 'Views/StockMovementReportView.xaml',

  // Reports
  [NavKeys.LedgerReport]: 'Views/LedgerReportView.xaml',
  [NavKeys.ReorderLevel]: 'Views/ReorderLevelReportView.xaml',
  [NavKeys.ProfitAnalysis]: 'Views/ProfitAnalysisReportView.xaml',
  [NavKeys.PurchaseAnalysis]: 'Views/PurchaseAnalysisReportView.xaml',
  [NavKeys.SalesAnalysis]: 'Views/SalesAnalysisReportView.xaml',
  [NavKeys.OutstandingReport]: 'Views/OutstandingReportView.xaml',
  [NavKeys.DueDayReport]: 'Views/DueDayReportView.xaml',
  [NavKeys.DueAmountReport]: 'Views/DueAmountReportView.xaml',
  [NavKeys.OpeningStock]: 'Views/OpeningStockReportView.xaml',
  [NavKeys.ClosingStock]: 'Views/ClosingStockReportView.xaml',
  [NavKeys.ProductionReport]: 'Views/StandardListView.xaml',
  [NavKeys.StockSummary]: 'Views/StockDetailsSummaryReportView.xaml',
  [NavKeys.TrialBalance]: 'Views/TrialBalanceReportView.xaml',
  [NavKeys.TradingAccount]: 'Views/FinancialStatementReportView.xaml',
  [NavKeys.ProfitLoss]: 'Views/FinancialStatementReportView.xaml',
  [NavKeys.ProfitLossWithTrading]: 'Views/FinancialStatementReportView.xaml',
  [NavKeys.BalanceSheet]: 'Views/FinancialStatementReportView.xaml',

  // Registers
  [NavKeys.SalesOrderRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.SalesDcRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.SalesInvoiceRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.SalesReturnRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.PurchaseOrderRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.GrnRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.PurchaseInvoiceRegister]: 'Views/DocumentRegisterReportView.xaml',
  [NavKeys.PurchaseReturnRegister]: 'Views/DocumentRegisterReportView.xaml',

  // Import
  [NavKeys.ImportProduct]: 'Views/ImportPageView.xaml',
  [NavKeys.ImportAccount]: 'Views/ImportPageView.xaml',
  [NavKeys.ImportSalesInvoice]: 'Views/ImportPageView.xaml',
  [NavKeys.ImportPurchaseInvoice]: 'Views/ImportPageView.xaml',

};

/** Entry / workspace screens (sub-navigation, demos) */
export const workspaceRouteMap: Record<string, string> = {
  'sales-order-entry': 'Views/SalesOrderWorkspaceView.xaml',
  'quotation-entry': 'Views/StandardListView.xaml',
  'delivery-challan-entry': 'Views/DeliveryChallanWorkspaceView.xaml',
  'sales-invoice-entry': 'Views/SalesInvoiceWorkspaceView.xaml',
  'sales-return-entry': 'Views/SalesReturnWorkspaceView.xaml',
  'purchase-order-entry': 'Views/PurchaseOrderWorkspaceView.xaml',
  'grn-entry': 'Views/GrnWorkspaceView.xaml',
  'purchase-invoice-entry': 'Views/PurchaseInvoiceWorkspaceView.xaml',
  'purchase-return-entry': 'Views/PurchaseReturnWorkspaceView.xaml',
  'receipt-voucher-entry': 'Views/ReceiptVoucherEntryView.xaml',
  'payment-voucher-entry': 'Views/PaymentVoucherEntryView.xaml',
  'payment-voucher-allocation': 'Views/PaymentVoucherAllocationView.xaml',
  'credit-note-entry': 'Views/CreditNoteEntryView.xaml',
  'debit-note-entry': 'Views/DebitNoteEntryView.xaml',
  'bank-entry-entry': 'Views/BankEntryEntryView.xaml',
  'petty-cash-entry': 'Views/PettyCashEntryView.xaml',
  'account-master-form': 'Views/AccountMasterFormView.xaml',
  'product-master-form': 'Views/ProductMasterFormView.xaml',
  'bill-format-design': 'Views/BillFormatDesignerView.xaml',
  'report-format-design': 'Reporting/Designer/Views/ReportFormatDesignerView.xaml',
};

export function resolveXamlPath(navKey: string): string {
  return (
    navigationRouteMap[navKey] ??
    workspaceRouteMap[navKey] ??
    'Views/StandardListView.xaml'
  );
}

export function getHeaderTitleForKey(navKey: string, catalog: NavigationCatalogItem[]): string {
  const item = catalog.find((i) => i.key === navKey);
  return item?.title ?? 'Dashboard';
}

export interface NavigationCatalogItem {
  key: string;
  title: string;
  section: string;
  iconGlyph: string;
  description: string;
}
