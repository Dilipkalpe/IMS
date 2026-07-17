/** @typedef {import('mongoose').Types} Types */

/**
 * Default sales bill layout JSON (version 1).
 * Stored in SalesBillTemplate.layoutJson — designer and print renderer consume this shape.
 */
export const LAYOUT_VERSION = 1;

const baseItemColumns = () => [
  { key: 'srNo', header: 'Sr', visible: true, width: 36, align: 'center' },
  { key: 'itemCode', header: 'Item Code', visible: true, width: 72, align: 'left' },
  { key: 'hsnCode', header: 'HSN', visible: true, width: 56, align: 'center' },
  { key: 'description', header: 'Description', visible: true, width: 140, align: 'left' },
  { key: 'qty', header: 'Qty', visible: true, width: 48, align: 'right' },
  { key: 'rate', header: 'Rate', visible: true, width: 56, align: 'right' },
  { key: 'discount', header: 'Disc %', visible: true, width: 48, align: 'right' },
  { key: 'gstPercent', header: 'GST %', visible: true, width: 48, align: 'right' },
  { key: 'amount', header: 'Amount', visible: true, width: 64, align: 'right' }
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
    fontFamily: 'Segoe UI',
    fontSizePt: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    showBorder: false,
    text: '{{documentTitle}}'
  },
  {
    id: 'companyLogo',
    type: 'companyLogo',
    label: 'Company Logo',
    visible: true,
    order: 1,
    x: 72,
    y: 6,
    width: 28,
    height: 14,
    align: 'center',
    showBorder: true
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
    showAddress: true
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
    showBorder: true
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
    headerTextColor: '#ffffff'
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
    showRoundOff: true
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
    text: 'Goods once sold will not be taken back. Subject to local jurisdiction.'
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
    text: 'Thank you for your business.'
  }
];

/**
 * @param {object} pageOverrides
 * @param {object} themeOverrides
 * @param {object[]} [columnOverrides]
 * @param {object[]} [sectionOverrides]
 */
function buildLayout(pageOverrides = {}, themeOverrides = {}, columnOverrides, sectionOverrides) {
  const columns = columnOverrides ?? baseItemColumns();
  const sections = sectionOverrides ?? baseSections();
  return {
    version: LAYOUT_VERSION,
    page: {
      sizeKey: 'A4',
      widthMm: 210,
      heightMm: 297,
      orientation: 'portrait',
      marginMm: { top: 12, right: 12, bottom: 12, left: 12 },
      ...pageOverrides
    },
    theme: {
      fontFamily: 'Segoe UI',
      baseFontSizePt: 11,
      primaryColor: '#5c4033',
      textColor: '#000000',
      borderColor: '#333333',
      showBorders: true,
      ...themeOverrides
    },
    sections,
    itemTable: {
      visible: true,
      showHeader: true,
      borderThickness: 1,
      columns
    }
  };
}

/** @type {Array<{ templateKey: string, name: string, description: string, isSystem: boolean, isDefault: boolean, appliesToDocTypes: string[], layoutJson: object }>} */
export const DEFAULT_SALES_BILL_TEMPLATES = [
  {
    templateKey: 'default',
    name: 'Default',
    description: 'Standard A4 tax invoice with full company and GST blocks.',
    isSystem: true,
    isDefault: true,
    appliesToDocTypes: ['sales_invoice', 'sales_order', 'delivery_challan', 'sales_return'],
    layoutJson: buildLayout()
  },
  {
    templateKey: 'retail',
    name: 'Retail',
    description: 'Compact retail bill — hides HSN and discount columns.',
    isSystem: true,
    isDefault: false,
    appliesToDocTypes: ['sales_invoice', 'sales_order'],
    layoutJson: buildLayout(
      {},
      { primaryColor: '#2563eb' },
      baseItemColumns().map((c) => {
        if (c.key === 'hsnCode' || c.key === 'discount') return { ...c, visible: false };
        return c;
      })
    )
  },
  {
    templateKey: 'wholesale',
    name: 'Wholesale',
    description: 'Wholesale layout with all line columns and wider description.',
    isSystem: true,
    isDefault: false,
    appliesToDocTypes: ['sales_invoice', 'delivery_challan'],
    layoutJson: buildLayout(
      {},
      { primaryColor: '#0f766e' },
      baseItemColumns().map((c) =>
        c.key === 'description' ? { ...c, width: 180 } : c
      )
    )
  },
  {
    templateKey: 'gst_invoice',
    name: 'GST Invoice',
    description: 'GST-compliant invoice with tax breakdown section emphasized.',
    isSystem: true,
    isDefault: false,
    appliesToDocTypes: ['sales_invoice'],
    layoutJson: buildLayout(
      {},
      { primaryColor: '#7c2d12', showBorders: true },
      baseItemColumns().map((c) =>
        c.key === 'gstPercent' ? { ...c, visible: true, header: 'GST %' } : c
      ),
      baseSections().map((s) =>
        s.id === 'taxDetails' ? { ...s, height: 16, y: 68 } : s
      )
    )
  },
  {
    templateKey: 'thermal',
    name: 'Thermal Print',
    description: '80 mm thermal receipt — narrow page, minimal sections.',
    isSystem: true,
    isDefault: false,
    appliesToDocTypes: ['sales_invoice', 'sales_order'],
    layoutJson: buildLayout(
      {
        sizeKey: 'Thermal80',
        widthMm: 80,
        heightMm: 297,
        marginMm: { top: 2, right: 2, bottom: 2, left: 2 }
      },
      { baseFontSizePt: 8, primaryColor: '#000000', showBorders: false },
      baseItemColumns()
        .filter((c) => ['srNo', 'description', 'qty', 'rate', 'amount'].includes(c.key))
        .map((c) => ({ ...c, width: c.key === 'description' ? 90 : 40 })),
      baseSections()
        .filter((s) =>
          ['header', 'companyDetails', 'customerDetails', 'itemTable', 'taxDetails', 'footer'].includes(
            s.id
          )
        )
        .map((s) => {
          if (s.id === 'companyLogo') return { ...s, visible: false };
          return { ...s, width: 100, x: 0 };
        })
    )
  }
];

export function normalizeLayoutJson(layout) {
  if (!layout || typeof layout !== 'object') {
    throw new Error('layoutJson must be an object.');
  }
  const version = Number(layout.version) || LAYOUT_VERSION;
  if (!layout.page || typeof layout.page !== 'object') {
    throw new Error('layoutJson.page is required.');
  }
  if (!Array.isArray(layout.sections)) {
    throw new Error('layoutJson.sections must be an array.');
  }
  if (!layout.itemTable || typeof layout.itemTable !== 'object') {
    throw new Error('layoutJson.itemTable is required.');
  }
  return { ...layout, version };
}
