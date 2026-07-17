import type { TransactionListQueryBase } from './transactionListQuery';

interface LocalListDocument {
  customer?: string;
  supplier?: string;
  formattedDocNo: string;
  docNo: number;
  status?: string;
  narration?: string;
}

export function applyLocalListQuery<T extends LocalListDocument>(
  items: T[],
  query: TransactionListQueryBase,
  options?: {
    getDate?: (item: T) => string;
    getAmount?: (item: T) => string;
    getPartyName?: (item: T) => string;
    getExtraSearchText?: (item: T) => string;
  },
): T[] {
  const partyName = (item: T) =>
    options?.getPartyName?.(item) ?? item.customer ?? item.supplier ?? '';
  let filtered = [...items];
  const term = query.search?.trim().toLowerCase();

  if (term) {
    filtered = filtered.filter(
      (d) =>
        partyName(d).toLowerCase().includes(term) ||
        d.formattedDocNo.toLowerCase().includes(term) ||
        String(d.docNo).includes(term) ||
        (d.narration ?? '').toLowerCase().includes(term) ||
        (options?.getExtraSearchText?.(d) ?? '').toLowerCase().includes(term),
    );
  }

  if (query.status && query.status !== 'All' && query.status !== '(All)') {
    const status = query.status.toLowerCase().replace(/\s+/g, '_');
    filtered = filtered.filter((d) => (d.status ?? '').toLowerCase() === status);
  }

  if (query.col1?.trim()) {
    const q = query.col1.trim().toLowerCase();
    filtered = filtered.filter(
      (d) => d.formattedDocNo.toLowerCase().includes(q) || String(d.docNo).includes(q),
    );
  }
  if (query.col2?.trim()) {
    const q = query.col2.trim().toLowerCase();
    filtered = filtered.filter((d) => partyName(d).toLowerCase().includes(q));
  }
  if (query.col3?.trim() && options?.getAmount) {
    const q = query.col3.trim().toLowerCase();
    filtered = filtered.filter((d) => options.getAmount!(d).toLowerCase().includes(q));
  }
  if (query.col4?.trim()) {
    const q = query.col4.trim().toLowerCase();
    filtered = filtered.filter((d) => (d.status ?? '').toLowerCase().includes(q));
  }
  if (query.col5?.trim() && options?.getDate) {
    const q = query.col5.trim().toLowerCase();
    filtered = filtered.filter((d) => options.getDate!(d).toLowerCase().includes(q));
  }

  const sortField = query.sort ?? 'docNo';
  const dir = query.sortDir === 'asc' ? 1 : -1;

  filtered.sort((a, b) => {
    let av: string | number = '';
    let bv: string | number = '';

    switch (sortField) {
      case 'customer':
      case 'supplier':
      case 'col2':
        av = partyName(a);
        bv = partyName(b);
        break;
      case 'soDate':
      case 'quoteDate':
      case 'invoiceDate':
      case 'dcDate':
      case 'returnDate':
      case 'poDate':
      case 'grnDate':
      case 'col4':
        av = options?.getDate?.(a) ?? '';
        bv = options?.getDate?.(b) ?? '';
        break;
      case 'status':
        av = a.status ?? '';
        bv = b.status ?? '';
        break;
      case 'salesAmt':
      case 'col3':
        av = parseFloat((options?.getAmount?.(a) ?? '0').replace(/,/g, '')) || 0;
        bv = parseFloat((options?.getAmount?.(b) ?? '0').replace(/,/g, '')) || 0;
        break;
      case 'docNo':
      case 'col1':
      default:
        av = a.docNo;
        bv = b.docNo;
        break;
    }

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv), undefined, { sensitivity: 'accent' }) * dir;
  });

  return filtered;
}
