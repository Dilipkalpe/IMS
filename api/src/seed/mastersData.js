import { hashPassword } from '../services/auth.js';

export const DEFAULT_USER_PASSWORD = 'admin';
const defaultPasswordHash = hashPassword(DEFAULT_USER_PASSWORD);

export const ledgerAccounts = [
  { code: '3', name: 'Cash Account', kind: 'cash', openingBalance: 125000, openingBalanceType: 'Dr', activeStatus: true },
  { code: 'BANK', name: 'Current Account — IDBI', kind: 'bank', openingBalance: 850000, openingBalanceType: 'Dr', activeStatus: true },
  { code: 'SALES', name: 'Sales Account', kind: 'nominal', openingBalance: 0, openingBalanceType: 'Cr', activeStatus: true },
  { code: 'PURCHASE', name: 'Purchase Account', kind: 'nominal', openingBalance: 0, openingBalanceType: 'Dr', activeStatus: true }
];

export const products = [
  { code: 'RM-1001', name: 'Steel Sheet 2mm', category: 'Raw Material', unit: 'KG', salePrice: 85, purchasePrice: 70, stockQty: 2400, reorderQty: 500, productType: 'Raw Material', productMainGroup: 'Metals', taxPercent: '18', activeStatus: true },
  { code: 'RM-1002', name: 'Aluminium Rod 12mm', category: 'Raw Material', unit: 'KG', salePrice: 210, purchasePrice: 175, stockQty: 680, reorderQty: 200, productType: 'Raw Material', productMainGroup: 'Metals', taxPercent: '18', activeStatus: true },
  { code: 'CP-2040', name: 'Motor Housing', category: 'Component', unit: 'EA', salePrice: 420, purchasePrice: 350, stockQty: 185, reorderQty: 40, productType: 'Component', productMainGroup: 'Mechanical', taxPercent: '18', activeStatus: true },
  { code: 'CP-2041', name: 'Bearing Assembly 6205', category: 'Component', unit: 'EA', salePrice: 95, purchasePrice: 72, stockQty: 420, reorderQty: 100, productType: 'Component', productMainGroup: 'Mechanical', taxPercent: '18', activeStatus: true },
  { code: 'FG-5001', name: 'Industrial Pump A1', category: 'Finished Good', unit: 'EA', salePrice: 2450, purchasePrice: 2100, stockQty: 62, reorderQty: 15, productType: 'Finished Good', productMainGroup: 'Mechanical', taxPercent: '18', activeStatus: true },
  { code: 'FG-5002', name: 'Centrifugal Pump B2', category: 'Finished Good', unit: 'EA', salePrice: 3200, purchasePrice: 2750, stockQty: 38, reorderQty: 10, productType: 'Finished Good', productMainGroup: 'Mechanical', taxPercent: '18', activeStatus: true },
  { code: '10001', name: 'Sample Product A', category: 'Finished Good', unit: 'EA', salePrice: 150, purchasePrice: 120, stockQty: 890, reorderQty: 200, productType: 'Finished Good', productMainGroup: 'General', taxPercent: '18', activeStatus: true },
  { code: '10002', name: 'Sample Product B', category: 'Finished Good', unit: 'EA', salePrice: 320, purchasePrice: 260, stockQty: 310, reorderQty: 80, productType: 'Finished Good', productMainGroup: 'General', taxPercent: '18', activeStatus: true },
  { code: '10003', name: 'Industrial Pump FG-5001', category: 'Finished Good', unit: 'EA', salePrice: 2450, purchasePrice: 2100, stockQty: 45, reorderQty: 12, productType: 'Finished Good', productMainGroup: 'Mechanical', taxPercent: '18', activeStatus: true },
  { code: 'PEN', name: 'Ball Pen Blue', category: 'General', unit: 'EA', salePrice: 12.5, purchasePrice: 8, stockQty: 1800, reorderQty: 400, productType: 'Consumable', productMainGroup: 'General', taxPercent: '12', activeStatus: true },
  { code: 'CV-3300', name: 'Hydraulic Oil 20L', category: 'Consumable', unit: 'LTR', salePrice: 1850, purchasePrice: 1520, stockQty: 95, reorderQty: 25, productType: 'Consumable', productMainGroup: 'General', taxPercent: '18', activeStatus: true },
  { code: 'EL-1100', name: 'Control Panel Unit', category: 'Component', unit: 'EA', salePrice: 8900, purchasePrice: 7400, stockQty: 12, reorderQty: 5, productType: 'Component', productMainGroup: 'Electrical', taxPercent: '18', activeStatus: true },
  { code: 'RM-LOW', name: 'Copper Wire 2.5mm', category: 'Raw Material', unit: 'KG', salePrice: 780, purchasePrice: 650, stockQty: 18, reorderQty: 50, productType: 'Raw Material', productMainGroup: 'Metals', taxPercent: '18', activeStatus: true }
];

