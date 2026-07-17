import { createConfiguredReportScreen } from './ConfiguredReportScreen';
import { DocumentRegisterScreen } from './DocumentRegisterScreen';
import { DOCUMENT_REGISTER_CONFIG } from './documentRegisterConfig';
import { ImportPageScreen } from './ImportPageScreen';
import { LedgerReportScreen } from './LedgerReportScreen';
import {
  balanceSheetReportConfig,
  closingStockReportConfig,
  dueAmountReportConfig,
  dueDayReportConfig,
  openingStockReportConfig,
  outstandingReportConfig,
  profitAnalysisReportConfig,
  profitLossReportConfig,
  profitLossTradingReportConfig,
  productionReportConfig,
  purchaseAnalysisReportConfig,
  reorderLevelReportConfig,
  stockMovementReportConfig,
  stockSummaryReportConfig,
  tradingAccountReportConfig,
  trialBalanceReportConfig,
} from './reportScreenConfigs';
import { SalesAnalysisReportScreen } from './SalesAnalysisReportScreen';

export function SalesOrderRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['sales-order-register']} />;
}

export function SalesDcRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['sales-dc-register']} />;
}

export function SalesInvoiceRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['sales-invoice-register']} />;
}

export function SalesReturnRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['sales-return-register']} />;
}

export function SalesAnalysisRouteScreen() {
  return <SalesAnalysisReportScreen />;
}

export function LedgerReportRouteScreen() {
  return <LedgerReportScreen />;
}

export const TrialBalanceRouteScreen = createConfiguredReportScreen(trialBalanceReportConfig);
export const TradingAccountRouteScreen = createConfiguredReportScreen(tradingAccountReportConfig);
export const ProfitLossRouteScreen = createConfiguredReportScreen(profitLossReportConfig);
export const ProfitLossTradingRouteScreen = createConfiguredReportScreen(profitLossTradingReportConfig);
export const BalanceSheetRouteScreen = createConfiguredReportScreen(balanceSheetReportConfig);
export const OpeningStockRouteScreen = createConfiguredReportScreen(openingStockReportConfig);
export const ClosingStockRouteScreen = createConfiguredReportScreen(closingStockReportConfig);
export const StockSummaryRouteScreen = createConfiguredReportScreen(stockSummaryReportConfig);
export const StockMovementRouteScreen = createConfiguredReportScreen(stockMovementReportConfig);
export const ReorderLevelRouteScreen = createConfiguredReportScreen(reorderLevelReportConfig);
export const ProfitAnalysisRouteScreen = createConfiguredReportScreen(profitAnalysisReportConfig);
export const PurchaseAnalysisRouteScreen = createConfiguredReportScreen(purchaseAnalysisReportConfig);
export const OutstandingRouteScreen = createConfiguredReportScreen(outstandingReportConfig);
export const DueDayRouteScreen = createConfiguredReportScreen(dueDayReportConfig);
export const DueAmountRouteScreen = createConfiguredReportScreen(dueAmountReportConfig);
export const ProductionReportRouteScreen = createConfiguredReportScreen(productionReportConfig);

export function ImportSalesInvoiceRouteScreen() {
  return (
    <ImportPageScreen
      importType="sales-invoices"
      entityLabel="Sales Invoice"
      targetNavKey="sales-invoice"
      targetSectionTitle="Sales Invoice"
    />
  );
}

export function PurchaseOrderRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['purchase-order-register']} />;
}

export function GrnRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['grn-register']} />;
}

export function PurchaseInvoiceRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['purchase-invoice-register']} />;
}

export function PurchaseReturnRegisterRouteScreen() {
  return <DocumentRegisterScreen config={DOCUMENT_REGISTER_CONFIG['purchase-return-register']} />;
}

export function ImportProductRouteScreen() {
  return (
    <ImportPageScreen
      importType="products"
      entityLabel="Product"
      targetNavKey="products"
      targetSectionTitle="Products"
    />
  );
}

export function ImportAccountRouteScreen() {
  return (
    <ImportPageScreen
      importType="accounts"
      entityLabel="Account"
      targetNavKey="account-ledger"
      targetSectionTitle="Account Ledger"
    />
  );
}

export function ImportPurchaseInvoiceRouteScreen() {
  return (
    <ImportPageScreen
      importType="purchase-invoices"
      entityLabel="Purchase Invoice"
      targetNavKey="purchase-invoice"
      targetSectionTitle="Purchase Invoice"
    />
  );
}
