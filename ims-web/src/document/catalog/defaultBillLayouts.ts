import type { BillLayoutJson } from '../contracts/billLayout';
import type { DocumentTypeKey } from '../contracts/documentTypes';

const baseItemColumns = () => [
  { key: 'srNo', header: 'Sr', visible: true, width: 36, align: 'center' },
  { key: 'itemCode', header: 'Item Code', visible: true, width: 72, align: 'left' },
  { key: 'hsnCode', header: 'HSN', visible: true, width: 56, align: 'center' },
  { key: 'description', header: 'Description', visible: true, width: 140, align: 'left' },
  { key: 'qty', header: 'Qty', visible: true, width: 48, align: 'right' },
  { key: 'rate', header: 'Rate', visible: true, width: 56, align: 'right' },
  { key: 'discount', header: 'Disc %', visible: true, width: 48, align: 'right' },
  { key: 'gstPercent', header: 'GST %', visible: true, width: 48, align: 'right' },
  { key: 'amount', header: 'Amount', visible: true, width: 64, align: 'right' },
];

const baseSections = () => [
  {
    id: 'header',
    type: 'header',
    label: 'Header',
    visible: true,
    order: 0,
    x: 0,
    y: 0,
    width: 100,
    height: 6,
    align: 'center',
    fontSizePt: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    showBorder: false,
    text: '{{documentTitle}}',
  },
  {
    id: 'companyDetails',
    type: 'companyDetails',
    label: 'Company Details',
    visible: true,
    order: 2,
    x: 0,
    y: 6,
    width: 70,
    height: 14,
    align: 'left',
    fontSizePt: 10,
    showBorder: true,
    showGstin: true,
    showPhone: true,
    showAddress: true,
  },
  {
    id: 'customerDetails',
    type: 'customerDetails',
    label: 'Customer Details',
    visible: true,
    order: 3,
    x: 0,
    y: 22,
    width: 100,
    height: 12,
    align: 'left',
    fontSizePt: 10,
    showBorder: true,
  },
  {
    id: 'itemTable',
    type: 'itemTable',
    label: 'Item Table',
    visible: true,
    order: 4,
    x: 0,
    y: 36,
    width: 100,
    height: 32,
    showBorder: true,
    headerBackground: '#5c4033',
    headerTextColor: '#ffffff',
  },
  {
    id: 'taxDetails',
    type: 'taxDetails',
    label: 'Tax Details',
    visible: true,
    order: 5,
    x: 55,
    y: 70,
    width: 45,
    height: 12,
    align: 'right',
    fontSizePt: 10,
    showBorder: true,
    showCgst: true,
    showSgst: true,
    showIgst: true,
    showRoundOff: true,
  },
  {
    id: 'termsAndConditions',
    type: 'termsAndConditions',
    label: 'Terms & Conditions',
    visible: true,
    order: 6,
    x: 0,
    y: 84,
    width: 100,
    height: 8,
    align: 'left',
    fontSizePt: 9,
    showBorder: false,
    text: 'Goods once sold will not be taken back. Subject to local jurisdiction.',
  },
  {
    id: 'footer',
    type: 'footer',
    label: 'Footer',
    visible: true,
    order: 7,
    x: 0,
    y: 92,
    width: 100,
    height: 6,
    align: 'center',
    fontSizePt: 9,
    showBorder: false,
    text: 'Thank you for your business.',
  },
];

function buildLayout(
  pageOverrides: Partial<BillLayoutJson['page']> = {},
  themeOverrides: Partial<BillLayoutJson['theme']> = {},
): BillLayoutJson {
  return {
    version: 1,
    page: {
      sizeKey: 'A4',
      widthMm: 210,
      heightMm: 297,
      orientation: 'portrait',
      marginMm: { top: 12, right: 12, bottom: 12, left: 12 },
      ...pageOverrides,
    },
    theme: {
      fontFamily: 'Segoe UI',
      baseFontSizePt: 11,
      primaryColor: '#5c4033',
      textColor: '#000000',
      borderColor: '#333333',
      showBorders: true,
      ...themeOverrides,
    },
    sections: baseSections(),
    itemTable: {
      visible: true,
      showHeader: true,
      borderThickness: 1,
      columns: baseItemColumns(),
    },
  };
}

export interface FallbackBillTemplate {
  templateKey: string;
  name: string;
  description: string;
  isDefault: boolean;
  appliesToDocTypes: DocumentTypeKey[];
  layoutJson: BillLayoutJson;
}

/** Client fallback when /api/sales-bill-templates is unavailable (mirrors API seeds). */
export const FALLBACK_BILL_TEMPLATES: FallbackBillTemplate[] = [
  {
    templateKey: 'default',
    name: 'Default',
    description: 'Standard A4 tax invoice',
    isDefault: true,
    appliesToDocTypes: ['sales_invoice', 'sales_order', 'delivery_challan', 'sales_return', 'quotation'],
    layoutJson: buildLayout(),
  },
  {
    templateKey: 'gst_invoice',
    name: 'GST Invoice',
    description: 'GST-compliant invoice',
    isDefault: false,
    appliesToDocTypes: ['sales_invoice'],
    layoutJson: buildLayout({}, { primaryColor: '#7c2d12', showBorders: true }),
  },
  {
    templateKey: 'thermal',
    name: 'Thermal Print',
    description: '80 mm thermal receipt',
    isDefault: false,
    appliesToDocTypes: ['sales_invoice', 'sales_order'],
    layoutJson: buildLayout(
      {
        sizeKey: 'Thermal80',
        widthMm: 80,
        heightMm: 297,
        marginMm: { top: 2, right: 2, bottom: 2, left: 2 },
      },
      { baseFontSizePt: 8, primaryColor: '#000000', showBorders: false },
    ),
  },
];

export function getFallbackDefaultTemplate(docType: DocumentTypeKey): FallbackBillTemplate {
  const match =
    FALLBACK_BILL_TEMPLATES.find((t) => t.isDefault && t.appliesToDocTypes.includes(docType)) ??
    FALLBACK_BILL_TEMPLATES.find((t) => t.appliesToDocTypes.includes(docType)) ??
    FALLBACK_BILL_TEMPLATES[0];
  return match;
}
