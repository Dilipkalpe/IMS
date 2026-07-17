import * as fieldRepo from '../repositories/fieldRegistryRepository.js';
import { TRANSACTION_TYPES } from '../constants/transactionTypes.js';

export async function getRegistryForTransaction(transactionType) {
  const fields = await fieldRepo.findFieldsForTransactionType(transactionType);
  return {
    transactionType,
    fields: fields.map((f) => ({
      fieldKey: f.fieldKey,
      displayLabel: f.displayLabel,
      token: f.token,
      category: f.category,
      dataPath: f.dataPath,
      controlTypes: f.controlTypes
    }))
  };
}

export async function getDesignerCatalog() {
  return {
    transactionTypes: TRANSACTION_TYPES,
    controlTypes: [
      { key: 'text', label: 'Text' },
      { key: 'dynamicText', label: 'Dynamic Text' },
      { key: 'image', label: 'Image' },
      { key: 'companyLogo', label: 'Company Logo' },
      { key: 'line', label: 'Line' },
      { key: 'rectangle', label: 'Rectangle' },
      { key: 'table', label: 'Table' },
      { key: 'barcode', label: 'Barcode' },
      { key: 'qrcode', label: 'QR Code' }
    ]
  };
}
