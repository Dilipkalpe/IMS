import { NavKeys } from './navKeys';
import { workspaceRouteMap } from './navigationRouteMap';

export type WorkflowCategory =
  | 'dashboard'
  | 'list'
  | 'workspace'
  | 'entry'
  | 'report'
  | 'master'
  | 'finance'
  | 'import'
  | 'settings'
  | 'designer';

export type ParityStatus = 'refined-shell' | 'generated-structure' | 'manual-pass-needed';

export interface WorkflowSpec {
  id: string;
  title: string;
  category: WorkflowCategory;
  wpfViewModel: string;
  wpfPrimaryView: string;
  reactNavKey: string;
  reactXamlPath: string;
  parityStatus: ParityStatus;
  notes?: string;
}

/** WPF ↔ React workflow matrix for QA validation */
export const workflowRegistry: WorkflowSpec[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'dashboard',
    wpfViewModel: 'DashboardViewModel',
    wpfPrimaryView: 'Views/DashboardView.xaml',
    reactNavKey: NavKeys.Dashboard,
    reactXamlPath: 'Views/DashboardView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'settings',
    title: 'Settings',
    category: 'settings',
    wpfViewModel: 'SettingsViewModel',
    wpfPrimaryView: 'Views/SettingsView.xaml',
    reactNavKey: NavKeys.Settings,
    reactXamlPath: 'Views/SettingsView.xaml',
    parityStatus: 'refined-shell',
    notes: 'Theme, print format, communication panels',
  },
  {
    id: 'products-list',
    title: 'Product Master (list)',
    category: 'list',
    wpfViewModel: 'ProductsViewModel',
    wpfPrimaryView: 'Views/StandardListView.xaml',
    reactNavKey: NavKeys.Products,
    reactXamlPath: 'Views/StandardListView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'account-list',
    title: 'Account Master (list)',
    category: 'list',
    wpfViewModel: 'AccountLedgerViewModel',
    wpfPrimaryView: 'Views/StandardListView.xaml',
    reactNavKey: NavKeys.AccountLedger,
    reactXamlPath: 'Views/StandardListView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'account-form',
    title: 'Account Master (form)',
    category: 'master',
    wpfViewModel: 'AddAccountMasterViewModel',
    wpfPrimaryView: 'Views/AccountMasterFormView.xaml',
    reactNavKey: 'account-master-form',
    reactXamlPath: 'Views/AccountMasterFormView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'sales-invoice-list',
    title: 'Sales Invoice (list)',
    category: 'list',
    wpfViewModel: 'SalesInvoicesViewModel',
    wpfPrimaryView: 'Views/StandardListView.xaml',
    reactNavKey: NavKeys.SalesInvoice,
    reactXamlPath: 'Views/StandardListView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'sales-invoice-workspace',
    title: 'Sales Invoice (entry workspace)',
    category: 'workspace',
    wpfViewModel: 'SalesInvoiceWorkspaceViewModel',
    wpfPrimaryView: 'Views/SalesInvoiceWorkspaceView.xaml',
    reactNavKey: 'sales-invoice-entry',
    reactXamlPath: 'Views/SalesInvoiceWorkspaceView.xaml',
    parityStatus: 'refined-shell',
    notes: 'Tabs + SalesInvoiceEntryView template',
  },
  {
    id: 'sales-order-workspace',
    title: 'Sales Order (entry workspace)',
    category: 'workspace',
    wpfViewModel: 'SalesOrderWorkspaceViewModel',
    wpfPrimaryView: 'Views/SalesOrderWorkspaceView.xaml',
    reactNavKey: 'sales-order-entry',
    reactXamlPath: 'Views/SalesOrderWorkspaceView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'purchase-invoice-workspace',
    title: 'Purchase Invoice (entry workspace)',
    category: 'workspace',
    wpfViewModel: 'PurchaseInvoiceWorkspaceViewModel',
    wpfPrimaryView: 'Views/PurchaseInvoiceWorkspaceView.xaml',
    reactNavKey: 'purchase-invoice-entry',
    reactXamlPath: 'Views/PurchaseInvoiceWorkspaceView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'payment-voucher',
    title: 'Payment Voucher',
    category: 'finance',
    wpfViewModel: 'PaymentVouchersViewModel → PaymentVoucherEntryViewModel',
    wpfPrimaryView: 'Views/PaymentVoucherEntryView.xaml',
    reactNavKey: NavKeys.PaymentVoucher,
    reactXamlPath: 'Views/StandardListView.xaml',
    parityStatus: 'refined-shell',
    notes: 'List uses StandardListView; entry view available in gallery',
  },
  {
    id: 'ledger-report',
    title: 'Ledger Report',
    category: 'report',
    wpfViewModel: 'LedgerReportViewModel',
    wpfPrimaryView: 'Views/LedgerReportView.xaml',
    reactNavKey: NavKeys.LedgerReport,
    reactXamlPath: 'Views/LedgerReportView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'bill-format-designer',
    title: 'Bill Format Designer',
    category: 'designer',
    wpfViewModel: 'BillFormatDesignViewModel',
    wpfPrimaryView: 'Views/BillFormatDesignerView.xaml',
    reactNavKey: 'bill-format-design',
    reactXamlPath: 'Views/BillFormatDesignerView.xaml',
    parityStatus: 'manual-pass-needed',
    notes: 'Canvas/layout editor needs custom React controls',
  },
  {
    id: 'report-format-canvas',
    title: 'Report Format Designer (canvas)',
    category: 'designer',
    wpfViewModel: 'ReportFormatDesignerViewModel',
    wpfPrimaryView: 'Reporting/Designer/Views/ReportFormatDesignerView.xaml',
    reactNavKey: 'report-format-design',
    reactXamlPath: 'Reporting/Designer/Views/ReportFormatDesignerView.xaml',
    parityStatus: 'manual-pass-needed',
  },
  {
    id: 'import-product',
    title: 'Import — Product',
    category: 'import',
    wpfViewModel: 'ImportPageViewModel',
    wpfPrimaryView: 'Views/ImportPageView.xaml',
    reactNavKey: NavKeys.ImportProduct,
    reactXamlPath: 'Views/ImportPageView.xaml',
    parityStatus: 'refined-shell',
  },
  {
    id: 'stock-transfer',
    title: 'Stock Transfer',
    category: 'entry',
    wpfViewModel: 'StockTransferViewModel',
    wpfPrimaryView: 'Views/StockTransferView.xaml',
    reactNavKey: NavKeys.StockTransfer,
    reactXamlPath: 'Views/StockTransferView.xaml',
    parityStatus: 'refined-shell',
  },
];

/** All document workspace shortcuts (WPF entry flow) */
export const workspaceWorkflows = Object.entries(workspaceRouteMap).map(([key, xaml]) => ({
  navKey: key,
  xamlPath: xaml,
  title: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export function getWorkflowsByCategory(category: WorkflowCategory): WorkflowSpec[] {
  return workflowRegistry.filter((w) => w.category === category);
}
