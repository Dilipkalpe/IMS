const SORT_FIELDS = {
  sales_invoice: {
    col1: 'docNo',
    col2: 'customer',
    col4: 'invoiceDate',
    status: 'status',
    docNo: 'docNo',
    invoiceDate: 'invoiceDate',
    tranDate: 'invoiceDate'
  },
  delivery_challan: {
    col1: 'docNo',
    col2: 'customer',
    col4: 'dcDate',
    status: 'status',
    docNo: 'docNo',
    dcDate: 'dcDate',
    tranDate: 'dcDate'
  },
  sales_return: {
    col1: 'docNo',
    col2: 'customer',
    col4: 'returnDate',
    status: 'status',
    docNo: 'docNo',
    returnDate: 'returnDate',
    tranDate: 'returnDate'
  }
};

const DEFAULT_SORT = {
  sales_invoice: { invoiceDate: -1, docNo: -1 },
  delivery_challan: { dcDate: -1, docNo: -1 },
  sales_return: { returnDate: -1, docNo: -1 }
};

/**
 * @param {string} docTypeKey
 * @param {string} [sort]
 * @param {string} [sortDir]
 * @returns {Record<string, 1 | -1>}
 */
export function resolveNumberedSalesDocListSort(docTypeKey, sort, sortDir) {
  const defaults = DEFAULT_SORT[docTypeKey] ?? { docNo: -1 };
  if (!sort) return defaults;

  const fieldMap = SORT_FIELDS[docTypeKey] ?? SORT_FIELDS.sales_invoice;
  const key = String(sort).trim().toLowerCase();
  const mongoField = fieldMap[key];
  if (!mongoField) return defaults;

  const dir = String(sortDir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  return { [mongoField]: dir, docNo: dir };
}
