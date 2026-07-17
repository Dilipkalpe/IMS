/**
 * Excel-style per-column filters (AND logic).
 * Query params: col1, col2, col3, col4, col5, status
 */

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function term(value) {
  const t = value === undefined || value === null ? '' : String(value).trim();
  return t.length > 0 ? t : null;
}

/**
 * @param {Record<string, unknown>} filter
 * @param {import('express').Request['query']} query
 * @param {'sales' | 'purchase'} kind
 */
export function applyColumnFilters(filter, query, kind = 'sales') {
  const and = [];
  const col1 = term(query.col1);
  const col2 = term(query.col2);
  const col3 = term(query.col3);
  const col4 = term(query.col4);
  const col5 = term(query.col5);
  const status = term(query.status);

  if (col1) {
    const num = Number(col1);
    const or = [
      { formattedDocNo: new RegExp(escapeRegex(col1), 'i') },
      { docPrefix: new RegExp(escapeRegex(col1), 'i') }
    ];
    if (!Number.isNaN(num)) or.push({ docNo: num });
    and.push({ $or: or });
  }

  if (col2) {
    const rx = new RegExp(escapeRegex(col2), 'i');
    if (kind === 'purchase') {
      and.push({
        $or: [{ supplier: rx }, { buyer: rx }]
      });
    } else {
      and.push({ customer: rx });
    }
  }

  if (col3) {
    const rx = new RegExp(escapeRegex(col3), 'i');
    and.push({
      $or: [
        { 'totals.saleAmount': rx },
        { 'totals.orderAmount': rx },
        { 'totals.totQty': rx },
        { 'totals.net': rx },
        { 'totals.gross': rx }
      ]
    });
  }

  if (col4) {
    and.push({ status: new RegExp(escapeRegex(col4), 'i') });
  }

  if (col5) {
    const rx = new RegExp(escapeRegex(col5), 'i');
    and.push({
      $or: [
        { billDate: rx },
        { narration: rx }
      ]
    });
  }

  if (status) {
    and.push({ status: new RegExp(escapeRegex(status), 'i') });
  }

  if (and.length === 0) return;

  if (filter.$and) filter.$and = filter.$and.concat(and);
  else filter.$and = and;
}
