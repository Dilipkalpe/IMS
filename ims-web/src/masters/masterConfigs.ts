export type MasterFetchMode = 'paged' | 'items-array' | 'flat-array';

export interface MasterColumnDef {
  id: string;
  header: string;
  width?: number;
  minWidth?: number;
  field: string;
}

export type MasterCrudEntity = 'product' | 'account' | 'payrollEmployee';

export interface MasterCrudField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'password' | 'image';
  required?: boolean;
  readOnly?: boolean;
  showOn?: 'new' | 'edit' | 'both';
}

export interface MasterListConfig {
  title: string;
  listNavKey: string;
  formNavKey?: string;
  crudEntity?: MasterCrudEntity;
  apiCrud?: boolean;
  crudFields?: MasterCrudField[];
  crudKeyField?: string;
  crudKeyMode?: 'by-code' | 'by-username' | 'by-id';
  apiPath: string;
  fetchMode: MasterFetchMode;
  query?: Record<string, string>;
  columns: MasterColumnDef[];
  searchPlaceholder: string;
  searchFields?: string[];
}

const CODE_NAME_CRUD: MasterCrudField[] = [
  { key: 'code', label: 'Code', required: true },
  { key: 'name', label: 'Name', required: true },
];

function codeNameColumns(): MasterColumnDef[] {
  return [
    { id: 'code', header: 'Code', width: 120, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 200, field: 'name' },
  ];
}

export const PRODUCTS_CONFIG: MasterListConfig = {
  title: 'Product Catalog',
  listNavKey: 'products',
  formNavKey: 'product-master-form',
  crudEntity: 'product',
  apiPath: 'products',
  fetchMode: 'paged',
  columns: [
    { id: 'code', header: 'Code', width: 120, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 180, field: 'name' },
    { id: 'salePrice', header: 'Sale Price', width: 110, field: 'salePrice' },
    { id: 'taxType', header: 'Tax Type', width: 90, field: 'taxType' },
    { id: 'activeStatus', header: 'Active', width: 80, field: 'activeStatus' },
  ],
  searchPlaceholder: 'Search code, name…',
};

export const ACCOUNT_LEDGER_CONFIG: MasterListConfig = {
  title: 'Chart of Accounts',
  listNavKey: 'account-ledger',
  formNavKey: 'account-master-form',
  crudEntity: 'account',
  apiPath: 'accounts',
  fetchMode: 'paged',
  columns: [
    { id: 'code', header: 'Code', width: 100, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 180, field: 'name' },
    { id: 'accountType', header: 'Type', width: 100, field: 'accountType' },
    { id: 'gstNo', header: 'GST No', width: 140, field: 'gstNo' },
    { id: 'city', header: 'City', width: 120, field: 'city' },
    { id: 'activeStatus', header: 'Active', width: 80, field: 'activeStatus' },
  ],
  searchPlaceholder: 'Search accounts…',
};

export const SUPPLIERS_CONFIG: MasterListConfig = {
  ...ACCOUNT_LEDGER_CONFIG,
  title: 'Suppliers',
  listNavKey: 'suppliers',
  crudEntity: 'account',
  query: { type: 'supplier' },
  columns: [
    { id: 'code', header: 'Code', width: 100, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 200, field: 'name' },
    { id: 'gstNo', header: 'GST No', width: 140, field: 'gstNo' },
    { id: 'city', header: 'City', width: 120, field: 'city' },
    { id: 'activeStatus', header: 'Active', width: 80, field: 'activeStatus' },
  ],
  searchPlaceholder: 'Search suppliers…',
};

export const PRODUCT_TYPES_CONFIG: MasterListConfig = {
  title: 'Categories',
  listNavKey: 'product-types',
  apiPath: 'product-types',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: CODE_NAME_CRUD,
  columns: codeNameColumns(),
  searchPlaceholder: 'Search code, name…',
};

