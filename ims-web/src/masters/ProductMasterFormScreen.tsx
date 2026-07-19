import { useCallback, useEffect, useState } from 'react';
import { probeApiHealth } from '../api/client';
import {
  createProduct,
  getProductByCode,
  updateProductByCode,
  type ProductMasterRecord,
} from '../api/products';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormSection } from '../components/form';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useProductMasterNavIntent } from './context/ProductMasterNavIntent';
import './master-form.scss';

const EMPTY: ProductMasterRecord = {
  code: '',
  name: '',
  category: 'General',
  unit: 'EA',
  salePrice: 0,
  purchasePrice: 0,
  reorderQty: 0,
  minOrderQty: 0,
  cgst: 9,
  sgst: 9,
  igst: 0,
  taxType: 'GST',
  taxPercent: '18',
  stockQty: 0,
  activeStatus: true,
  gstExempt: false,
  serialApplicable: false,
};

function validate(form: ProductMasterRecord): string | null {
  if (!form.code.trim()) return 'Product code is required.';
  if (!form.name.trim()) return 'Product name is required.';
  if ((form.salePrice ?? 0) < 0 || (form.purchasePrice ?? 0) < 0) return 'Prices cannot be negative.';
  if ((form.stockQty ?? 0) < 0) return 'Opening stock cannot be negative.';
  return null;
}

export function ProductMasterFormScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useProductMasterNavIntent();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [originalCode, setOriginalCode] = useState('');
  const [form, setForm] = useState<ProductMasterRecord>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(true);

  const patch = useCallback(<K extends keyof ProductMasterRecord>(key: K, value: ProductMasterRecord[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadIntent = useCallback(async (intent: { type: 'new' } | { type: 'edit'; code: string }) => {
    setError(null);
    setStatus(null);
    const apiUp = await probeApiHealth();
    setApiReady(apiUp);

    if (intent.type === 'new') {
      setMode('new');
      setOriginalCode('');
      setForm({ ...EMPTY });
      return;
    }

    setMode('edit');
    setOriginalCode(intent.code);
    if (!apiUp) {
      setError('API offline — cannot load product.');
      return;
    }

    setLoading(true);
    try {
      const record = await getProductByCode(intent.code);
      setForm({
        ...EMPTY,
        ...record,
        code: record.code ?? intent.code,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => consumeOpenIntent(loadIntent), [consumeOpenIntent, loadIntent]);

  const goBack = useCallback(() => navigate('products'), [navigate]);

  const save = useCallback(async () => {
    setError(null);
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!apiReady) {
      setError('API offline — cannot save.');
      return;
    }

    setSaving(true);
    try {
      const payload: ProductMasterRecord = {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
      };
      if (mode === 'new') {
        await createProduct(payload);
        setStatus('Product created.');
        setMode('edit');
        setOriginalCode(payload.code);
      } else {
        await updateProductByCode(originalCode || payload.code, payload);
        setOriginalCode(payload.code);
        setStatus('Product saved.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [apiReady, form, mode, originalCode]);

  const title = mode === 'new' ? 'Add Product' : `Edit Product — ${originalCode || form.code}`;

  return (
    <TransactionEntryShell
      title={title}
      titleRight={
        loading || status || error || !apiReady ? (
          <span className="mf-form__status" role="status">
            {loading ? 'Loading…' : !apiReady ? 'API offline' : error ?? status}
          </span>
        ) : null
      }
    >
      <div className="mf-form">
        <ErpFormSection>
          <div className="erp-form-section__title">Identity</div>
          <ErpFormGrid>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Code *</span>
            <input
              className="wpf-subpage-form-input"
              value={form.code}
              disabled={mode === 'edit'}
              onChange={(e) => patch('code', e.target.value.toUpperCase())}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Name *</span>
            <input
              className="wpf-subpage-form-input"
              value={form.name}
              onChange={(e) => patch('name', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Category</span>
            <input
              className="wpf-subpage-form-input"
              value={form.category ?? ''}
              onChange={(e) => patch('category', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Brand</span>
            <input
              className="wpf-subpage-form-input"
              value={form.brand ?? ''}
              onChange={(e) => patch('brand', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">HSN Code</span>
            <input
              className="wpf-subpage-form-input"
              value={form.hsnCode ?? ''}
              onChange={(e) => patch('hsnCode', e.target.value)}
            />
          </label>
          <label className="mf-form__field mf-form__field--check">
            <input
              type="checkbox"
              checked={form.activeStatus !== false}
              onChange={(e) => patch('activeStatus', e.target.checked)}
            />
            <span>Active</span>
          </label>
          </ErpFormGrid>

          <div className="erp-form-section__title">Units & classification</div>
          <ErpFormGrid>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Unit</span>
            <input
              className="wpf-subpage-form-input"
              value={form.unit ?? ''}
              onChange={(e) => patch('unit', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Sale UOM</span>
            <input
              className="wpf-subpage-form-input"
              value={form.saleUom ?? ''}
              onChange={(e) => patch('saleUom', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Purchase UOM</span>
            <input
              className="wpf-subpage-form-input"
              value={form.purchaseUom ?? ''}
              onChange={(e) => patch('purchaseUom', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Product type</span>
            <input
              className="wpf-subpage-form-input"
              value={form.productType ?? ''}
              onChange={(e) => patch('productType', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Main group</span>
            <input
              className="wpf-subpage-form-input"
              value={form.productMainGroup ?? ''}
              onChange={(e) => patch('productMainGroup', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Sub group</span>
            <input
              className="wpf-subpage-form-input"
              value={form.productSubGroup ?? ''}
              onChange={(e) => patch('productSubGroup', e.target.value)}
            />
          </label>
          </ErpFormGrid>

          <div className="erp-form-section__title">Pricing, tax & stock</div>
          <ErpFormGrid>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Sale price</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.salePrice ?? 0}
              onChange={(e) => patch('salePrice', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Purchase price</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.purchasePrice ?? 0}
              onChange={(e) => patch('purchasePrice', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Opening stock</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.stockQty ?? 0}
              onChange={(e) => patch('stockQty', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Tax %</span>
            <input
              className="wpf-subpage-form-input"
              value={form.taxPercent ?? '18'}
              onChange={(e) => patch('taxPercent', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">CGST</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.cgst ?? 0}
              onChange={(e) => patch('cgst', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">SGST</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.sgst ?? 0}
              onChange={(e) => patch('sgst', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">IGST</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.igst ?? 0}
              onChange={(e) => patch('igst', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Reorder qty</span>
            <input
              className="wpf-subpage-form-input"
              inputMode="decimal"
              value={form.reorderQty ?? 0}
              onChange={(e) => patch('reorderQty', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field mf-form__field--check">
            <input
              type="checkbox"
              checked={form.gstExempt === true}
              onChange={(e) => patch('gstExempt', e.target.checked)}
            />
            <span>GST exempt</span>
          </label>
          </ErpFormGrid>

          <div className="mf-form__actions">
          <button
            type="button"
            className="wpf-primary-button"
            disabled={saving || loading || !apiReady}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="wpf-secondary-button" disabled={saving} onClick={goBack}>
            Back to list
          </button>
          </div>
        </ErpFormSection>
      </div>
    </TransactionEntryShell>
  );
}
