/**
 * GST place-of-supply and interstate determination (WPF: GstEntrySummarySupport, IndianStates).
 * Kept separate from amount math so calculations.ts stays focused on line/total amounts.
 */

/** GST state options — mirrors IMS/Models/IndianStates.cs (code-name). */
export const INDIAN_STATE_OPTIONS = [
  '01-Jammu & Kashmir',
  '02-Himachal Pradesh',
  '03-Punjab',
  '04-Chandigarh',
  '05-Uttarakhand',
  '06-Haryana',
  '07-Delhi',
  '08-Rajasthan',
  '09-Uttar Pradesh',
  '10-Bihar',
  '11-Sikkim',
  '12-Arunachal Pradesh',
  '13-Nagaland',
  '14-Manipur',
  '15-Mizoram',
  '16-Tripura',
  '17-Meghalaya',
  '18-Assam',
  '19-West Bengal',
  '20-Jharkhand',
  '21-Odisha',
  '22-Chhattisgarh',
  '23-Madhya Pradesh',
  '24-Gujarat',
  '26-Dadra & Nagar Haveli and Daman & Diu',
  '27-Maharashtra',
  '28-Andhra Pradesh',
  '29-Karnataka',
  '30-Goa',
  '31-Lakshadweep',
  '32-Kerala',
  '33-Tamil Nadu',
  '34-Puducherry',
  '35-Andaman & Nicobar Islands',
  '36-Telangana',
  '37-Andhra Pradesh (New)',
  '38-Ladakh',
] as const;

const NAME_TO_CODE: Record<string, string> = {
  'jammu & kashmir': '01',
  'himachal pradesh': '02',
  punjab: '03',
  chandigarh: '04',
  uttarakhand: '05',
  haryana: '06',
  delhi: '07',
  rajasthan: '08',
  'uttar pradesh': '09',
  bihar: '10',
  sikkim: '11',
  'arunachal pradesh': '12',
  nagaland: '13',
  manipur: '14',
  mizoram: '15',
  tripura: '16',
  meghalaya: '17',
  assam: '18',
  'west bengal': '19',
  jharkhand: '20',
  odisha: '21',
  chhattisgarh: '22',
  'madhya pradesh': '23',
  gujarat: '24',
  'dadra & nagar haveli and daman & diu': '26',
  maharashtra: '27',
  'andhra pradesh': '28',
  karnataka: '29',
  goa: '30',
  lakshadweep: '31',
  kerala: '32',
  'tamil nadu': '33',
  puducherry: '34',
  'andaman & nicobar islands': '35',
  telangana: '36',
  'andhra pradesh (new)': '37',
  ladakh: '38',
};

/** First two characters of GSTIN are the state code (GST law). */
export function stateCodeFromGstin(gstin?: string): string {
  const g = (gstin ?? '').trim().toUpperCase();
  if (g.length < 2) return '';
  const code = g.slice(0, 2);
  return /^\d{2}$/.test(code) ? code : '';
}

/**
 * Resolves a 2-digit GST state code from place-of-supply text.
 * Supports `24-Gujarat`, bare `24`, or legacy bare state names.
 */
export function extractStateCode(value?: string): string {
  const text = (value ?? '').trim();
  if (!text) return '';

  const coded = text.match(/^(\d{2})\b/);
  if (coded) return coded[1];

  const hyphen = text.match(/^(\d{2})-/);
  if (hyphen) return hyphen[1];

  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  if (NAME_TO_CODE[normalized]) return NAME_TO_CODE[normalized];

  const afterHyphen = text.includes('-') ? text.split('-').slice(1).join('-').trim().toLowerCase() : normalized;
  if (NAME_TO_CODE[afterHyphen]) return NAME_TO_CODE[afterHyphen];

  return '';
}

export interface GstTaxContext {
  placeOfSupply: string;
  sellerGstin?: string;
  customerGstin?: string;
  /** Override company state when seller GSTIN is unavailable. */
  companyStateCode?: string;
}

export function resolveCompanyStateCode(context: GstTaxContext): string {
  if (context.companyStateCode?.trim()) {
    return extractStateCode(context.companyStateCode) || context.companyStateCode.trim().slice(0, 2);
  }
  const fromGstin = stateCodeFromGstin(context.sellerGstin);
  if (fromGstin) return fromGstin;
  return '24';
}

export function isInterStateSupply(context: GstTaxContext): boolean {
  const company = resolveCompanyStateCode(context);
  const supply = extractStateCode(context.placeOfSupply);
  if (!company || !supply) return false;
  return company !== supply;
}

export type GstValidationSeverity = 'error' | 'warning';

export interface GstValidationMessage {
  field?: string;
  severity: GstValidationSeverity;
  message: string;
}

export function validateGstTax(context: GstTaxContext): GstValidationMessage[] {
  const messages: GstValidationMessage[] = [];
  const pos = context.placeOfSupply?.trim() ?? '';

  if (!pos) {
    messages.push({
      field: 'placeOfSupply',
      severity: 'error',
      message: 'Place of supply is required for GST tax split.',
    });
    return messages;
  }

  const supplyCode = extractStateCode(pos);
  if (!supplyCode) {
    messages.push({
      field: 'placeOfSupply',
      severity: 'warning',
      message: 'Place of supply should use a GST state code (e.g. 24-Gujarat).',
    });
  }

  const customerGstin = context.customerGstin?.trim() ?? '';
  if (!customerGstin) {
    messages.push({
      field: 'customerGstin',
      severity: 'warning',
      message: 'Customer GSTIN is blank — treated as unregistered / B2C.',
    });
  } else if (customerGstin.length >= 2 && supplyCode) {
    const gstinState = stateCodeFromGstin(customerGstin);
    if (gstinState && gstinState !== supplyCode) {
      messages.push({
        field: 'customerGstin',
        severity: 'warning',
        message: `Customer GSTIN state (${gstinState}) differs from place of supply (${supplyCode}).`,
      });
    }
  }

  return messages;
}

export function gstContextFromHeader(header: {
  placeOfSupply: string;
  sellerGstin: string;
  customerGstin: string;
}): GstTaxContext {
  return {
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.sellerGstin,
    customerGstin: header.customerGstin,
  };
}
