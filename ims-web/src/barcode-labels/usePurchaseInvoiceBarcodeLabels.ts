import { useCallback, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { useCanPrintBarcodeLabels } from '../auth/useCanPrintBarcodeLabels';
import type { PurchaseInvoiceRecord } from '../purchase-invoice/repository/types';
import type { PurchaseInvoiceRepository } from '../purchase-invoice/repository/types';
import { generateLabelsFromPurchaseInvoice } from './generator';
import {
  buildBarcodeLabelsPrintHtml,
} from './labelPrintDocument';
import { openHtmlPrintPreview } from '../utils/printPreview';
import type { BarcodeLabelPrintOptions, BarcodeLabelPrintResult } from './types';

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function usePurchaseInvoiceBarcodeLabels(repository: PurchaseInvoiceRepository | undefined) {
  const canPrintBarcodeLabels = useCanPrintBarcodeLabels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState<PurchaseInvoiceRecord | null>(null);
  const [result, setResult] = useState<BarcodeLabelPrintResult | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [printOptions, setPrintOptions] = useState<BarcodeLabelPrintOptions | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const openForBillNo = useCallback(
    async (formattedDocNo: string, lineCountHint?: number) => {
      if (!canPrintBarcodeLabels) {
        window.alert(
          'You do not have permission to print barcode labels. Ask an administrator to enable "Barcode label printing" on your user account.',
        );
        return;
      }

      const apiUp = await probeApiHealth();
      if (!apiUp) {
        window.alert('API is not available. Start the API server to load purchase invoice lines.');
        return;
      }

      if (!repository) {
        window.alert('Purchase invoice repository is not ready.');
        return;
      }

      setBusy(true);
      try {
        const loaded = await repository.loadByFormatted(formattedDocNo.trim());
        setInvoice(loaded);
        setDialogOpen(true);
        void lineCountHint;
      } catch {
        window.alert(`Purchase invoice ${formattedDocNo} was not found.`);
      } finally {
        setBusy(false);
      }
    },
    [canPrintBarcodeLabels, repository],
  );

  const closeDialog = useCallback(() => {
    if (busy) return;
    setDialogOpen(false);
    setInvoice(null);
  }, [busy]);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setResult(null);
    setPreviewHtml(null);
    setPrintOptions(null);
    setInvoice(null);
  }, []);

  const handleGenerate = useCallback(
    async (options: BarcodeLabelPrintOptions) => {
      if (!invoice) return;
      setBusy(true);
      try {
        const generated = await generateLabelsFromPurchaseInvoice(invoice, options);
        if (generated.warnings.length > 0) {
          window.alert(generated.warnings.slice(0, 8).join('\n'));
        }
        if (generated.labels.length === 0) {
          window.alert('No labels to print. Add product lines to the purchase invoice first.');
          return;
        }

        const html = await buildBarcodeLabelsPrintHtml(generated.labels, options);
        const symbologyTitle = options.symbology === 'qrcode' ? 'QR code labels' : 'Barcode labels';
        const title = `${symbologyTitle} — ${generated.labels.length.toLocaleString('en-IN')} label(s)`;

        setResult(generated);
        setPreviewHtml(html);
        setPrintOptions(options);
        setPreviewTitle(title);
        setDialogOpen(false);
        setPreviewOpen(true);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Could not generate labels.');
      } finally {
        setBusy(false);
      }
    },
    [invoice],
  );

  const handlePrint = useCallback(() => {
    if (!previewHtml) return;
    const outcome = openHtmlPrintPreview(previewHtml, {
      title: previewTitle,
      autoPrint: true,
    });
    if (!outcome.ok) {
      window.alert(outcome.message || 'Print failed.');
    }
  }, [previewHtml, previewTitle]);

  const handleDownload = useCallback(() => {
    if (!previewHtml || !printOptions) return;
    const base =
      printOptions.symbology === 'qrcode' ? 'qrcode-labels' : 'barcode-labels';
    downloadTextFile(`${base}.html`, previewHtml, 'text/html;charset=utf-8');
  }, [previewHtml, printOptions]);

  const invoiceCaption = invoice
    ? `Purchase invoice: ${invoice.formattedDocNo} — ${invoice.lines?.length ?? 0} line(s)`
    : '';

  return {
    canPrintBarcodeLabels,
    busy,
    dialogOpen,
    previewOpen,
    invoiceCaption,
    result,
    previewHtml,
    previewTitle,
    openForBillNo,
    closeDialog,
    closePreview,
    handleGenerate,
    handlePrint,
    handleDownload,
  };
}