export const MAIN_GROUPS_CONFIG: MasterListConfig = {
  title: 'Product Groups',
  listNavKey: 'main-groups',
  apiPath: 'product-main-groups',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: CODE_NAME_CRUD,
  columns: codeNameColumns(),
  searchPlaceholder: 'Search code, name…',
};

export const SUB_GROUPS_CONFIG: MasterListConfig = {
  title: 'Subgroups',
  listNavKey: 'sub-groups',
  apiPath: 'product-sub-groups',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: [
    ...CODE_NAME_CRUD,
    { key: 'mainGroupCode', label: 'Main Group Code', required: true },
  ],
  columns: [
    { id: 'code', header: 'Code', width: 120, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 160, field: 'name' },
    { id: 'mainGroupCode', header: 'Main Group', width: 120, field: 'mainGroupCode' },
  ],
  searchPlaceholder: 'Search code, name…',
};

export const ASSEMBLY_TYPES_CONFIG: MasterListConfig = {
  title: 'Assembly Types',
  listNavKey: 'assembly-types',
  apiPath: 'assembly-types',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: CODE_NAME_CRUD,
  columns: codeNameColumns(),
  searchPlaceholder: 'Search code, name…',
};

export const MACHINES_CONFIG: MasterListConfig = {
  title: 'Equipment',
  listNavKey: 'machines',
  apiPath: 'machines',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: [
    ...CODE_NAME_CRUD,
    { key: 'description', label: 'Description' },
  ],
  columns: [
    { id: 'code', header: 'Code', width: 120, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 160, field: 'name' },
    { id: 'description', header: 'Description', minWidth: 140, field: 'description' },
  ],
  searchPlaceholder: 'Search code, name…',
};

export const WAREHOUSES_CONFIG: MasterListConfig = {
  title: 'Locations',
  listNavKey: 'warehouses',
  apiPath: 'warehouses',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: [
    ...CODE_NAME_CRUD,
    { key: 'location', label: 'Location' },
  ],
  columns: [
    { id: 'code', header: 'Code', width: 120, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 160, field: 'name' },
    { id: 'location', header: 'Location', minWidth: 140, field: 'location' },
  ],
  searchPlaceholder: 'Search code, name, location…',
};

export const SALE_UOM_CONFIG: MasterListConfig = {
  title: 'Sales Units',
  listNavKey: 'sale-uom',
  apiPath: 'sale-uoms',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: [
    ...CODE_NAME_CRUD,
    { key: 'symbol', label: 'Symbol' },
  ],
  columns: [
    { id: 'code', header: 'Code', width: 100, field: 'code' },
    { id: 'name', header: 'Name', minWidth: 140, field: 'name' },
    { id: 'symbol', header: 'Symbol', width: 90, field: 'symbol' },
  ],
  searchPlaceholder: 'Search code, name…',
};

/** No dedicated purchase-uom API — shares sale UOM catalog in backend. */
export const PURCHASE_UOM_CONFIG: MasterListConfig = {
  ...SALE_UOM_CONFIG,
  title: 'Purchase Units',
  listNavKey: 'purchase-uom',
};

export const CUSTOMER_TYPES_CONFIG: MasterListConfig = {
  title: 'Party Types',
  listNavKey: 'customer-types',
  apiPath: 'customer-types',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: CODE_NAME_CRUD,
  columns: codeNameColumns(),
  searchPlaceholder: 'Search code, name…',
};

