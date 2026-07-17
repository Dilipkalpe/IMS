import { useCallback, useRef, useState } from 'react';
import { SUPPRESS_ENTER_AS_TAB } from '../../keyboard/formKeyboardNavigation';
import type { SalesProductInfo } from '../../api/products';
import { ProductBrowseDialog } from './ProductBrowseDialog';

export interface SalesProductScanBarProps {
  barcode: string;
  onBarcodeChange: (value: string) => void;
  onScan: () => void | Promise<void>;
  onBrowsePick: (products: SalesProductInfo[]) => void;
  onManageColumns?: () => void;
}

export function SalesProductScanBar({
  barcode,
  onBarcodeChange,
  onScan,
  onBrowsePick,
  onManageColumns,
}: SalesProductScanBarProps) {
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  const runScan = useCallback(async () => {
    if (scanBusy) return;
    setScanBusy(true);
    try {
      await onScan();
    } finally {
      setScanBusy(false);
      requestAnimationFrame(() => barcodeRef.current?.focus());
    }
  }, [onScan, scanBusy]);

  return (
    <>
      <div className={`si-scan-bar${onManageColumns ? ' si-scan-bar--with-columns' : ''}`}>
        <span className="si-scan-bar__label">Barcode scan</span>
        <input
          ref={barcodeRef}
          className="wpf-sales-compact-input si-scan-bar__input"
          {...{ [SUPPRESS_ENTER_AS_TAB]: true }}
          data-focus-key="barcode"
          value={barcode}
          disabled={scanBusy}
          onChange={(e) => onBarcodeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runScan();
            }
          }}
          aria-label="Barcode scan"
        />
        <button
          type="button"
          className="wpf-secondary-button si-scan-bar__browse"
          tabIndex={-1}
          disabled={scanBusy}
          onClick={() => setBrowseOpen(true)}
        >
          Browse…
        </button>
        {onManageColumns ? (
          <button
            type="button"
            className="wpf-secondary-button si-scan-bar__columns"
            tabIndex={-1}
            disabled={scanBusy}
            onClick={onManageColumns}
          >
            Columns…
          </button>
        ) : null}
      </div>

      <ProductBrowseDialog
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onConfirm={(products) => {
          onBrowsePick(products);
          requestAnimationFrame(() => barcodeRef.current?.focus());
        }}
      />
    </>
  );
}
