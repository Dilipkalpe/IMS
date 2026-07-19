import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { getMachineByCode } from '../api/machines';
import {
  createProductionOrder,
  expandProductionBom,
  fetchNextProductionNo,
  getProductionOrderByNo,
  updateProductionOrder,
  type ProductionOrderConsumableLine,
  type ProductionOrderRawLine,
  type ProductionOrderRecord,
} from '../api/productionOrders';
import { getProductByCode, lookupProduct } from '../api/products';
import { createStockTransfer, type StockTransferRecord } from '../api/stockTransfers';
import { getUserByUsername } from '../api/users';
import { ProductBrowseDialog } from '../components/transaction/ProductBrowseDialog';
import type { SalesProductInfo } from '../components/transaction/salesProductPicker';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormSection } from '../components/form';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useWorkOrderNavIntent, type WorkOrderOpenIntent } from './context/WorkOrderNavIntent';
import { GODOWNS, formatMoney } from './WorkOrderListScreen';
import '../sales-invoice/sales-invoice.scss';
import './work-order.scss';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowLocalText(): string {
  return new Date().toLocaleString();
}

function parseDecimal(text: string): number {
  const normalized = text.replace(/,/g, '').trim();
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function formatQty(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function recalcFinalQty(produceQty: string, rejectedQty: string): string {
  const final = Math.max(0, parseDecimal(produceQty) - parseDecimal(rejectedQty));
  return formatQty(final);
}

function consumableTotal(lines: ProductionOrderConsumableLine[]): number {
  return lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

export function WorkOrderEntryScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useWorkOrderNavIntent();

  const [intent, setIntent] = useState<WorkOrderOpenIntent>({ type: 'new' });
  const [editProductionNo, setEditProductionNo] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [productionId, setProductionId] = useState('1');
  const [productionDate, setProductionDate] = useState(todayIso());
  const [manufacturingItemId, setManufacturingItemId] = useState('');
  const [manufacturingItemName, setManufacturingItemName] = useState('');
  const [bomRevision, setBomRevision] = useState('Rev A');
  const [machineCode, setMachineCode] = useState('');
  const [machineName, setMachineName] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [startTimeText, setStartTimeText] = useState('');
  const [endTimeText, setEndTimeText] = useState('');
  const [totalDurationMinutes, setTotalDurationMinutes] = useState('0');
  const [produceQty, setProduceQty] = useState('1');
  const [rejectedQty, setRejectedQty] = useState('0');
  const [finalQty, setFinalQty] = useState('1');
  const [fromGodown, setFromGodown] = useState<string>('Counter');
  const [rawMaterials, setRawMaterials] = useState<ProductionOrderRawLine[]>([]);
  const [consumables, setConsumables] = useState<ProductionOrderConsumableLine[]>([]);
  const [rawMaterialAmount, setRawMaterialAmount] = useState('0.00');
  const [consumableAmount, setConsumableAmount] = useState('0.00');
  const [productionAmount, setProductionAmount] = useState('0.00');
  const [status, setStatus] = useState('Open');

  const [productBrowseOpen, setProductBrowseOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiReady, setApiReady] = useState(true);

  const returnNavKey = intent.returnNavKey ?? 'production-orders';
  const pageTitle =
    editProductionNo == null ? 'New Job Work' : `Job Work #${editProductionNo}`;

  const applyFromDto = useCallback((order: ProductionOrderRecord) => {
    setProductionId(String(order.productionNo));
    setProductionDate(
      order.productionDate ? String(order.productionDate).slice(0, 10) : todayIso(),
    );
    setManufacturingItemId(order.manufacturingItemId ?? '');
    setManufacturingItemName(order.manufacturingItemName ?? '');
    setBomRevision(order.bomRevision ?? 'Rev A');
    setMachineCode(order.machineCode ?? '');
    setMachineName(order.machineName ?? '');
    setOperatorId(order.operatorId ?? '');
    setOperatorName(order.operatorName ?? '');
    setStartTimeText(order.startTimeText ?? '');
    setEndTimeText(order.endTimeText ?? '');
    setTotalDurationMinutes(formatQty(Number(order.totalDurationMinutes ?? 0)));
    setProduceQty(formatQty(Number(order.produceQty ?? 1)));
    setRejectedQty(formatQty(Number(order.rejectedQty ?? 0)));
    setFinalQty(formatQty(Number(order.finalQty ?? 1)));
    setFromGodown(order.fromGodown ?? 'Counter');
    setRawMaterialAmount(formatMoney(Number(order.rawMaterialAmount ?? 0)));
    setProductionAmount(formatMoney(Number(order.productionAmount ?? 0)));
    setConsumableAmount(formatMoney(consumableTotal(order.consumables ?? [])));
    setStatus(order.status ?? 'Open');
    setIsCompleted(String(order.status ?? '').toLowerCase() === 'completed');
    setRawMaterials([...(order.rawMaterials ?? [])].sort((a, b) => a.srNo - b.srNo));
    setConsumables([...(order.consumables ?? [])].sort((a, b) => a.srNo - b.srNo));
  }, []);

  const resetNewDraft = useCallback(async () => {
    setEditProductionNo(null);
    setIsCompleted(false);
    setStatus('Open');
    setProductionDate(todayIso());
    setManufacturingItemId('');
    setManufacturingItemName('');
    setBomRevision('Rev A');
    setMachineCode('');
    setMachineName('');
    setOperatorId('');
    setOperatorName('');
    setStartTimeText(nowLocalText());
    setEndTimeText(nowLocalText());
    setTotalDurationMinutes('0');
    setProduceQty('1');
    setRejectedQty('0');
    setFinalQty('1');
    setFromGodown('Counter');
    setRawMaterials([]);
    setConsumables([]);
    setRawMaterialAmount('0.00');
    setConsumableAmount('0.00');
    setProductionAmount('0.00');

    const apiUp = await probeApiHealth();
    setApiReady(apiUp);
    if (apiUp) {
      const nextNo = await fetchNextProductionNo();
      setProductionId(nextNo != null ? String(nextNo) : '1');
    } else {
      setProductionId('1');
    }
  }, []);

  const applyIntent = useCallback(
    async (next: WorkOrderOpenIntent) => {
      setIntent(next);
      setErrorMessage(null);
      setStatusMessage(null);

      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setErrorMessage('API is offline — work order features require the API server.');
      }

      if (next.type === 'edit') {
        setEditProductionNo(next.productionNo);
        if (apiUp) {
          const order = await getProductionOrderByNo(next.productionNo);
          if (order) {
            applyFromDto(order);
          } else {
            setErrorMessage(`Job Work #${next.productionNo} was not found.`);
          }
        }
      } else {
        await resetNewDraft();
      }

      setIsLoaded(true);
    },
    [applyFromDto, resetNewDraft],
  );

  useEffect(() => consumeOpenIntent(applyIntent), [applyIntent, consumeOpenIntent]);

  const handleProduceQtyChange = useCallback(
    (value: string) => {
      setProduceQty(value);
      setFinalQty(recalcFinalQty(value, rejectedQty));
    },
    [rejectedQty],
  );

  const handleRejectedQtyChange = useCallback(
    (value: string) => {
      setRejectedQty(value);
      setFinalQty(recalcFinalQty(produceQty, value));
    },
    [produceQty],
  );

  const applyManufacturingItem = useCallback((code: string, name: string) => {
    setManufacturingItemId(code);
    setManufacturingItemName(name);
  }, []);

  const lookupManufacturingItem = useCallback(async () => {
    const code = manufacturingItemId.trim();
    if (!code) {
      setProductBrowseOpen(true);
      return;
    }

    setErrorMessage(null);
    try {
      const product = await lookupProduct(code);
      if (!product) {
        setErrorMessage(`No product found for "${code}".`);
        setManufacturingItemName('');
        return;
      }
      applyManufacturingItem(product.code, product.name);
    } catch {
      try {
        const product = await getProductByCode(code);
        applyManufacturingItem(product.code, product.name);
      } catch {
        setErrorMessage(`No product found for "${code}".`);
        setManufacturingItemName('');
      }
    }
  }, [applyManufacturingItem, manufacturingItemId]);

  const onProductBrowseConfirm = useCallback(
    (products: SalesProductInfo[]) => {
      const first = products[0];
      if (first) applyManufacturingItem(first.code, first.name);
      setProductBrowseOpen(false);
    },
    [applyManufacturingItem],
  );

  const lookupOperator = useCallback(async () => {
    const username = operatorId.trim();
    if (!username) {
      setErrorMessage('Enter an operator username to look up.');
      return;
    }
    if (!apiReady) {
      setErrorMessage('API is not available to look up users.');
      return;
    }
    try {
      const user = await getUserByUsername(username);
      if (!user?.activeStatus) {
        setErrorMessage(`No active user found for "${username}".`);
        setOperatorName('');
        return;
      }
      setOperatorId(user.username);
      setOperatorName(user.fullName);
    } catch {
      setErrorMessage(`No active user found for "${username}".`);
      setOperatorName('');
    }
  }, [apiReady, operatorId]);

  const lookupMachine = useCallback(async () => {
    const code = machineCode.trim();
    if (!code) {
      setErrorMessage('Enter a machine code to look up.');
      return;
    }
    if (!apiReady) {
      setErrorMessage('API is not available to look up machines.');
      return;
    }
    try {
      const machine = await getMachineByCode(code);
      if (!machine?.activeStatus) {
        setErrorMessage(`No machine found for "${code}".`);
        setMachineName('');
        return;
      }
      setMachineCode(machine.code);
      setMachineName(machine.name);
    } catch {
      setErrorMessage(`No machine found for "${code}".`);
      setMachineName('');
    }
  }, [apiReady, machineCode]);

  const applyExpandedBom = useCallback(
    (expanded: {
      revision?: string;
      rawMaterials: ProductionOrderRawLine[];
      consumables: ProductionOrderConsumableLine[];
      rawMaterialAmount: number;
      productionAmount: number;
    }) => {
      if (expanded.revision) setBomRevision(expanded.revision);
      setRawMaterials([...expanded.rawMaterials].sort((a, b) => a.srNo - b.srNo));
      setConsumables([...expanded.consumables].sort((a, b) => a.srNo - b.srNo));
      setRawMaterialAmount(formatMoney(expanded.rawMaterialAmount));
      setProductionAmount(formatMoney(expanded.productionAmount));
      setConsumableAmount(formatMoney(consumableTotal(expanded.consumables)));
    },
    [],
  );

  const generateFromBom = useCallback(async () => {
    const productCode = manufacturingItemId.trim().toUpperCase();
    if (!productCode) {
      setErrorMessage('Select Manufacturing Item first.');
      return;
    }
    if (!apiReady) {
      setErrorMessage('API is not available. Start the API server to load BOM items.');
      return;
    }

    let qty = parseDecimal(produceQty);
    if (qty <= 0) qty = 1;

    setErrorMessage(null);
    const expanded = await expandProductionBom(productCode, qty);
    if (!expanded) {
      const openDesigner = window.confirm(
        `No BOM exists for ${productCode}. Open BOM list now?`,
      );
      if (openDesigner) navigate('bom');
      return;
    }

    applyExpandedBom(expanded);
    setStatusMessage('Items generated from BOM.');
  }, [apiReady, applyExpandedBom, manufacturingItemId, navigate, produceQty]);

  useEffect(() => {
    if (!isLoaded || isCompleted || rawMaterials.length === 0) return;
    const productCode = manufacturingItemId.trim().toUpperCase();
    if (!productCode) return;

    let qty = parseDecimal(produceQty);
    if (qty <= 0) qty = 1;

    const timer = window.setTimeout(() => {
      void expandProductionBom(productCode, qty).then((expanded) => {
        if (expanded) applyExpandedBom(expanded);
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    applyExpandedBom,
    isCompleted,
    isLoaded,
    manufacturingItemId,
    produceQty,
    rawMaterials.length,
  ]);

  const buildDto = useCallback(
    (productionNo: number): ProductionOrderRecord => ({
      productionNo,
      productionDate,
      manufacturingItemId: manufacturingItemId.trim(),
      manufacturingItemName: manufacturingItemName.trim(),
      bomProductCode: manufacturingItemId.trim().toUpperCase(),
      bomRevision,
      machineCode,
      machineName,
      operatorId,
      operatorName,
      startTimeText,
      endTimeText,
      totalDurationMinutes: parseDecimal(totalDurationMinutes),
      produceQty: parseDecimal(produceQty),
      rejectedQty: parseDecimal(rejectedQty),
      finalQty: parseDecimal(finalQty),
      fromGodown,
      rawMaterialAmount: parseDecimal(rawMaterialAmount),
      productionAmount: parseDecimal(productionAmount),
      status,
      rawMaterials,
      consumables,
    }),
    [
      bomRevision,
      consumables,
      endTimeText,
      finalQty,
      fromGodown,
      machineCode,
      machineName,
      manufacturingItemId,
      manufacturingItemName,
      operatorId,
      operatorName,
      produceQty,
      productionAmount,
      productionDate,
      rawMaterialAmount,
      rawMaterials,
      rejectedQty,
      startTimeText,
      status,
      totalDurationMinutes,
    ],
  );

  const buildIssueTransfer = useCallback(
    (productionNo: number): StockTransferRecord => {
      const lines = [];
      let sr = 1;
      for (const line of rawMaterials) {
        lines.push({
          srNo: sr++,
          productId: line.itemId,
          productCode: line.itemId,
          productName: line.itemName,
          batchNo: '',
          qty: String(line.reqQty),
          unit: line.unit ?? 'Nos',
        });
      }
      for (const line of consumables) {
        lines.push({
          srNo: sr++,
          productId: line.material,
          productCode: line.material,
          productName: line.material,
          batchNo: '',
          qty: String(line.qty),
          unit: 'Nos',
        });
      }
      return {
        entryNo: `PRD-${productionNo}-ISSUE`,
        fromGodown,
        toGodown: 'Production',
        transferDate: productionDate,
        remark: `Production issue — ${manufacturingItemId} ${manufacturingItemName}`.trim(),
        status: 'posted',
        lines,
      };
    },
    [consumables, fromGodown, manufacturingItemId, manufacturingItemName, productionDate, rawMaterials],
  );

  const buildReceiptTransfer = useCallback(
    (productionNo: number): StockTransferRecord => {
      let qty = parseDecimal(finalQty);
      if (qty <= 0) qty = parseDecimal(produceQty);
      if (qty <= 0) qty = 1;
      return {
        entryNo: `PRD-${productionNo}-RECEIPT`,
        fromGodown: 'Production',
        toGodown: fromGodown,
        transferDate: productionDate,
        remark: `Production receipt — ${manufacturingItemId} ${manufacturingItemName}`.trim(),
        status: 'posted',
        lines: [
          {
            srNo: 1,
            productId: manufacturingItemId,
            productCode: manufacturingItemId,
            productName: manufacturingItemName,
            batchNo: '',
            qty: String(qty),
            unit: 'Nos',
          },
        ],
      };
    },
    [
      finalQty,
      fromGodown,
      manufacturingItemId,
      manufacturingItemName,
      produceQty,
      productionDate,
    ],
  );

  const goBack = useCallback(() => {
    if (isCompleted) {
      navigate(returnNavKey);
      return;
    }

    const hasDraft =
      rawMaterials.length > 0 ||
      consumables.length > 0 ||
      manufacturingItemId.trim().length > 0;
    if (
      hasDraft &&
      !window.confirm('Discard changes and return to the job work list?')
    ) {
      return;
    }
    navigate(returnNavKey);
  }, [
    consumables.length,
    isCompleted,
    manufacturingItemId,
    navigate,
    rawMaterials.length,
    returnNavKey,
  ]);

  const save = useCallback(async () => {
    if (isCompleted) {
      setErrorMessage('This job work entry is already completed.');
      return;
    }
    if (!manufacturingItemId.trim()) {
      setErrorMessage('Select Manufacturing Item first.');
      return;
    }
    if (rawMaterials.length === 0 && consumables.length === 0) {
      setErrorMessage('Generate items from BOM before save.');
      return;
    }

    const shortQty = rawMaterials.find((line) => line.availableQty < line.reqQty);
    if (shortQty) {
      setErrorMessage(
        `Insufficient stock for ${shortQty.itemId}. Available: ${shortQty.availableQty.toFixed(2)}  Required: ${shortQty.reqQty.toFixed(2)}`,
      );
      return;
    }

    if (!apiReady) {
      setErrorMessage('API is not available.');
      return;
    }

    const productionNo = parseInt(productionId, 10);
    if (!Number.isFinite(productionNo) || productionNo <= 0) {
      setErrorMessage('Invalid job work number.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const dto = buildDto(productionNo);
      dto.status = 'In Progress';

      const issueTransfer = buildIssueTransfer(productionNo);
      const receiptTransfer = buildReceiptTransfer(productionNo);

      if (editProductionNo == null) {
        await createProductionOrder(dto);
      } else {
        await updateProductionOrder(productionNo, dto);
      }

      await createStockTransfer(issueTransfer);
      await createStockTransfer(receiptTransfer);

      dto.status = 'Completed';
      dto.issueTransferEntryNo = issueTransfer.entryNo;
      dto.receiptTransferEntryNo = receiptTransfer.entryNo;
      await updateProductionOrder(productionNo, dto);

      setStatusMessage(`Job Work #${productionNo} saved. Stock updated at ${fromGodown}.`);
      window.setTimeout(() => navigate(returnNavKey), 600);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, [
    apiReady,
    buildDto,
    buildIssueTransfer,
    buildReceiptTransfer,
    consumables.length,
    editProductionNo,
    fromGodown,
    isCompleted,
    manufacturingItemId,
    navigate,
    productionId,
    rawMaterials,
    returnNavKey,
  ]);

  const readOnly = isCompleted;

  const rawColumns = useMemo(
    () => ['Sr', 'Item', 'Name', 'Unit', 'Req', 'Avail', 'Rate', 'Amount'],
    [],
  );

  return (
    <RefinedScreenShell className="work-order-entry-screen">
      <TransactionEntryShell title={pageTitle}>
        <div className="wo-entry">
          <div className="wo-entry__header">
            <div className="wo-entry__final-qty">
              <span className="wo-field-label">Final qty</span>
              <span className="wo-readonly-value">{finalQty}</span>
            </div>
          </div>

          {(statusMessage || errorMessage || !apiReady) && (
            <p
              className={`wo-entry__status${errorMessage || !apiReady ? ' wo-entry__status--error' : ''}`}
              role="status"
            >
              {errorMessage ?? statusMessage ?? 'API offline'}
            </p>
          )}

          <ErpFormSection className="wo-section">
            <ErpFormGrid columns={4}>
              <label className="si-field">
                <span className="erp-form-field__label">Production ID</span>
                <input
                  className="wpf-form-input"
                  value={productionId}
                  readOnly
                  disabled={readOnly}
                />
              </label>
              <label className="si-field">
                <span className="erp-form-field__label">Date</span>
                <input
                  type="date"
                  className="wpf-form-input"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="si-field erp-form-field--full wo-field--wide">
                <span className="erp-form-field__label">Item</span>
                <div className="wo-inline-lookup">
                  <input
                    className="wpf-form-input"
                    value={manufacturingItemId}
                    onChange={(e) => setManufacturingItemId(e.target.value)}
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className="wpf-action-button wo-lookup-btn"
                    onClick={() => void lookupManufacturingItem()}
                    disabled={readOnly}
                  >
                    Look up
                  </button>
                  <input
                    className="wpf-form-input wo-readonly-input"
                    value={manufacturingItemName}
                    readOnly
                  />
                </div>
              </label>
              <label className="si-field erp-form-field--full wo-field--wide">
                <span className="erp-form-field__label">Machine</span>
                <div className="wo-inline-lookup">
                  <input
                    className="wpf-form-input"
                    value={machineCode}
                    onChange={(e) => setMachineCode(e.target.value)}
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className="wpf-action-button wo-lookup-btn"
                    onClick={() => void lookupMachine()}
                    disabled={readOnly}
                  >
                    Look up
                  </button>
                  <input
                    className="wpf-form-input wo-readonly-input"
                    value={machineName}
                    readOnly
                  />
                </div>
              </label>
              <label className="si-field erp-form-field--full wo-field--wide">
                <span className="erp-form-field__label">Operator</span>
                <div className="wo-inline-lookup">
                  <input
                    className="wpf-form-input"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className="wpf-action-button wo-lookup-btn"
                    onClick={() => void lookupOperator()}
                    disabled={readOnly}
                  >
                    Look up
                  </button>
                  <input
                    className="wpf-form-input wo-readonly-input"
                    value={operatorName}
                    readOnly
                  />
                </div>
              </label>
              <label className="si-field">
                <span className="erp-form-field__label">Start</span>
                <input
                  className="wpf-form-input"
                  value={startTimeText}
                  onChange={(e) => setStartTimeText(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="si-field">
                <span className="erp-form-field__label">End</span>
                <input
                  className="wpf-form-input"
                  value={endTimeText}
                  onChange={(e) => setEndTimeText(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="si-field">
                <span className="erp-form-field__label">Min</span>
                <input
                  className="wpf-form-input"
                  value={totalDurationMinutes}
                  onChange={(e) => setTotalDurationMinutes(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="si-field">
                <span className="erp-form-field__label">Produce</span>
                <input
                  className="wpf-form-input"
                  value={produceQty}
                  onChange={(e) => handleProduceQtyChange(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="si-field">
                <span className="erp-form-field__label">Rejected</span>
                <input
                  className="wpf-form-input"
                  value={rejectedQty}
                  onChange={(e) => handleRejectedQtyChange(e.target.value)}
                  disabled={readOnly}
                />
              </label>
            </ErpFormGrid>
          </ErpFormSection>

          <ErpFormSection className="wo-scan-bar">
            <label className="si-field">
              <span className="erp-form-field__label">From godown</span>
              <select
                className="wpf-form-combo"
                value={fromGodown}
                onChange={(e) => setFromGodown(e.target.value)}
                disabled={readOnly}
              >
                {GODOWNS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="wpf-action-button"
              onClick={() => void generateFromBom()}
              disabled={readOnly}
            >
              Generate from BOM
            </button>
            <button
              type="button"
              className="wpf-action-button"
              onClick={() => navigate('bom')}
              disabled={!manufacturingItemId.trim()}
            >
              Open BOM
            </button>
          </ErpFormSection>

          <div className="wo-grids">
            <div className="wo-grid-panel">
              <h3 className="wo-grid-panel__title">1. Raw materials</h3>
              <div className="wo-grid-wrap">
                <table className="wo-grid">
                  <thead>
                    <tr>
                      {rawColumns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={rawColumns.length} className="wo-grid__empty">
                          Generate from BOM to load raw materials.
                        </td>
                      </tr>
                    ) : (
                      rawMaterials.map((line) => (
                        <tr key={line.srNo}>
                          <td>{line.srNo}</td>
                          <td>{line.itemId}</td>
                          <td>{line.itemName}</td>
                          <td>{line.unit}</td>
                          <td>{line.reqQty}</td>
                          <td className={line.availableQty < line.reqQty ? 'wo-grid__short' : undefined}>
                            {line.availableQty}
                          </td>
                          <td>{line.rate}</td>
                          <td>{line.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="wo-grid-panel">
              <h3 className="wo-grid-panel__title">2. Consumables</h3>
              <div className="wo-grid-wrap">
                <table className="wo-grid">
                  <thead>
                    <tr>
                      <th>Sr</th>
                      <th>Material</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumables.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="wo-grid__empty">
                          Generate from BOM to load consumables.
                        </td>
                      </tr>
                    ) : (
                      consumables.map((line) => (
                        <tr key={line.srNo}>
                          <td>{line.srNo}</td>
                          <td>{line.material}</td>
                          <td>{line.qty}</td>
                          <td>{line.rate}</td>
                          <td>{line.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="wo-footer">
            <div className="wo-totals">
              <span>
                Raw: <strong>{rawMaterialAmount}</strong>
              </span>
              <span>
                Consumable: <strong>{consumableAmount}</strong>
              </span>
              <span>
                Total: <strong>{productionAmount}</strong>
              </span>
            </div>
            <div className="wo-actions">
              {!readOnly && (
                <button
                  type="button"
                  className="wpf-primary-button"
                  onClick={() => void save()}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              )}
              <button type="button" className="wpf-action-button" onClick={goBack}>
                {readOnly ? 'Back' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>

        <ProductBrowseDialog
          open={productBrowseOpen}
          onClose={() => setProductBrowseOpen(false)}
          onConfirm={onProductBrowseConfirm}
        />
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