export const USERS_CONFIG: MasterListConfig = {
  title: 'Users',
  listNavKey: 'user-roles',
  apiPath: 'users',
  fetchMode: 'paged',
  apiCrud: true,
  crudKeyField: 'username',
  crudKeyMode: 'by-username',
  crudFields: [
    { key: 'username', label: 'Username', required: true },
    { key: 'password', label: 'Password', type: 'password', showOn: 'new' },
    { key: 'fullName', label: 'Full Name', required: true },
    { key: 'role', label: 'Role', required: true },
    { key: 'department', label: 'Department' },
    { key: 'email', label: 'Email' },
    { key: 'activeStatus', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { id: 'username', header: 'User', width: 120, field: 'username' },
    { id: 'fullName', header: 'Name', minWidth: 160, field: 'fullName' },
    { id: 'role', header: 'Role', width: 120, field: 'role' },
    { id: 'department', header: 'Department', width: 120, field: 'department' },
    { id: 'activeStatus', header: 'Active', width: 80, field: 'activeStatus' },
  ],
  searchPlaceholder: 'Search users…',
  searchFields: ['username', 'fullName', 'role', 'department'],
};

export const ROLE_MASTER_CONFIG: MasterListConfig = {
  title: 'Roles & Permissions',
  listNavKey: 'role-master',
  apiPath: 'roles',
  fetchMode: 'items-array',
  apiCrud: true,
  crudKeyField: '_id',
  crudKeyMode: 'by-id',
  crudFields: [
    { key: 'roleName', label: 'Role Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Active', type: 'boolean' },
  ],
  columns: [
    { id: 'roleName', header: 'Role', minWidth: 160, field: 'roleName' },
    { id: 'description', header: 'Description', minWidth: 200, field: 'description' },
    { id: 'isActive', header: 'Active', width: 80, field: 'isActive' },
  ],
  searchPlaceholder: 'Search roles…',
  searchFields: ['roleName', 'description'],
};

export const COMPANY_REGISTRATION_CONFIG: MasterListConfig = {
  title: 'Companies',
  listNavKey: 'company-registration',
  apiPath: 'companies',
  fetchMode: 'paged',
  apiCrud: true,
  crudFields: [
    { key: 'code', label: 'Code', required: true },
    { key: 'businessName', label: 'Business Name', required: true },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'logoText', label: 'Logo Text (fallback)' },
    { key: 'logoImage', label: 'Company Logo', type: 'image' },
    { key: 'isDefault', label: 'Default Company', type: 'boolean' },
  ],
  columns: [
    { id: 'code', header: 'Code', width: 100, field: 'code' },
    { id: 'businessName', header: 'Business Name', minWidth: 180, field: 'businessName' },
    { id: 'gstin', header: 'GSTIN', width: 140, field: 'gstin' },
    { id: 'phone', header: 'Phone', width: 120, field: 'phone' },
    { id: 'isDefault', header: 'Default', width: 80, field: 'isDefault' },
  ],
  searchPlaceholder: 'Search code, business name, GSTIN…',
  searchFields: ['code', 'businessName', 'gstin'],
};

export const PRODUCTION_ORDERS_CONFIG: MasterListConfig = {
  title: 'Work Orders',
  listNavKey: 'production-orders',
  apiPath: 'production-orders',
  fetchMode: 'paged',
  columns: [
    { id: 'productionNo', header: 'Job No', width: 90, field: 'productionNo' },
    { id: 'manufacturingItemName', header: 'Item', minWidth: 160, field: 'manufacturingItemName' },
    { id: 'finalQty', header: 'Qty', width: 80, field: 'finalQty' },
    { id: 'productionAmount', header: 'Amount', width: 110, field: 'productionAmount' },
    { id: 'status', header: 'Status', width: 110, field: 'status' },
  ],
  searchPlaceholder: 'Search job no, item, machine…',
};

export const FINANCIAL_YEARS_CONFIG: MasterListConfig = {
  title: 'Fiscal Years',
  listNavKey: 'financial-years',
  apiPath: 'financial-years',
  fetchMode: 'flat-array',
  columns: [
    { id: 'financialYearName', header: 'Year', width: 140, field: 'financialYearName' },
    { id: 'startDate', header: 'Start', width: 110, field: 'startDate' },
    { id: 'endDate', header: 'End', width: 110, field: 'endDate' },
    { id: 'isActive', header: 'Active', width: 80, field: 'isActive' },
    { id: 'closed', header: 'Closed', width: 80, field: 'closed' },
  ],
  searchPlaceholder: 'Search year name…',
  searchFields: ['financialYearName', 'databaseName'],
};

