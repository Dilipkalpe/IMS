import { SalesOrder } from '../models/SalesOrder.js';
import { toSalesOrderListItem } from './salesOrderListSummary.js';

const LIST_FIELDS =
  'soPrefix docNo formattedDocNo soDate billDate customer status totals lines';

const NATIVE_SORT = {
  sr: 'docNo',
  soNo: 'docNo',
  docNo: 'docNo',
  soDate: 'soDate',
  customer: 'customer',
  status: 'status'
};

const COMPUTED_SORT = new Set([
  'totalTaxable',
  'totalCgst',
  'totalSgst',
  'totalIgst',
  'totalDiscount',
  'salesAmt',
  'paidAmt',
  'balance'
]);

function toDouble(path) {
  return {
    $convert: {
      input: { $ifNull: [path, '0'] },
      to: 'double',
      onError: 0,
      onNull: 0
    }
  };
}

function lineTaxableExpr() {
  return {
    $max: [
      0,
      {
        $let: {
          vars: {
            gross: {
              $multiply: [toDouble('$$line.qty'), toDouble('$$line.rate')]
            },
            discVal: toDouble('$$line.discValue'),
            discPct: toDouble('$$line.discPercent')
          },
          in: {
            $subtract: [
              '$$gross',
              {
                $cond: [
                  { $gt: ['$$discVal', 0] },
                  '$$discVal',
                  { $multiply: ['$$gross', { $divide: ['$$discPct', 100] }] }
                ]
              }
            ]
          }
        }
      }
    ]
  };
}

function lineTaxAmountExpr() {
  return {
    $multiply: [lineTaxableExpr(), { $divide: [toDouble('$$line.taxPercent'), 100] }]
  };
}

function buildComputedSortFieldsStage() {
  return {
    $addFields: {
      __sortTaxable: {
        $sum: {
          $map: {
            input: { $ifNull: ['$lines', []] },
            as: 'line',
            in: lineTaxableExpr()
          }
        }
      },
      __sortDiscount: {
        $sum: {
          $map: {
            input: { $ifNull: ['$lines', []] },
            as: 'line',
            in: {
              $let: {
                vars: {
                  gross: {
                    $multiply: [toDouble('$$line.qty'), toDouble('$$line.rate')]
                  },
                  discVal: toDouble('$$line.discValue'),
                  discPct: toDouble('$$line.discPercent')
                },
                in: {
                  $cond: [
                    { $gt: ['$$discVal', 0] },
                    '$$discVal',
                    { $multiply: ['$$gross', { $divide: ['$$discPct', 100] }] }
                  ]
                }
              }
            }
          }
        }
      },
      __sortCgst: {
        $sum: {
          $map: {
            input: { $ifNull: ['$lines', []] },
            as: 'line',
            in: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $ifNull: ['$$line.taxType', 'GST'] },
                    regex: /IGST/i
                  }
                },
                0,
                { $divide: [lineTaxAmountExpr(), 2] }
              ]
            }
          }
        }
      },
      __sortSgst: {
        $sum: {
          $map: {
            input: { $ifNull: ['$lines', []] },
            as: 'line',
            in: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $ifNull: ['$$line.taxType', 'GST'] },
                    regex: /IGST/i
                  }
                },
                0,
                { $divide: [lineTaxAmountExpr(), 2] }
              ]
            }
          }
        }
      },
      __sortIgst: {
        $sum: {
          $map: {
            input: { $ifNull: ['$lines', []] },
            as: 'line',
            in: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $ifNull: ['$$line.taxType', 'GST'] },
                    regex: /IGST/i
                  }
                },
                lineTaxAmountExpr(),
                0
              ]
            }
          }
        }
      },
      __sortSale: {
        $let: {
          vars: {
            sale: toDouble('$totals.saleAmount'),
            order: toDouble('$totals.orderAmount'),
            net: toDouble('$totals.net'),
            gross: toDouble('$totals.gross')
          },
          in: {
            $cond: [
              { $gt: ['$$sale', 0] },
              '$$sale',
              {
                $cond: [
                  { $gt: ['$$order', 0] },
                  '$$order',
                  { $cond: [{ $gt: ['$$net', 0] }, '$$net', '$$gross'] }
                ]
              }
            ]
          }
        }
      },
      __sortReceivable: toDouble('$totals.receivableToCustomer')
    }
  };
}

function buildPaidBalanceStage() {
  return {
    $addFields: {
      __sortPaid: {
        $cond: [
          { $gt: ['$__sortReceivable', 0] },
          { $max: [0, { $subtract: ['$__sortSale', '$__sortReceivable'] }] },
          '$__sortSale'
        ]
      },
      __sortBalance: {
        $cond: [
          { $gt: ['$__sortReceivable', 0] },
          '$__sortReceivable',
          0
        ]
      }
    }
  };
}

function computedSortField(sortKey) {
  switch (sortKey) {
    case 'totalTaxable':
      return '__sortTaxable';
    case 'totalCgst':
      return '__sortCgst';
    case 'totalSgst':
      return '__sortSgst';
    case 'totalIgst':
      return '__sortIgst';
    case 'totalDiscount':
      return '__sortDiscount';
    case 'salesAmt':
      return '__sortSale';
    case 'paidAmt':
      return '__sortPaid';
    case 'balance':
      return '__sortBalance';
    default:
      return '__sortSale';
  }
}

function normalizeSortKey(sort) {
  const key = String(sort || '').trim();
  if (NATIVE_SORT[key] || COMPUTED_SORT.has(key)) return key;
  return 'docNo';
}

export function resolveSalesOrderSort(sort, sortDir) {
  const sortKey = normalizeSortKey(sort);
  const dir = String(sortDir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  if (NATIVE_SORT[sortKey]) {
    return { spec: { [NATIVE_SORT[sortKey]]: dir }, useAggregation: false };
  }
  return { spec: { [computedSortField(sortKey)]: dir, docNo: dir }, useAggregation: true };
}

export async function fetchSalesOrderListPage(filter, sort, sortDir, skip, limit) {
  const { spec, useAggregation } = resolveSalesOrderSort(sort, sortDir);

  if (!useAggregation) {
    return SalesOrder.find(filter)
      .select(LIST_FIELDS)
      .sort(spec)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  return SalesOrder.aggregate([
    { $match: filter },
    buildComputedSortFieldsStage(),
    buildPaidBalanceStage(),
    { $sort: spec },
    { $skip: skip },
    { $limit: limit }
  ]);
}

export async function fetchSalesOrderListResponse(filter, sort, sortDir, skip, limit) {
  const [docs, total] = await Promise.all([
    fetchSalesOrderListPage(filter, sort, sortDir, skip, limit),
    SalesOrder.countDocuments(filter)
  ]);
  return {
    items: docs.map(toSalesOrderListItem),
    total
  };
}
