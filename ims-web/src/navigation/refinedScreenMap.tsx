import type { ComponentType } from 'react';
import { PurchaseInvoiceListRouteScreen, PurchaseInvoiceWorkspaceRouteScreen } from '../purchase-invoice/routes';
import { PurchaseReturnListRouteScreen, PurchaseReturnWorkspaceRouteScreen } from '../purchase-return/routes';
import { GrnListRouteScreen, GrnWorkspaceRouteScreen } from '../grn/routes';
import { PurchaseOrderListRouteScreen, PurchaseOrderWorkspaceRouteScreen } from '../purchase-order/routes';
import { QuotationListRouteScreen, QuotationWorkspaceRouteScreen } from '../quotation/routes';
import { DeliveryChallanListRouteScreen, DeliveryChallanWorkspaceRouteScreen } from '../delivery-challan/routes';
import { SalesOrderListRouteScreen, SalesOrderWorkspaceRouteScreen } from '../sales-order/routes';
import { SalesReturnListRouteScreen, SalesReturnWorkspaceRouteScreen } from '../sales-return/routes';
import { SalesInvoiceListRouteScreen, SalesInvoiceWorkspaceRouteScreen } from '../sales-invoice/routes';
import { ReceiptVoucherEntryRouteScreen } from '../receipt-voucher/routes';
import { DashboardRouteScreen } from '../dashboard/routes';
import {
  AccountLedgerListRouteScreen,
  AssemblyTypesListRouteScreen,
  AttendanceListRouteScreen,
  BomListRouteScreen,
  CompanyRegistrationListRouteScreen,
  CustomerTypesListRouteScreen,
  FinancialYearsListRouteScreen,
  MachinesListRouteScreen,
  MainGroupsListRouteScreen,
  PayrollEmployeesListRouteScreen,
  PayrollRunsListRouteScreen,
  ProductionOrdersListRouteScreen,
  ProductTypesListRouteScreen,
  ProductsListRouteScreen,
  PurchaseUomListRouteScreen,
  SaleUomListRouteScreen,
  StockTransferListRouteScreen,
  SubGroupsListRouteScreen,
  SuppliersListRouteScreen,
  WarehousesListRouteScreen,
} from '../masters/routes';
import {
  RoleFormRouteScreen,
  RoleMasterListRouteScreen,
  UserFormRouteScreen,
  UserRolesListRouteScreen,
} from '../security/routes';
import { PayrollEmployeeFormRouteScreen, PayrollReportsRouteScreen } from '../payroll/routes';
import {
  BillFormatDesignerRouteScreen,
  PaymentAllocationRouteScreen,
  ReportFormatDesignerRouteScreen,
} from '../designers/routes';
import {
  AccountMasterFormRouteScreen,
  ProductMasterFormRouteScreen,
} from '../masters/routes';
import {
  BankEntryEntryRouteScreen,
  BankEntryListRouteScreen,
  CreditNoteEntryRouteScreen,
  CreditNoteListRouteScreen,
  DebitNoteEntryRouteScreen,
  DebitNoteListRouteScreen,
  PaymentVoucherEntryRouteScreen,
  PaymentVoucherListRouteScreen,
  PettyCashEntryRouteScreen,
  PettyCashListRouteScreen,
  ReceiptVoucherListRouteScreen,
} from '../finance/routes';
import {
  BalanceSheetRouteScreen,
  ClosingStockRouteScreen,
  DueAmountRouteScreen,
  DueDayRouteScreen,
  GrnRegisterRouteScreen,
  ImportAccountRouteScreen,
  ImportProductRouteScreen,
  ImportPurchaseInvoiceRouteScreen,
  ImportSalesInvoiceRouteScreen,
  LedgerReportRouteScreen,
  OpeningStockRouteScreen,
  OutstandingRouteScreen,
  ProfitAnalysisRouteScreen,
  ProfitLossRouteScreen,
  ProfitLossTradingRouteScreen,
  ProductionReportRouteScreen,
  PurchaseAnalysisRouteScreen,
  PurchaseInvoiceRegisterRouteScreen,
  PurchaseOrderRegisterRouteScreen,
  PurchaseReturnRegisterRouteScreen,
  ReorderLevelRouteScreen,
  SalesAnalysisRouteScreen,
  SalesDcRegisterRouteScreen,
  SalesInvoiceRegisterRouteScreen,
  SalesOrderRegisterRouteScreen,
  SalesReturnRegisterRouteScreen,
  StockMovementRouteScreen,
  StockSummaryRouteScreen,
  TradingAccountRouteScreen,
  TrialBalanceRouteScreen,
} from '../reports/routes';
import { SettingsScreen } from '../settings/SettingsScreen';
import { refinedByXamlPath } from '../screens/refinedScreens';
import { NavKeys } from './navKeys';

