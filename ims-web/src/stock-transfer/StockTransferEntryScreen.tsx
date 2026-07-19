import { useCallback, useEffect, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { createStockTransfer, type StockTransferLine, type StockTransferRecord } from '../api/stockTransfers';
import { ErpFormSection } from '../components/form';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useStockTransferNavIntent } from './context/StockTransferNavIntent';
import '../sales-invoice/sales-invoice.scss';

const GODOWNS = ['Counter', 'Main', 'Production'] as const;

function emptyLine(sr: number): StockTransferLine {
  return { srNo: sr, productCode: '', productName: '', qty: '0', unit: 'NOS' };
}

function nextEntryNo(): string {
  const stamp = Date.now().toString().slice(-8);
  return `ST-${stamp}`;
}

export function StockTransferEntryScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useStockTransferNavIntent();
  const [entryNo, setEntryNo] = useState(nextEntryNo());
  const [fromGodown, setFromGodown] = useState<string>(GODOWNS[0]);
  const [toGodown, setToGodown] = useState<string>(GODOWNS[1]);
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState('');
  const [lines, setLines] = useState<StockTransferLine[]>([emptyLine(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [returnNavKey, setReturnNavKey] = useState('stock-transfer');

  useEffect(() => {
    const intent = consumeOpenIntent();
    if (intent?.returnNavKey) setReturnNavKey(intent.returnNavKey);
  }, [consumeOpenIntent]);

  const updateLine = (index: number, patch: Partial<StockTransferLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine(prev.length + 1)]);

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index).map((line, i) => ({ ...line, srNo: i + 1 })));
  };

  const handleSave = useCallback(async () => {
    if (fromGodown === toGodown) {
      setError('From and To godown must differ.');
      return;
    }
    const validLines = lines.filter((l) => l.productCode?.trim() && Number(l.qty) > 0);
    if (validLines.length === 0) {
      setError('Add at least one line with product and quantity.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setError('API is offline.');
        return;
      }
      const payload: StockTransferRecord = {
        entryNo,
        fromGodown,
        toGodown,
        transferDate,
        remark,
        status: 'posted',
        lines: validLines,
      };
      await createStockTransfer(payload);
      setStatusMessage(`Transfer ${entryNo} posted.`);
      setTimeout(() => navigate(returnNavKey), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [entryNo, fromGodown, lines, navigate, remark, returnNavKey, toGodown, transferDate]);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell title="Stock Transfer">
        <div className="si-list-layout fv-list">
          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={() => void handleSave()} disabled={saving}>
                Post Transfer
              </button>
              <button type="button" className="wpf-action-button" onClick={() => navigate(returnNavKey)}>
                Close
              </button>
            </div>
            {(error || statusMessage) ? (
              <p className="si-list-toolbar__status" role="status">{error ?? statusMessage}</p>
            ) : null}
          </div>

          <ErpFormSection title="Header">
            <label>
              Entry No
              <input className="wpf-form-input" value={entryNo} onChange={(e) => setEntryNo(e.target.value)} />
            </label>
            <label>
              Date
              <input type="date" className="wpf-form-input" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
            </label>
            <label>
              From Godown
              <select className="wpf-form-input" value={fromGodown} onChange={(e) => setFromGodown(e.target.value)}>
                {GODOWNS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              To Godown
              <select className="wpf-form-input" value={toGodown} onChange={(e) => setToGodown(e.target.value)}>
                {GODOWNS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              Remark
              <input className="wpf-form-input" value={remark} onChange={(e) => setRemark(e.target.value)} />
            </label>
          </ErpFormSection>

          <ErpFormSection title="Lines">
            <button type="button" className="wpf-action-button" onClick={addLine}>Add Line</button>
            <table className="wpf-datagrid">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Code</th>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
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
                        value={line.qty ?? ''}
                        onChange={(e) => updateLine(index, { qty: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="wpf-form-input"
                        value={line.unit ?? ''}
                        onChange={(e) => updateLine(index, { unit: e.target.value })}
                      />
                    </td>
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
