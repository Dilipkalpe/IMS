import { CustomerPrintPreference } from '../models/CustomerPrintPreference.js';
import { SupplierPrintPreference } from '../models/SupplierPrintPreference.js';

export async function findCustomerPreference(customerCode, transactionType) {
  return CustomerPrintPreference.findOne({
    customerCode: String(customerCode).trim().toUpperCase(),
    transactionType: String(transactionType).trim().toLowerCase(),
    isActive: true
  }).lean();
}

export async function upsertCustomerPreference({ customerCode, transactionType, reportFormatId }) {
  return CustomerPrintPreference.findOneAndUpdate(
    { customerCode: String(customerCode).trim().toUpperCase(), transactionType },
    { $set: { reportFormatId, isActive: true } },
    { upsert: true, new: true }
  ).lean();
}

export async function findSupplierPreference(supplierCode, transactionType) {
  return SupplierPrintPreference.findOne({
    supplierCode: String(supplierCode).trim().toUpperCase(),
    transactionType: String(transactionType).trim().toLowerCase(),
    isActive: true
  }).lean();
}

export async function upsertSupplierPreference({ supplierCode, transactionType, reportFormatId }) {
  return SupplierPrintPreference.findOneAndUpdate(
    { supplierCode: String(supplierCode).trim().toUpperCase(), transactionType },
    { $set: { reportFormatId, isActive: true } },
    { upsert: true, new: true }
  ).lean();
}