/**
 * Nav-key overrides (workspace entry shortcuts, etc.).
 * Most menu items resolve via refinedByXamlPath in resolveScreen.tsx.
 */
export const refinedScreenMap: Record<string, ComponentType> = {
  [NavKeys.Settings]: SettingsScreen,
  [NavKeys.Dashboard]: DashboardRouteScreen,

  // Phase 3 — registers, MIS, import
  [NavKeys.SalesOrderRegister]: SalesOrderRegisterRouteScreen,
  [NavKeys.SalesDcRegister]: SalesDcRegisterRouteScreen,
  [NavKeys.SalesInvoiceRegister]: SalesInvoiceRegisterRouteScreen,
  [NavKeys.SalesReturnRegister]: SalesReturnRegisterRouteScreen,
  [NavKeys.SalesAnalysis]: SalesAnalysisRouteScreen,
  [NavKeys.LedgerReport]: LedgerReportRouteScreen,
  [NavKeys.TrialBalance]: TrialBalanceRouteScreen,
  [NavKeys.TradingAccount]: TradingAccountRouteScreen,
  [NavKeys.ProfitLoss]: ProfitLossRouteScreen,
  [NavKeys.ProfitLossWithTrading]: ProfitLossTradingRouteScreen,
  [NavKeys.BalanceSheet]: BalanceSheetRouteScreen,
  [NavKeys.OpeningStock]: OpeningStockRouteScreen,
  [NavKeys.ClosingStock]: ClosingStockRouteScreen,
  [NavKeys.StockSummary]: StockSummaryRouteScreen,
  [NavKeys.StockMovements]: StockMovementRouteScreen,
  [NavKeys.ReorderLevel]: ReorderLevelRouteScreen,
  [NavKeys.ProfitAnalysis]: ProfitAnalysisRouteScreen,
  [NavKeys.PurchaseAnalysis]: PurchaseAnalysisRouteScreen,
  [NavKeys.ProductionReport]: ProductionReportRouteScreen,
  [NavKeys.OutstandingReport]: OutstandingRouteScreen,
  [NavKeys.DueDayReport]: DueDayRouteScreen,
  [NavKeys.DueAmountReport]: DueAmountRouteScreen,
  [NavKeys.ImportSalesInvoice]: ImportSalesInvoiceRouteScreen,
  [NavKeys.ImportProduct]: ImportProductRouteScreen,
  [NavKeys.ImportAccount]: ImportAccountRouteScreen,
  [NavKeys.ImportPurchaseInvoice]: ImportPurchaseInvoiceRouteScreen,
  [NavKeys.PurchaseOrderRegister]: PurchaseOrderRegisterRouteScreen,
  [NavKeys.GrnRegister]: GrnRegisterRouteScreen,
  [NavKeys.PurchaseInvoiceRegister]: PurchaseInvoiceRegisterRouteScreen,
  [NavKeys.PurchaseReturnRegister]: PurchaseReturnRegisterRouteScreen,

  // Sales Invoice — production workflow (list → workspace → entry)
  [NavKeys.SalesInvoice]: SalesInvoiceListRouteScreen,
  [NavKeys.PurchaseInvoice]: PurchaseInvoiceListRouteScreen,
  [NavKeys.PurchaseReturn]: PurchaseReturnListRouteScreen,
  [NavKeys.SalesOrders]: SalesOrderListRouteScreen,
  [NavKeys.PurchaseOrders]: PurchaseOrderListRouteScreen,
  [NavKeys.Grn]: GrnListRouteScreen,
  [NavKeys.Quotation]: QuotationListRouteScreen,
  [NavKeys.DeliveryChallan]: DeliveryChallanListRouteScreen,
  [NavKeys.SalesReturn]: SalesReturnListRouteScreen,

  // Finance vouchers
  [NavKeys.PaymentVoucher]: PaymentVoucherListRouteScreen,
  [NavKeys.ReceiptVoucher]: ReceiptVoucherListRouteScreen,
  [NavKeys.CreditNote]: CreditNoteListRouteScreen,
  [NavKeys.DebitNote]: DebitNoteListRouteScreen,
  [NavKeys.BankEntry]: BankEntryListRouteScreen,
  [NavKeys.PettyCash]: PettyCashListRouteScreen,

  // Master lists
  [NavKeys.Products]: ProductsListRouteScreen,
  [NavKeys.AccountLedger]: AccountLedgerListRouteScreen,
  [NavKeys.Suppliers]: SuppliersListRouteScreen,
  [NavKeys.ProductTypes]: ProductTypesListRouteScreen,
  [NavKeys.MainGroups]: MainGroupsListRouteScreen,
  [NavKeys.SubGroups]: SubGroupsListRouteScreen,
  [NavKeys.AssemblyTypes]: AssemblyTypesListRouteScreen,
  [NavKeys.Machines]: MachinesListRouteScreen,
  [NavKeys.Warehouses]: WarehousesListRouteScreen,
  [NavKeys.SaleUom]: SaleUomListRouteScreen,
  [NavKeys.PurchaseUom]: PurchaseUomListRouteScreen,
  [NavKeys.CustomerTypes]: CustomerTypesListRouteScreen,
  [NavKeys.UserRoles]: UserRolesListRouteScreen,
  [NavKeys.RoleMaster]: RoleMasterListRouteScreen,
  [NavKeys.CompanyRegistration]: CompanyRegistrationListRouteScreen,
  [NavKeys.FinancialYears]: FinancialYearsListRouteScreen,
  [NavKeys.ReportFormatsCanvas]: ReportFormatDesignerRouteScreen,

  // Operations & payroll
  [NavKeys.StockTransfer]: StockTransferListRouteScreen,
  [NavKeys.ProductionOrders]: ProductionOrdersListRouteScreen,
  [NavKeys.Bom]: BomListRouteScreen,
  [NavKeys.PayrollEmployees]: PayrollEmployeesListRouteScreen,
  [NavKeys.Attendance]: AttendanceListRouteScreen,
  [NavKeys.PayrollRuns]: PayrollRunsListRouteScreen,
  [NavKeys.PayrollReports]: PayrollReportsRouteScreen,

  // Workspace entry workflows (list → open document)
  'sales-order-entry': SalesOrderWorkspaceRouteScreen,
  'quotation-entry': QuotationWorkspaceRouteScreen,
  'delivery-challan-entry': DeliveryChallanWorkspaceRouteScreen,
  'sales-invoice-entry': SalesInvoiceWorkspaceRouteScreen,
  'receipt-voucher-entry': ReceiptVoucherEntryRouteScreen,
  'payment-voucher-entry': PaymentVoucherEntryRouteScreen,
  'payment-voucher-allocation': PaymentAllocationRouteScreen,
  'credit-note-entry': CreditNoteEntryRouteScreen,
  'debit-note-entry': DebitNoteEntryRouteScreen,
  'bank-entry-entry': BankEntryEntryRouteScreen,
  'petty-cash-entry': PettyCashEntryRouteScreen,
  'sales-return-entry': SalesReturnWorkspaceRouteScreen,
  'purchase-order-entry': PurchaseOrderWorkspaceRouteScreen,
  'grn-entry': GrnWorkspaceRouteScreen,
  'purchase-invoice-entry': PurchaseInvoiceWorkspaceRouteScreen,
  'purchase-return-entry': PurchaseReturnWorkspaceRouteScreen,

  // Master form sub-pages
  'account-master-form': AccountMasterFormRouteScreen,
  'product-master-form': ProductMasterFormRouteScreen,
  'payroll-employee-form': PayrollEmployeeFormRouteScreen,
  'user-form': UserFormRouteScreen,
  'role-form': RoleFormRouteScreen,
  [NavKeys.BillFormatDesigner]: BillFormatDesignerRouteScreen,
  'bill-format-design': BillFormatDesignerRouteScreen,
  'report-format-design': ReportFormatDesignerRouteScreen,
};
