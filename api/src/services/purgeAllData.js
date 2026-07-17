import { Account } from '../models/Account.js';
import { AppUser } from '../models/AppUser.js';
import { AssemblyType } from '../models/AssemblyType.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { BankEntry } from '../models/BankEntry.js';
import { Bom } from '../models/Bom.js';
import { CashEntry } from '../models/CashEntry.js';
import { Company } from '../models/Company.js';
import { Counter } from '../models/Counter.js';
import { CreditNote } from '../models/CreditNote.js';
import { CustomerType } from '../models/CustomerType.js';
import { DebitNote } from '../models/DebitNote.js';
import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { EditDeleteAuthLog } from '../models/EditDeleteAuthLog.js';
import { Grn } from '../models/Grn.js';
import { LedgerAccount } from '../models/LedgerAccount.js';
import { Machine } from '../models/Machine.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import { PayrollRun } from '../models/PayrollRun.js';
import { Product } from '../models/Product.js';
import { ProductMainGroup } from '../models/ProductMainGroup.js';
import { ProductSubGroup } from '../models/ProductSubGroup.js';
import { ProductType } from '../models/ProductType.js';
import { ProductionOrder } from '../models/ProductionOrder.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { PurchaseReturn } from '../models/PurchaseReturn.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { Role } from '../models/Role.js';
import { RoleMenuPermission } from '../models/RoleMenuPermission.js';
import { SaleUom } from '../models/SaleUom.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { SalesReturn } from '../models/SalesReturn.js';
import { StockTransfer } from '../models/StockTransfer.js';
import { TransactionDocument } from '../models/TransactionDocument.js';
import { Warehouse } from '../models/Warehouse.js';

/**
 * Delete order: children / transactional data first, then masters, then role security.
 * MongoDB does not enforce FKs; this order mirrors documented relationships.
 *
 * @type {{ key: string, label: string, model: import('mongoose').Model }[]}
 */
const DATA_COLLECTIONS = [
  // --- Phase 1: transactional / operational ---
  { key: 'transactionDocuments', label: 'Transaction documents', model: TransactionDocument },
  { key: 'stockTransfers', label: 'Stock transfers', model: StockTransfer },
  { key: 'productionorders', label: 'Production orders', model: ProductionOrder },

  { key: 'salesOrders', label: 'Sales orders', model: SalesOrder },
  { key: 'deliveryChallans', label: 'Delivery challans', model: DeliveryChallan },
  { key: 'salesInvoices', label: 'Sales invoices', model: SalesInvoice },
  { key: 'salesReturns', label: 'Sales returns', model: SalesReturn },

  { key: 'purchaseOrders', label: 'Purchase orders', model: PurchaseOrder },
  { key: 'grns', label: 'GRNs', model: Grn },
  { key: 'purchaseInvoices', label: 'Purchase invoices', model: PurchaseInvoice },
  { key: 'purchaseReturns', label: 'Purchase returns', model: PurchaseReturn },

  // Vouchers before payroll runs (runs store voucher numbers; receipts reference runNo)
  { key: 'paymentVouchers', label: 'Payment vouchers', model: PaymentVoucher },
  { key: 'receiptVouchers', label: 'Receipt vouchers', model: ReceiptVoucher },
  { key: 'creditNotes', label: 'Credit notes', model: CreditNote },
  { key: 'debitNotes', label: 'Debit notes', model: DebitNote },
  { key: 'cashEntries', label: 'Cash entries', model: CashEntry },
  { key: 'bankEntries', label: 'Bank entries', model: BankEntry },

  { key: 'payrollruns', label: 'Payroll runs', model: PayrollRun },
  { key: 'editdeleteauthlogs', label: 'Edit/delete auth logs', model: EditDeleteAuthLog },

  // Attendance references payrollemployees.employeeCode (not requested, but payroll-related)
  { key: 'attendancerecords', label: 'Attendance records', model: AttendanceRecord },

  // --- Phase 2: masters (children before parents) ---
  { key: 'boms', label: 'Bill of materials', model: Bom },
  { key: 'products', label: 'Products', model: Product },
  { key: 'accounts', label: 'Accounts', model: Account },
  { key: 'warehouses', label: 'Warehouses', model: Warehouse },
  { key: 'machines', label: 'Machines', model: Machine },
  { key: 'productTypes', label: 'Product types', model: ProductType },
  { key: 'productMainGroups', label: 'Product main groups', model: ProductMainGroup },
  { key: 'productSubGroups', label: 'Product sub groups', model: ProductSubGroup },
  { key: 'assemblyTypes', label: 'Assembly types', model: AssemblyType },
  { key: 'saleUoms', label: 'Sale UOMs', model: SaleUom },
  { key: 'customerTypes', label: 'Customer types', model: CustomerType },
  { key: 'ledgeraccounts', label: 'Ledger accounts', model: LedgerAccount },
  { key: 'payrollemployees', label: 'Payroll employees', model: PayrollEmployee },

  { key: 'appUsers', label: 'Users', model: AppUser },
  { key: 'companies', label: 'Companies', model: Company },
  { key: 'counters', label: 'Document counters', model: Counter },

  // --- Phase 3: role security (config connection collections) ---
  { key: 'roleMenuPermissions', label: 'Role menu permissions', model: RoleMenuPermission },
  { key: 'Role_Master', label: 'Roles', model: Role }
];

export const PURGE_CONFIRM_PHRASE = 'DELETE ALL IMS DATA';

export async function getDataSummary() {
  const collections = {};
  let totalRecords = 0;

  for (const { key, label, model } of DATA_COLLECTIONS) {
    const count = await model.countDocuments();
    collections[key] = { label, count };
    totalRecords += count;
  }

  return { totalRecords, collections };
}

export async function purgeAllData() {
  const deleted = {};
  let totalDeleted = 0;

  for (const { key, label, model } of DATA_COLLECTIONS) {
    try {
      const result = await model.deleteMany({});
      const count = result.deletedCount ?? 0;
      deleted[key] = { label, count };
      totalDeleted += count;
    } catch (err) {
      console.error(`[purgeAllData] Failed deleting "${key}" (${label}):`, err);
      err.purgeContext = { key, label, deletedSoFar: deleted, totalDeleted };
      throw err;
    }
  }

  return { totalDeleted, deleted };
}