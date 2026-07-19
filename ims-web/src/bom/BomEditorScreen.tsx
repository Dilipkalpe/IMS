import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { createBom, fetchBomByProduct, saveBom, type BomLine, type BomRecord } from '../api/boms';
import { fetchMasterPage } from '../api/masters';
import { ErpFormSection } from '../components/form';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useBomNavIntent } from './context/BomNavIntent';
import '../sales-invoice/sales-invoice.scss';

function emptyLine(sr: number): BomLine {
  return { srNo: sr, productCode: '', productName: '', qty: 0, unit: '', rate: 0, amount: 0 };
}

function recalcLine(line: BomLine): BomLine {
  const qty = Number(line.qty) || 0;
  const rate = Number(line.rate) || 0;
  return { ...line, amount: Math.round(qty * rate * 100) / 100 };
}

export function BomEditorScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useBomNavIntent();
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [revision, setRevision] = useState('Rev A');
  const [standardQty, setStandardQty] = useState('1');
  const [rawMaterials, setRawMaterials] = useState<BomLine[]>([emptyLine(1)]);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [returnNavKey, setReturnNavKey] = useState('bom');

  const productionAmount = useMemo(() => {
    const sum = rawMaterials.reduce((acc, line) => acc + (Number(line.amount) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [rawMaterials]);

  const loadProductMeta = useCallback(async (code: string) => {
    const result = await fetchMasterPage('products', { page: 1, limit: 1, search: code });
    const product = result.items?.find((p) => String(p.code).toUpperCase() === code.toUpperCase());
    if (product) {
      setProductName(String(product.name ?? ''));
    }
  }, []);

  const loadBom = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setError('API is offline.');
        return;
      }
      const bom = await fetchBomByProduct(code);
      if (bom) {
        setProductCode(bom.productCode);
        setProductName(bom.productName ?? '');
        setRevision(bom.revision ?? 'Rev A');
        setStandardQty(String(bom.standardQty ?? 1));
        setRawMaterials(
          bom.rawMaterials?.length ? bom.rawMaterials.map(recalcLine) : [emptyLine(1)],
        );
        setStatus(bom.status ?? 'active');
      } else {
        setProductCode(code);
        await loadProductMeta(code);
        setRawMaterials([emptyLine(1)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BOM.');
    } finally {
      setLoading(false);
    }
  }, [loadProductMeta]);

  useEffect(() => {
    const intent = consumeOpenIntent();
    if (!intent) return;
    setReturnNavKey(intent.returnNavKey ?? 'bom');
    if (intent.type === 'edit') {
      void loadBom(intent.productCode);
      return;
    }
    if (intent.productCode) {
      setProductCode(intent.productCode);
      void loadProductMeta(intent.productCode);
    }
  }, [consumeOpenIntent, loadBom, loadProductMeta]);

  const updateLine = (index: number, patch: Partial<BomLine>) => {
    setRawMaterials((prev) =>
      prev.map((line, i) => (i === index ? recalcLine({ ...line, ...patch }) : line)),
    );
  };

  const addLine = () => {
    setRawMaterials((prev) => [...prev, emptyLine(prev.length + 1)]);
  };

  const removeLine = (index: number) => {
    setRawMaterials((prev) =>
      prev.filter((_, i) => i !== index).map((line, i) => ({ ...line, srNo: i + 1 })),
    );
  };

  const handleSave = async () => {
    const code = productCode.trim().toUpperCase();
    if (!code) {
      setError('Product code is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: BomRecord = {
        productCode: code,
        productName,
        revision,
        standardQty: Number(standardQty) || 1,
        rawMaterials: rawMaterials.filter((l) => l.productCode?.trim()),
        consumables: [],
        productionAmount,
        status,
      };
      const existing = await fetchBomByProduct(code);
      if (existing) await saveBom(payload);
      else await createBom(payload);
      setStatusMessage(`BOM saved for ${code}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => navigate(returnNavKey);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell title="Bill of Materials">
        <div className="si-list-layout fv-list">
          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={() => void handleSave()} disabled={saving || loading}>
                Save
              </button>
              <button type="button" className="wpf-action-button" onClick={handleClose}>
                Close
              </button>
            </div>
            {(error || statusMessage) ? (
              <p className="si-list-toolbar__status" role="status">{error ?? statusMessage}</p>
            ) : null}
          </div>

          <ErpFormSection title="Header">
            <label>
              Product Code
              <input
                className="wpf-form-input"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                onBlur={() => productCode.trim() && void loadProductMeta(productCode.trim())}
              />
            </label>
            <label>
              Product Name
              <input className="wpf-form-input" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </label>
            <label>
              Revision
              <input className="wpf-form-input" value={revision} onChange={(e) => setRevision(e.target.value)} />
            </label>
            <label>
              Standard Qty
              <input className="wpf-form-input" value={standardQty} onChange={(e) => setStandardQty(e.target.value)} />
            </label>
            <label>
              Status
              <select className="wpf-form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label>
              Production Amount
              <input className="wpf-form-input" value={productionAmount.toFixed(2)} readOnly />
            </label>
          </ErpFormSection>

          <ErpFormSection title="Raw Materials">
            <button type="button" className="wpf-action-button" onClick={addLine}>Add Line</button>
            <table className="wpf-datagrid">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Code</th>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rawMaterials.map((line, index) => (
                  <tr key={line.srNo}>
                    <td>{line.srNo}</td>
                    <td>
                      <input
                        className="wpf-form-input"
                        value={line.productCode ?? ''}
                        onChange={(e) => updateLine(index, { productCode: e.target.value.toUpperCase() })}
                      />
                    </td>
                    <td>
                      <input
                        className="wpf-form-input"
                        value={line.productName ?? ''}
                        onChange={(e) => updateLine(index, { productName: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="wpf-form-input"
                        value={String(line.qty ?? '')}
                        onChange={(e) => updateLine(index, { qty: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        className="wpf-form-input"
                        value={String(line.rate ?? '')}
                        onChange={(e) => updateLine(index, { rate: Number(e.target.value) })}
                      />
                    </td>
                    <td>{(line.amount ?? 0).toFixed(2)}</td>
                    <td>
                      <button type="button" className="wpf-action-button" onClick={() => removeLine(index)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ErpFormSection>
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
