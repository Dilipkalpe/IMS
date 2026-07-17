import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyProductMasterForm = lazy(() =>
  import('./ProductMasterFormScreen').then((m) => ({ default: m.ProductMasterFormScreen })),
);
const LazyAccountMasterForm = lazy(() =>
  import('./AccountMasterFormScreen').then((m) => ({ default: m.AccountMasterFormScreen })),
);

export function ProductMasterFormRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading product form…" />}>
      <LazyProductMasterForm />
    </Suspense>
  );
}

export function AccountMasterFormRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading account form…" />}>
      <LazyAccountMasterForm />
    </Suspense>
  );
}
import {
  ACCOUNT_LEDGER_CONFIG,
  ASSEMBLY_TYPES_CONFIG,
  ATTENDANCE_CONFIG,
  BOM_CONFIG,
  COMPANY_REGISTRATION_CONFIG,
  CUSTOMER_TYPES_CONFIG,
  FINANCIAL_YEARS_CONFIG,
  MAIN_GROUPS_CONFIG,
  MACHINES_CONFIG,
  PAYROLL_EMPLOYEES_CONFIG,
  PAYROLL_RUNS_CONFIG,
  PRODUCTION_ORDERS_CONFIG,
  PRODUCTS_CONFIG,
  PRODUCT_TYPES_CONFIG,
  PURCHASE_UOM_CONFIG,
  ROLE_MASTER_CONFIG,
  SALE_UOM_CONFIG,
  STOCK_TRANSFER_CONFIG,
  SUB_GROUPS_CONFIG,
  SUPPLIERS_CONFIG,
  USERS_CONFIG,
  WAREHOUSES_CONFIG,
  type MasterListConfig,
} from './masterConfigs';

function lazyMasterList(config: MasterListConfig): ComponentType {
  const LazyList = lazy(() =>
    import('./MasterListScreen').then((m) => ({
      default: () => <m.MasterListScreen config={config} />,
    })),
  );
  function Route() {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyList />
      </Suspense>
    );
  }
  return Route;
}

export const ProductsListRouteScreen = lazyMasterList(PRODUCTS_CONFIG);
export const AccountLedgerListRouteScreen = lazyMasterList(ACCOUNT_LEDGER_CONFIG);
export const SuppliersListRouteScreen = lazyMasterList(SUPPLIERS_CONFIG);
export const ProductTypesListRouteScreen = lazyMasterList(PRODUCT_TYPES_CONFIG);
export const MainGroupsListRouteScreen = lazyMasterList(MAIN_GROUPS_CONFIG);
export const SubGroupsListRouteScreen = lazyMasterList(SUB_GROUPS_CONFIG);
export const AssemblyTypesListRouteScreen = lazyMasterList(ASSEMBLY_TYPES_CONFIG);
export const MachinesListRouteScreen = lazyMasterList(MACHINES_CONFIG);
export const WarehousesListRouteScreen = lazyMasterList(WAREHOUSES_CONFIG);
export const SaleUomListRouteScreen = lazyMasterList(SALE_UOM_CONFIG);
export const PurchaseUomListRouteScreen = lazyMasterList(PURCHASE_UOM_CONFIG);
export const CustomerTypesListRouteScreen = lazyMasterList(CUSTOMER_TYPES_CONFIG);
export const UserRolesListRouteScreen = lazyMasterList(USERS_CONFIG);
export const RoleMasterListRouteScreen = lazyMasterList(ROLE_MASTER_CONFIG);
export const CompanyRegistrationListRouteScreen = lazyMasterList(COMPANY_REGISTRATION_CONFIG);
export const ProductionOrdersListRouteScreen = lazyMasterList(PRODUCTION_ORDERS_CONFIG);
export const FinancialYearsListRouteScreen = lazyMasterList(FINANCIAL_YEARS_CONFIG);
export const PayrollEmployeesListRouteScreen = lazyMasterList(PAYROLL_EMPLOYEES_CONFIG);
export const AttendanceListRouteScreen = lazyMasterList(ATTENDANCE_CONFIG);
export const PayrollRunsListRouteScreen = lazyMasterList(PAYROLL_RUNS_CONFIG);
export const StockTransferListRouteScreen = lazyMasterList(STOCK_TRANSFER_CONFIG);
export const BomListRouteScreen = lazyMasterList(BOM_CONFIG);
