export type BarcodeLabelSymbology = 'code128' | 'qrcode';

export type BarcodeLabelQuantitySource = 'purchase' | 'custom';

export interface BarcodeLabelFormat {
  id: string;
  displayName: string;
  description: string;
  widthMm: number;
  heightMm: number;
  columnsPerPage: number;
  rowsPerPage: number;
  labelsPerSheet?: number;
  suggestedUse?: string;
  recommended?: boolean;
}

export interface BarcodeLabelPrintOptions {
  format: BarcodeLabelFormat;
  symbology: BarcodeLabelSymbology;
  quantitySource: BarcodeLabelQuantitySource;
  customQuantityPerLine: number;
  copyMultiplier: number;
}

export interface BarcodeLabelItem {
  productCode: string;
  productName: string;
  barcodeValue: string;
  missingBarcode: boolean;
  batchNo?: string;
  mrp?: string;
  salesRate?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  purchaseInvoiceNo: string;
}

export interface BarcodeLabelPrintResult {
  labels: BarcodeLabelItem[];
  warnings: string[];
}
