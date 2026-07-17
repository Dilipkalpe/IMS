import { bomLineRef } from '../constants/materialStages.js';
import { createStageEvent } from '../services/materialTracking.js';
import { machines } from './mastersData.js';

const OPERATORS = [
  { id: 'EMP-1004', name: 'Store Keeper' },
  { id: 'EMP-1001', name: 'John Smith' },
  { id: 'EMP-1003', name: 'Kavita Mehta' }
];

/** Finished-good BOM recipes keyed by product code. */
const BOM_RECIPES = {
  'FG-5001': {
    rawMaterials: [
      { itemCode: 'RM-1001', itemName: 'Steel Sheet 2mm', unit: 'KG', qty: 5, rate: 70 },
      { itemCode: 'CP-2040', itemName: 'Motor Housing', unit: 'EA', qty: 1, rate: 350 },
      { itemCode: 'CP-2041', itemName: 'Bearing Assembly 6205', unit: 'EA', qty: 2, rate: 72 }
    ],
    consumables: [
      { material: 'Hydraulic Oil 20L', qty: 0.5, rate: 1520 },
      { material: 'Welding flux', qty: 0.2, rate: 120 }
    ]
  },
  'FG-5002': {
    rawMaterials: [
      { itemCode: 'RM-1002', itemName: 'Aluminium Rod 12mm', unit: 'KG', qty: 8, rate: 175 },
      { itemCode: 'CP-2040', itemName: 'Motor Housing', unit: 'EA', qty: 1, rate: 350 },
      { itemCode: 'EL-1100', itemName: 'Control Panel Unit', unit: 'EA', qty: 1, rate: 7400 }
    ],
    consumables: [
      { material: 'Hydraulic Oil 20L', qty: 0.75, rate: 1520 }
    ]
  },
  '10001': {
    rawMaterials: [
      { itemCode: 'RM-1001', itemName: 'Steel Sheet 2mm', unit: 'KG', qty: 1.5, rate: 70 },
      { itemCode: 'PEN', itemName: 'Ball Pen Blue', unit: 'EA', qty: 2, rate: 8 }
    ],
    consumables: []
  },
  '10002': {
    rawMaterials: [
      { itemCode: 'RM-1002', itemName: 'Aluminium Rod 12mm', unit: 'KG', qty: 2, rate: 175 },
      { itemCode: 'CP-2041', itemName: 'Bearing Assembly 6205', unit: 'EA', qty: 1, rate: 72 }
    ],
    consumables: [
      { material: 'Shop consumables', qty: 1, rate: 45 }
    ]
  },
  '10003': {
    rawMaterials: [
      { itemCode: 'RM-1001', itemName: 'Steel Sheet 2mm', unit: 'KG', qty: 5, rate: 70 },
      { itemCode: 'CP-2040', itemName: 'Motor Housing', unit: 'EA', qty: 1, rate: 350 },
      { itemCode: 'CP-2041', itemName: 'Bearing Assembly 6205', unit: 'EA', qty: 2, rate: 72 }
    ],
    consumables: [
      { material: 'Hydraulic Oil 20L', qty: 0.5, rate: 1520 }
    ]
  }
};

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function buildBomLines(recipe, standardQty = 1) {
  const rawMaterials = recipe.rawMaterials.map((line, idx) => {
    const amount = roundMoney(line.qty * line.rate);
    return {
      srNo: idx + 1,
      itemId: line.itemCode,
      itemCode: line.itemCode,
      itemName: line.itemName,
      unit: line.unit,
      qty: line.qty,
      scrapPercent: 0,
      rate: line.rate,
      amount
    };
  });

  const consumables = recipe.consumables.map((line, idx) => {
    const amount = roundMoney(line.qty * line.rate);
    return {
      srNo: idx + 1,
      material: line.material,
      qty: line.qty,
      rate: line.rate,
      amount
    };
  });

  const rawTotal = rawMaterials.reduce((s, l) => s + l.amount, 0);
  const consumableTotal = consumables.reduce((s, l) => s + l.amount, 0);

  return {
    rawMaterials,
    consumables,
    rawMaterialAmount: rawTotal,
    productionAmount: roundMoney(rawTotal + consumableTotal),
    standardQty
  };
}

/**
 * @param {object[]} products
 */
export function generateBoms(products) {
  const finishedGoods = products.filter((p) => {
    const type = String(p.productType || p.category || '').toLowerCase();
    return type.includes('finished') || String(p.code || '').startsWith('FG-');
  });

  const boms = [];
  for (const product of finishedGoods) {
    const code = String(product.code).toUpperCase();
    const recipe = BOM_RECIPES[code];
    if (!recipe) continue;

    const lines = buildBomLines(recipe);
    boms.push({
      productId: code,
      productCode: code,
      productName: product.name,
      revision: 'Rev A',
      effectiveFrom: new Date('2024-01-01'),
      standardQty: 1,
      ...lines,
      status: 'active'
    });
  }

  return boms;
}

