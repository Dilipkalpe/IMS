import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { fetchMasterPage } from '../api/masters';
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
import { fetchProductsPage, searchProducts } from '../api/products';
import { createStockTransfer, type StockTransferRecord } from '../api/stockTransfers';
import { fetchUsersPage } from '../api/users';
import { ProductBrowseDialog } from '../components/transaction/ProductBrowseDialog';
import type { SalesProductInfo } from '../components/transaction/salesProductPicker';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import {
  ErpFormGrid,
  ErpFormSection,
  ErpSearchableCombobox,
  ErpStaticSearchableSelect,
  machineQuickAddConfig,
  productQuickAddConfig,
  type SearchableOption,
} from '../components/form';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useWorkOrderNavIntent, type WorkOrderOpenIntent } from './context/WorkOrderNavIntent';
import {
  formatLastMaterialEvent,
  formatMaterialAssignment,
  formatMaterialHistoryTooltip,
  formatMaterialStage,
} from './materialLineDisplay';
import { WorkOrderActionRail } from './WorkOrderActionRail';
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

function productToOption(product: SalesProductInfo): SearchableOption {
  return {
    value: product.code,
    label: `${product.code} — ${product.name}`,
    searchText: `${product.code} ${product.name}`,
  };
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

  const [productOptions, setProductOptions] = useState<SearchableOption[]>([]);
  const [machineOptions, setMachineOptions] = useState<SearchableOption[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<SearchableOption[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const [productBrowseOpen, setProductBrowseOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiReady, setApiReady] = useState(true);

  const returnNavKey = intent.returnNavKey ?? 'production-orders';
  const pageTitle =
    editProductionNo == null ? 'New Job Work' : `Job Work #${editProductionNo}`;
  const readOnly = isCompleted;

  const loadLookupOptions = useCallback(async () => {
    try {
      const [products, machines, users] = await Promise.all([
        fetchProductsPage({ limit: 200 }),
        fetchMasterPage('machines', { limit: 200 }),
        fetchUsersPage({ limit: 200 }),
      ]);

      setProductOptions((products.items ?? []).map(productToOption));
      setMachineOptions(
        (machines.items ?? [])
          .filter((row) => row.activeStatus !== false)
          .map((row) => {
            const code = String(row.code ?? '').trim();
            const name = String(row.name ?? '').trim();
            return {
              value: code,
              label: name ? `${code} — ${name}` : code,
              searchText: `${code} ${name}`,
            };
          })
          .filter((option) => option.value),
      );
      setOperatorOptions(
        (users.items ?? [])
          .filter((user) => user.activeStatus)
          .map((user) => ({
            value: user.username,
            label: user.fullName ? `${user.username} — ${user.fullName}` : user.username,
            searchText: `${user.username} ${user.fullName}`,
          })),
      );
    } catch {
      // Lookup lists are optional — manual entry still works.
    }
  }, []);

  const onProductSearch = useCallback(async (term: string) => {
    const q = term.trim();
    if (q.length < 2) return;
    setProductSearchLoading(true);
    try {
      const result = await searchProducts(q, 40);
      setProductOptions((result.items ?? []).map(productToOption));
    } finally {
      setProductSearchLoading(false);
    }
  }, []);

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
      await loadLookupOptions();
    } else {
      setProductionId('1');
    }
  }, [loadLookupOptions]);

  const applyIntent = useCallback(
    async (next: WorkOrderOpenIntent) => {
      setIntent(next);
      setErrorMessage(null);
      setStatusMessage(null);

      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setErrorMessage('API is offline — work order features require the API server.');
      } else {
        await loadLookupOptions();
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
    [applyFromDto, loadLookupOptions, resetNewDraft],
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

  const onManufacturingItemSelect = useCallback(
    (code: string) => {
      const hit = productOptions.find((option) => option.value === code);
      const namePart = hit?.label.includes(' — ')
        ? hit.label.split(' — ').slice(1).join(' — ')
        : hit?.label ?? '';
      setManufacturingItemId(code);
      setManufacturingItemName(namePart);
      setErrorMessage(null);
    },
    [productOptions],
  );

  const onMachineSelect = useCallback(
    (code: string) => {
      const hit = machineOptions.find((option) => option.value === code);
      const namePart = hit?.label.includes(' — ')
        ? hit.label.split(' — ').slice(1).join(' — ')
        : hit?.label ?? '';
      setMachineCode(code);
      setMachineName(namePart);
      setErrorMessage(null);
    },
    [machineOptions],
  );

  const onOperatorSelect = useCallback(
    (username: string) => {
      const hit = operatorOptions.find((option) => option.value === username);
      const namePart = hit?.label.includes(' — ')
        ? hit.label.split(' — ').slice(1).join(' — ')
        : hit?.label ?? '';
      setOperatorId(username);
      setOperatorName(namePart);
      setErrorMessage(null);
    },
    [operatorOptions],
  );

  const onProductBrowseConfirm = useCallback(
    (products: SalesProductInfo[]) => {
      const first = products[0];
      if (first) {
        setManufacturingItemId(first.code);
        setManufacturingItemName(first.name);
        setProductOptions((prev) => {
          if (prev.some((option) => option.value === first.code)) return prev;
          return [productToOption(first), ...prev];
        });
      }
      setProductBrowseOpen(false);
    },
    [],
  );

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
      setErrorMessage('Select a manufacturing item first.');
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
      setErrorMessage('Select a manufacturing item first.');
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

  const titleStatus = useMemo(() => {
    if (errorMessage) return errorMessage;
    if (!apiReady) return 'API offline — save disabled';
    if (statusMessage) return statusMessage;
    if (readOnly) return `Status: ${status}`;
    return null;
  }, [apiReady, errorMessage, readOnly, status, statusMessage]);

  const rawColumns = useMemo(
    () => ['Sr', 'Item', 'Name', 'Stage', 'Last event', 'Src', 'Unit', 'Req', 'Avail', 'Rate', 'Amount'],
    [],
  );

  return (
    <RefinedScreenShell className="work-order-entry-screen">
      <TransactionEntryShell
        title={pageTitle}
        titleRight={
          <div className="wo-entry__title-meta">
            <div className="wo-entry__final-qty-badge" aria-label={`Final quantity ${finalQty}`}>
              <span className="wo-entry__final-qty-label">Final qty</span>
              <strong>{finalQty}</strong>
            </div>
            {titleStatus ? (
              <span
                className={`wo-entry__title-status${errorMessage || !apiReady ? ' wo-entry__title-status--error' : ''}`}
                role="status"
              >
                {titleStatus}
              </span>
            ) : null}
          </div>
        }
      >
        <div className="wo-entry wo-entry--wide">
          <p className="wo-entry__intro">
            Job work from BOM — material stages, stock issue from godown, and finished goods receipt.
          </p>

          <ErpFormSection>
            <div className="erp-form-section__title">Document details</div>
            <ErpFormGrid columns={4}>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Job Work No</span>
                <input className="wpf-subpage-form-input si-readonly" value={productionId} readOnly />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Date</span>
                <input
                  type="date"
                  className="wpf-subpage-form-input"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Status</span>
                <input className="wpf-subpage-form-input si-readonly" value={status} readOnly />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">BOM revision</span>
                <input className="wpf-subpage-form-input si-readonly" value={bomRevision} readOnly />
              </label>
            </ErpFormGrid>
          </ErpFormSection>

          <div className="wo-entry__columns">
            <ErpFormSection>
              <div className="erp-form-section__title">Manufacturing item & machine</div>
              <ErpFormGrid columns={1}>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Manufacturing item *</span>
                  <div className="wo-field-with-action">
                    <ErpSearchableCombobox
                      value={manufacturingItemId}
                      onChange={onManufacturingItemSelect}
                      options={productOptions}
                      placeholder="Search product code or name…"
                      loading={productSearchLoading}
                      disabled={readOnly}
                      onSearch={onProductSearch}
                      quickAdd={productQuickAddConfig}
                      onQuickAddSuccess={(option) => {
                        setProductOptions((prev) => {
                          if (prev.some((row) => row.value === option.value)) return prev;
                          return [option, ...prev];
                        });
                        onManufacturingItemSelect(option.value);
                      }}
                      aria-label="Manufacturing item"
                    />
                    <button
                      type="button"
                      className="wpf-secondary-button wo-field-with-action__btn"
                      onClick={() => setProductBrowseOpen(true)}
                      disabled={readOnly}
                    >
                      Browse…
                    </button>
                  </div>
                  {manufacturingItemName ? (
                    <span className="wo-field-hint">{manufacturingItemName}</span>
                  ) : null}
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Machine</span>
                  <ErpSearchableCombobox
                    value={machineCode}
                    onChange={onMachineSelect}
                    options={machineOptions}
                    placeholder="Search machine…"
                    disabled={readOnly}
                    quickAdd={machineQuickAddConfig()}
                    onQuickAddSuccess={(option) => {
                      setMachineOptions((prev) => {
                        if (prev.some((row) => row.value === option.value)) return prev;
                        return [option, ...prev];
                      });
                      onMachineSelect(option.value);
                    }}
                    aria-label="Machine"
                  />
                  {machineName ? <span className="wo-field-hint">{machineName}</span> : null}
                </label>
              </ErpFormGrid>
            </ErpFormSection>

            <ErpFormSection>
              <div className="erp-form-section__title">Operator & production run</div>
              <ErpFormGrid columns={2}>
                <label className="si-field erp-form-field--span-2">
                  <span className="wpf-subpage-form-label">Operator</span>
                  <ErpSearchableCombobox
                    value={operatorId}
                    onChange={onOperatorSelect}
                    options={operatorOptions}
                    placeholder="Search operator username…"
                    disabled={readOnly}
                    aria-label="Operator"
                  />
                  {operatorName ? <span className="wo-field-hint">{operatorName}</span> : null}
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Start time</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={startTimeText}
                    onChange={(e) => setStartTimeText(e.target.value)}
                    disabled={readOnly}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">End time</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={endTimeText}
                    onChange={(e) => setEndTimeText(e.target.value)}
                    disabled={readOnly}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Duration (min)</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={totalDurationMinutes}
                    onChange={(e) => setTotalDurationMinutes(e.target.value)}
                    disabled={readOnly}
                    inputMode="numeric"
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Produce qty</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={produceQty}
                    onChange={(e) => handleProduceQtyChange(e.target.value)}
                    disabled={readOnly}
                    inputMode="numeric"
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Rejected qty</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={rejectedQty}
                    onChange={(e) => handleRejectedQtyChange(e.target.value)}
                    disabled={readOnly}
                    inputMode="numeric"
                  />
                </label>
              </ErpFormGrid>
            </ErpFormSection>
          </div>

          <ErpFormSection className="wo-scan-bar">
            <div className="erp-form-section__title">Stock issue & BOM</div>
            <div className="wo-scan-bar__controls">
              <label className="si-field wo-scan-bar__godown">
                <span className="wpf-subpage-form-label">From godown</span>
                <ErpStaticSearchableSelect
                  value={fromGodown}
                  onChange={setFromGodown}
                  options={GODOWNS}
                  placeholder="Select godown…"
                  disabled={readOnly}
                  aria-label="From godown"
                />
              </label>
              <div className="wo-scan-bar__actions">
                <button
                  type="button"
                  className="wpf-action-button"
                  onClick={() => void generateFromBom()}
                  disabled={readOnly}
                  title="Load raw materials and consumables from BOM"
                >
                  Generate from BOM
                </button>
                <button
                  type="button"
                  className="wpf-secondary-button"
                  onClick={() => navigate('bom')}
                  disabled={!manufacturingItemId.trim()}
                  title="Open BOM designer for selected item"
                >
                  Open BOM
                </button>
              </div>
            </div>
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
                          Select a manufacturing item, then use Generate from BOM to load materials.
                        </td>
                      </tr>
                    ) : (
                      rawMaterials.map((line) => (
                        <tr key={line.srNo}>
                          <td>{line.srNo}</td>
                          <td>{line.itemId}</td>
                          <td>{line.itemName}</td>
                          <td className="wo-grid__stage">{formatMaterialStage(line.stage)}</td>
                          <td
                            className="wo-grid__event"
                            title={formatMaterialHistoryTooltip(line.stageEvents)}
                          >
                            {formatLastMaterialEvent(line.stageEvents)}
                          </td>
                          <td>{formatMaterialAssignment(line.assignmentType)}</td>
                          <td>{line.unit}</td>
                          <td className="wo-grid__num">{line.reqQty}</td>
                          <td
                            className={`wo-grid__num${line.availableQty < line.reqQty ? ' wo-grid__short' : ''}`}
                          >
                            {line.availableQty}
                          </td>
                          <td className="wo-grid__num">{line.rate}</td>
                          <td className="wo-grid__num">{line.amount}</td>
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
                      <th>Stage</th>
                      <th>Last event</th>
                      <th>Src</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumables.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="wo-grid__empty">
                          Generate from BOM to load consumables.
                        </td>
                      </tr>
                    ) : (
                      consumables.map((line) => (
                        <tr key={line.srNo}>
                          <td>{line.srNo}</td>
                          <td>{line.material}</td>
                          <td className="wo-grid__stage">{formatMaterialStage(line.stage)}</td>
                          <td
                            className="wo-grid__event"
                            title={formatMaterialHistoryTooltip(line.stageEvents)}
                          >
                            {formatLastMaterialEvent(line.stageEvents)}
                          </td>
                          <td>{formatMaterialAssignment(line.assignmentType)}</td>
                          <td className="wo-grid__num">{line.qty}</td>
                          <td className="wo-grid__num">{line.rate}</td>
                          <td className="wo-grid__num">{line.amount}</td>
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
              <div className="wo-total-chip">
                <span className="wo-total-chip__label">Raw materials</span>
                <strong>{rawMaterialAmount}</strong>
              </div>
              <div className="wo-total-chip">
                <span className="wo-total-chip__label">Consumables</span>
                <strong>{consumableAmount}</strong>
              </div>
              <div className="wo-total-chip wo-total-chip--primary">
                <span className="wo-total-chip__label">Production total</span>
                <strong>{productionAmount}</strong>
              </div>
            </div>
            <WorkOrderActionRail
              saving={isSaving}
              readOnly={readOnly}
              disabled={!apiReady}
              onSave={() => void save()}
              onClose={goBack}
            />
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