export const accounts = [
  { accountType: 'customer', code: 'CUS-001', name: 'North Industries', customerType: 'Customer', creditDays: 30, creditLimit: 500000, activeStatus: true },
  { accountType: 'customer', code: 'CUS-002', name: 'Delta Manufacturing', customerType: 'Customer', creditDays: 45, creditLimit: 750000, activeStatus: true },
  { accountType: 'customer', code: 'CUS-003', name: 'Pacific Utilities', customerType: 'Customer', creditDays: 30, creditLimit: 400000, activeStatus: true },
  { accountType: 'customer', code: 'CUS-004', name: 'Summit Corp', customerType: 'Customer', creditDays: 15, creditLimit: 300000, activeStatus: true },
  { accountType: 'customer', code: 'CUS-005', name: 'Metro Traders', customerType: 'Dealer', creditDays: 21, creditLimit: 250000, activeStatus: true },
  { accountType: 'customer', code: 'CUS-006', name: 'Bright Retail LLP', customerType: 'Distributor', creditDays: 30, creditLimit: 200000, activeStatus: true },
  { accountType: 'supplier', code: 'SUP-001', name: 'Acme Metals Ltd', customerType: 'Supplier', creditDays: 30, creditLimit: 0, activeStatus: true },
  { accountType: 'supplier', code: 'SUP-002', name: 'Precision Parts Co', customerType: 'Supplier', creditDays: 45, creditLimit: 0, activeStatus: true },
  { accountType: 'supplier', code: 'SUP-003', name: 'Global Polymers', customerType: 'Supplier', creditDays: 30, creditLimit: 0, activeStatus: true },
  { accountType: 'supplier', code: 'SUP-004', name: 'Electro Components India', customerType: 'Supplier', creditDays: 21, creditLimit: 0, activeStatus: true }
];

export const warehouses = [
  { code: 'Counter', name: 'Counter', location: 'Shop floor', activeStatus: true },
  { code: 'Main', name: 'Main Godown', location: 'Warehouse A', activeStatus: true },
  { code: 'WH-B', name: 'Godown B', location: 'Warehouse B', activeStatus: true }
];

export const productTypes = [
  { code: 'PT-RM', name: 'Raw Material', description: 'Purchased inputs', activeStatus: true },
  { code: 'PT-CP', name: 'Component', description: 'Manufactured parts', activeStatus: true },
  { code: 'PT-FG', name: 'Finished Good', description: 'Sellable products', activeStatus: true },
  { code: 'PT-CV', name: 'Consumable', description: 'Shop floor supplies', activeStatus: true }
];

export const productMainGroups = [
  { code: 'MG-MTL', name: 'Metals', description: 'Metal stock and parts', activeStatus: true },
  { code: 'MG-PLS', name: 'Plastics', description: 'Polymer materials', activeStatus: true },
  { code: 'MG-ELC', name: 'Electrical', description: 'Electrical components', activeStatus: true },
  { code: 'MG-MCH', name: 'Mechanical', description: 'Mechanical assemblies', activeStatus: true },
  { code: 'MG-GEN', name: 'General', description: 'Miscellaneous', activeStatus: true }
];

export const productSubGroups = [
  { code: 'SG-SHT', name: 'Sheet', mainGroup: 'Metals', activeStatus: true },
  { code: 'SG-ROD', name: 'Rod', mainGroup: 'Metals', activeStatus: true },
  { code: 'SG-HSG', name: 'Housing', mainGroup: 'Mechanical', activeStatus: true },
  { code: 'SG-FST', name: 'Fastener', mainGroup: 'General', activeStatus: true },
  { code: 'SG-OTH', name: 'Other', mainGroup: 'General', activeStatus: false }
];

export const saleUoms = [
  { code: 'UOM-EA', name: 'Each', symbol: 'EA', decimals: 0, activeStatus: true },
  { code: 'UOM-KG', name: 'Kilogram', symbol: 'KG', decimals: 2, activeStatus: true },
  { code: 'UOM-LTR', name: 'Litre', symbol: 'L', decimals: 2, activeStatus: true },
  { code: 'UOM-MTR', name: 'Metre', symbol: 'm', decimals: 2, activeStatus: true },
  { code: 'UOM-BOX', name: 'Box', symbol: 'BOX', decimals: 0, activeStatus: true },
  { code: 'UOM-SET', name: 'Set', symbol: 'SET', decimals: 0, activeStatus: true }
];

