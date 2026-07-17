import type { BarcodeLabelPrintResult } from './types';

import './barcode-labels.scss';



export interface BarcodeLabelPreviewDialogProps {

  open: boolean;

  title: string;

  result: BarcodeLabelPrintResult | null;

  previewHtml: string | null;

  onClose: () => void;

  onPrint: () => void;

  onDownload: () => void;

}



export function BarcodeLabelPreviewDialog({

  open,

  title,

  result,

  previewHtml,

  onClose,

  onPrint,

  onDownload,

}: BarcodeLabelPreviewDialogProps) {

  if (!open || !result) return null;



  return (

    <div className="bl-preview" role="dialog" aria-modal aria-label={title}>

      <button type="button" className="bl-preview__backdrop" aria-label="Close" onClick={onClose} />

      <div className="bl-preview__shell">

        <header className="bl-preview__titlebar">

          <span className="bl-preview__title-icon" aria-hidden>

            {'\uE963'}

          </span>

          <h2 className="bl-preview__title">{title}</h2>

        </header>



        <div className="bl-preview__content">

          {result.warnings.length > 0 ? (

            <div className="bl-preview__warnings" role="status">

              {result.warnings.slice(0, 8).map((w) => (

                <p key={w}>{w}</p>

              ))}

              {result.warnings.length > 8 ? <p>… and {result.warnings.length - 8} more.</p> : null}

            </div>

          ) : null}

          <div className="bl-preview__frame-wrap">

            {previewHtml ? (

              <iframe className="bl-preview__frame" title={title} srcDoc={previewHtml} />

            ) : (

              <p className="bl-preview__loading">Preparing preview…</p>

            )}

          </div>

        </div>



        <footer className="bl-preview__footer">

          <button type="button" className="wpf-action-button" onClick={onPrint}>

            Print labels…

          </button>

          <button type="button" className="wpf-action-button" onClick={onDownload}>

            Download HTML

          </button>

          <button type="button" className="wpf-secondary-button" onClick={onClose}>

            Close

          </button>

        </footer>

      </div>

    </div>

  );

}

