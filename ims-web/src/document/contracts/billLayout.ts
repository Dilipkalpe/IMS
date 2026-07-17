/** Mirrors API SalesBillTemplate.layoutJson (salesBillTemplateDefaults.js). */

export interface BillLayoutPage {
  sizeKey: 'A4' | 'A5' | 'Thermal80' | 'Thermal58' | string;
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape' | string;
  marginMm: { top: number; right: number; bottom: number; left: number };
}

export interface BillLayoutTheme {
  fontFamily: string;
  baseFontSizePt: number;
  primaryColor: string;
  textColor: string;
  borderColor: string;
  showBorders: boolean;
}

export interface BillLayoutSection {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  align?: string;
  fontFamily?: string;
  fontSizePt?: number;
  fontWeight?: string;
  color?: string;
  showBorder?: boolean;
  text?: string;
  showGstin?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  showCgst?: boolean;
  showSgst?: boolean;
  showIgst?: boolean;
  showRoundOff?: boolean;
  headerBackground?: string;
  headerTextColor?: string;
}

export interface BillLayoutItemColumn {
  key: string;
  header: string;
  visible: boolean;
  width: number;
  align: 'left' | 'center' | 'right' | string;
}

export interface BillLayoutItemTable {
  visible: boolean;
  showHeader: boolean;
  borderThickness: number;
  columns: BillLayoutItemColumn[];
}

export interface BillLayoutJson {
  version: number;
  page: BillLayoutPage;
  theme: BillLayoutTheme;
  sections: BillLayoutSection[];
  itemTable: BillLayoutItemTable;
}

export interface BillFormatVisibilityRules {
  showLogo?: boolean;
  showGst?: boolean;
  showDiscount?: boolean;
  showTaxBreakup?: boolean;
  showBankDetails?: boolean;
  showQrCode?: boolean;
  showSignature?: boolean;
  showRate?: boolean;
  showAmountInWords?: boolean;
  showSupplierInfo?: boolean;
  showCustomerInfo?: boolean;
}

export interface BillFormatPrintSettings {
  printPreview?: boolean;
  autoPrintAfterSave?: boolean;
}