export const appUsers = [
  { employeeId: 'EMP-ADMIN', username: 'admin', fullName: 'System Administrator', role: 'Administrator', department: 'Administration', email: 'admin@ims.local', activeStatus: true, passwordHash: defaultPasswordHash },
  { employeeId: 'EMP-1001', username: 'jsmith', fullName: 'John Smith', role: 'Manager', department: 'Sales', email: 'jsmith@ims.local', activeStatus: true, passwordHash: defaultPasswordHash },
  { employeeId: 'EMP-1002', username: 'rpillai', fullName: 'Rahul Pillai', role: 'Sales', department: 'Sales', email: 'rpillai@ims.local', activeStatus: true, passwordHash: defaultPasswordHash },
  { employeeId: 'EMP-1003', username: 'kmehta', fullName: 'Kavita Mehta', role: 'Purchase', department: 'Purchase', email: 'kmehta@ims.local', activeStatus: true, passwordHash: defaultPasswordHash },
  { employeeId: 'EMP-1004', username: 'astore', fullName: 'Store Keeper', role: 'Store', department: 'Inventory', email: 'store@ims.local', activeStatus: true, passwordHash: defaultPasswordHash },
  { employeeId: 'EMP-1005', username: 'finance', fullName: 'Finance User', role: 'Accounts', department: 'Finance', email: 'finance@ims.local', activeStatus: true, passwordHash: defaultPasswordHash },
  { employeeId: 'EMP-1006', username: 'viewer', fullName: 'Read Only User', role: 'Viewer', department: 'Administration', activeStatus: false, passwordHash: defaultPasswordHash }
];

export const customerTypes = [
  { code: 'CT-CUS', name: 'Customer', description: 'Standard customer account', activeStatus: true },
  { code: 'CT-SUP', name: 'Supplier', description: 'Vendor / supplier account', activeStatus: true },
  { code: 'CT-BTH', name: 'Customer & Supplier', description: 'Both customer and supplier', activeStatus: true },
  { code: 'CT-DLR', name: 'Dealer', description: 'Dealer channel partner', activeStatus: true },
  { code: 'CT-DST', name: 'Distributor', description: 'Distributor account', activeStatus: true },
  { code: 'CT-CSH', name: 'Cash', description: 'Cash ledger type', activeStatus: true },
  { code: 'CT-BNK', name: 'Bank', description: 'Bank account type', activeStatus: true },
  { code: 'CT-EXP', name: 'Expense', description: 'Expense account type', activeStatus: true }
];

export const assemblyTypes = [
  { code: 'AT-NON', name: 'None', description: 'No assembly', activeStatus: true },
  { code: 'AT-SUB', name: 'Sub-Assembly', description: 'Partial assembly', activeStatus: true },
  { code: 'AT-FIN', name: 'Final Assembly', description: 'Finished assembly', activeStatus: true }
];

export const machines = [
  { code: 'MCH-001', name: 'CNC Lathe #1', description: 'Production floor — bay 1', activeStatus: true },
  { code: 'MCH-002', name: 'Hydraulic Press', description: 'Assembly bay — press shop', activeStatus: true },
  { code: 'MCH-003', name: 'Assembly Line A', description: 'Final assembly line', activeStatus: true },
  { code: 'MCH-004', name: 'Welding Station', description: 'Fabrication area', activeStatus: true }
];

export const companies = [
  {
    code: 'RAJ',
    businessName: 'RAJ CLOTH CENTER',
    address: 'SHOP NO.3 SVY NO.50 GAJRAI COMPLEX NEAR BORAH COMPANY, NARHE, PUNE.',
    phone: '8421802210',
    email: 'demo@ims.local',
    gstin: '27ARDPP7668M1ZX',
    state: '27-Maharashtra',
    placeOfSupply: '27-Maharashtra',
    bankName: 'IDBI BANK',
    bankAccountNo: '1357102000002608',
    bankIfsc: 'IBKL0001357',
    bankAccountHolder: 'raj cloth center',
    logoText: 'Raj',
    terms: ['Goods sold will not be taken back.', 'Subject to Pune jurisdiction.', 'E. & O.E.'],
    isDefault: true,
    activeStatus: true
  }
];

export const SALESMEN = ['Rahul Sharma', 'Priya Patel', 'Amit Desai'];
export const BUYERS = ['Kavita Mehta', 'Rahul Pillai', 'Store Keeper'];