function expandProductionLines(bom, produceQty, productionDate, status) {
  const standardQty = Number(bom.standardQty) > 0 ? Number(bom.standardQty) : 1;
  const multiplier = produceQty / standardQty;
  const godown = 'Counter';
  const by = 'seed';

  const advanceStage = (lineKind, line, qty) => {
    const events = [
      createStageEvent('planned', { qty, by, godown, note: 'Expanded from BOM', at: productionDate })
    ];
    if (status === 'Completed') {
      events.push(
        createStageEvent('issued', { qty, by, godown: 'Main', note: 'Material issued', at: productionDate }),
        createStageEvent('consumed', { qty, by, godown: 'Production', note: 'Consumed in process', at: productionDate })
      );
      if (lineKind === 'raw') {
        events.push(
          createStageEvent('received', { qty: produceQty, by, godown, note: 'FG received', at: productionDate })
        );
        line.stage = 'received';
      } else {
        line.stage = 'consumed';
      }
    } else if (status === 'In Progress') {
      events.push(
        createStageEvent('issued', { qty, by, godown: 'Main', note: 'Material issued', at: productionDate }),
        createStageEvent('in_process', { qty, by, godown: 'Production', note: 'In production', at: productionDate })
      );
      line.stage = 'in_process';
    } else {
      line.stage = 'planned';
    }
    line.stageEvents = events;
    return line;
  };

  const rawMaterials = bom.rawMaterials.map((line) => {
    const reqQty = roundMoney((Number(line.qty) || 0) * multiplier);
    const rate = Number(line.rate) || 0;
    const srNo = line.srNo;
    const row = {
      srNo,
      bomLineRef: bomLineRef('raw', srNo),
      assignmentType: 'bom',
      stage: 'planned',
      stageEvents: [],
      itemId: line.itemCode || line.itemId,
      itemName: line.itemName,
      unit: line.unit,
      reqQty,
      availableQty: reqQty * 3,
      rate,
      amount: roundMoney(reqQty * rate)
    };
    return advanceStage('raw', row, reqQty);
  });

  const consumables = bom.consumables.map((line) => {
    const qty = roundMoney((Number(line.qty) || 0) * multiplier);
    const rate = Number(line.rate) || 0;
    const srNo = line.srNo;
    const row = {
      srNo,
      bomLineRef: bomLineRef('consumable', srNo),
      assignmentType: 'bom',
      stage: 'planned',
      stageEvents: [],
      material: line.material,
      qty,
      rate,
      amount: roundMoney(qty * rate)
    };
    return advanceStage('consumable', row, qty);
  });

  const rawTotal = rawMaterials.reduce((s, l) => s + l.amount, 0);
  const consumableTotal = consumables.reduce((s, l) => s + l.amount, 0);

  return {
    rawMaterials,
    consumables,
    rawMaterialAmount: rawTotal,
    productionAmount: roundMoney(rawTotal + consumableTotal)
  };
}

function resolveStatus(rng, productionDate, endDate) {
  const daysFromEnd = (endDate.getTime() - productionDate.getTime()) / (24 * 60 * 60 * 1000);
  if (daysFromEnd > 45) {
    return rng() < 0.05 ? 'Cancelled' : 'Completed';
  }
  if (daysFromEnd > 14) {
    const roll = rng();
    if (roll < 0.7) return 'Completed';
    if (roll < 0.9) return 'In Progress';
    return 'Open';
  }
  const roll = rng();
  if (roll < 0.35) return 'Completed';
  if (roll < 0.65) return 'In Progress';
  return 'Open';
}

/**
 * @param {number} count
 * @param {{ rng: Function, boms: object[], startDate: Date, endDate: Date, randomDateInRange: Function }} ctx
 * @param {number} [offset]
 * @param {object[]} [bomsOverride]
 */
export function generateProductionOrders(count, ctx, offset = 0, bomsOverride) {
  const { rng, startDate, endDate, randomDateInRange } = ctx;
  const boms = bomsOverride ?? ctx.boms ?? [];
  if (!boms.length) return { productionOrders: [], productionNo: offset };

  const orders = [];
  let productionNo = offset;

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const bom = boms[idx % boms.length];
    const productionDate = randomDateInRange(rng, startDate, endDate);
    const status = resolveStatus(rng, productionDate, endDate);
    const machine = machines[idx % machines.length];
    const operator = OPERATORS[idx % OPERATORS.length];
    const produceQty = 1 + (idx % 8);
    const rejectedQty = status === 'Completed' && idx % 11 === 0 ? 1 : 0;
    const finalQty = Math.max(0, produceQty - rejectedQty);
    const expanded = expandProductionLines(bom, produceQty, productionDate, status);

    const startHour = 8 + (idx % 4);
    const duration = 120 + (idx % 180);
    const endHour = startHour + Math.floor(duration / 60);

    productionNo += 1;
    orders.push({
      productionNo,
      productionDate,
      manufacturingItemId: bom.productCode,
      manufacturingItemName: bom.productName,
      bomProductCode: bom.productCode,
      bomRevision: bom.revision || 'Rev A',
      machineCode: machine.code,
      machineName: machine.name,
      operatorId: operator.id,
      operatorName: operator.name,
      startTimeText: `${String(startHour).padStart(2, '0')}:00`,
      endTimeText: status === 'Open' ? '' : `${String(Math.min(endHour, 20)).padStart(2, '0')}:30`,
      totalDurationMinutes: status === 'Open' ? 0 : duration,
      produceQty,
      rejectedQty,
      finalQty,
      fromGodown: 'Counter',
      rawMaterialAmount: expanded.rawMaterialAmount,
      productionAmount: expanded.productionAmount,
      rawMaterials: expanded.rawMaterials,
      consumables: expanded.consumables,
      issueTransferEntryNo: status === 'Completed' || status === 'In Progress' ? `ST-ISS-${productionNo}` : '',
      receiptTransferEntryNo: status === 'Completed' ? `ST-RCV-${productionNo}` : '',
      status
    });
  }

  return { productionOrders: orders, productionNo };
}

export const generateProductionOrdersSlice = generateProductionOrders;