export const PAYROLL_EMPLOYEES_CONFIG: MasterListConfig = {
  title: 'Employees',
  listNavKey: 'payroll-employees',
  formNavKey: 'payroll-employee-form',
  crudEntity: 'payrollEmployee',
  apiPath: 'payroll-employees',
  crudKeyField: 'employeeCode',
  fetchMode: 'paged',
  columns: [
    { id: 'employeeCode', header: 'Code', width: 100, field: 'employeeCode' },
    { id: 'fullName', header: 'Name', minWidth: 160, field: 'fullName' },
    { id: 'employeeType', header: 'Type', width: 110, field: 'employeeType' },
    { id: 'monthlySalary', header: 'Monthly Salary', width: 120, field: 'monthlySalary' },
    { id: 'dailyWage', header: 'Daily Wage', width: 100, field: 'dailyWage' },
    { id: 'department', header: 'Department', width: 110, field: 'department' },
    { id: 'activeStatus', header: 'Active', width: 80, field: 'activeStatus' },
  ],
  searchPlaceholder: 'Search employee code, name…',
  searchFields: ['employeeCode', 'fullName', 'department'],
};

export const ATTENDANCE_CONFIG: MasterListConfig = {
  title: 'Time & Attendance',
  listNavKey: 'attendance',
  apiPath: 'attendance',
  fetchMode: 'paged',
  columns: [
    { id: 'employeeCode', header: 'Employee', width: 110, field: 'employeeCode' },
    { id: 'attendanceDate', header: 'Date', width: 110, field: 'attendanceDate' },
    { id: 'status', header: 'Status', width: 100, field: 'status' },
    { id: 'hoursWorked', header: 'Hours', width: 80, field: 'hoursWorked' },
    { id: 'remarks', header: 'Remarks', minWidth: 140, field: 'remarks' },
  ],
  searchPlaceholder: 'Filter via API refresh…',
};

export const PAYROLL_RUNS_CONFIG: MasterListConfig = {
  title: 'Payroll Runs',
  listNavKey: 'payroll-runs',
  apiPath: 'payroll-runs',
  fetchMode: 'paged',
  columns: [
    { id: 'runNo', header: 'Run No', width: 90, field: 'runNo' },
    { id: 'periodMonth', header: 'Period', width: 100, field: 'periodMonth' },
    { id: 'employeeCount', header: 'Employees', width: 100, field: 'employeeCount' },
    { id: 'totalNet', header: 'Net Pay', width: 110, field: 'totalNet' },
    { id: 'status', header: 'Status', width: 100, field: 'status' },
  ],
  searchPlaceholder: 'Search run no, period…',
  searchFields: ['runNo', 'periodMonth', 'status'],
};

export const STOCK_TRANSFER_CONFIG: MasterListConfig = {
  title: 'Transfers',
  listNavKey: 'stock-transfer',
  apiPath: 'stock-transfers',
  fetchMode: 'paged',
  columns: [
    { id: 'entryNo', header: 'Entry No', width: 110, field: 'entryNo' },
    { id: 'fromGodown', header: 'From', width: 120, field: 'fromGodown' },
    { id: 'toGodown', header: 'To', width: 120, field: 'toGodown' },
    { id: 'status', header: 'Status', width: 100, field: 'status' },
    { id: 'remark', header: 'Remark', minWidth: 140, field: 'remark' },
  ],
  searchPlaceholder: 'Search entry, godown…',
};

export const BOM_CONFIG: MasterListConfig = {
  title: 'Bill of Materials',
  listNavKey: 'bom',
  apiPath: 'boms',
  fetchMode: 'paged',
  columns: [
    { id: 'productCode', header: 'Product', width: 120, field: 'productCode' },
    { id: 'productName', header: 'Name', minWidth: 160, field: 'productName' },
    { id: 'revision', header: 'Revision', width: 90, field: 'revision' },
    { id: 'productionAmount', header: 'Amount', width: 110, field: 'productionAmount' },
    { id: 'status', header: 'Status', width: 90, field: 'status' },
  ],
  searchPlaceholder: 'Search product code, name…',
};
