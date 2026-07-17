import * as partyPrefRepo from '../repositories/partyPreferenceRepository.js';
import * as reportFormatRepo from '../repositories/reportFormatRepository.js';

export async function setCustomerFormatMapping({ customerCode, transactionType, reportFormatId }) {
  const format = await reportFormatRepo.findReportFormatById(reportFormatId);
  if (!format) {
    const err = new Error('Report format not found.');
    err.status = 404;
    throw err;
  }
  return partyPrefRepo.upsertCustomerPreference({
    customerCode,
    transactionType: String(transactionType).trim().toLowerCase(),
    reportFormatId: format._id
  });
}

export async function setSupplierFormatMapping({ supplierCode, transactionType, reportFormatId }) {
  const format = await reportFormatRepo.findReportFormatById(reportFormatId);
  if (!format) {
    const err = new Error('Report format not found.');
    err.status = 404;
    throw err;
  }
  return partyPrefRepo.upsertSupplierPreference({
    supplierCode,
    transactionType: String(transactionType).trim().toLowerCase(),
    reportFormatId: format._id
  });
}
