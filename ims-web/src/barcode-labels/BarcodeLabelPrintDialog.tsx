import { useMemo, useState } from 'react';

import {

  BARCODE_LABEL_FORMATS,

  CUSTOM_FORMAT_ID,

  formatSizeLabel,

  resolveSelectedFormat,

} from './catalog';

import type { BarcodeLabelPrintOptions, BarcodeLabelSymbology } from './types';

import './barcode-labels.scss';



export interface BarcodeLabelPrintDialogProps {

  open: boolean;

  invoiceCaption: string;

  busy?: boolean;

  onClose: () => void;

  onGenerate: (options: BarcodeLabelPrintOptions) => void;

}



const DEFAULT_FORMAT_ID = 'sheet_30';



export function BarcodeLabelPrintDialog({

  open,

  invoiceCaption,

  busy = false,

  onClose,

  onGenerate,

}: BarcodeLabelPrintDialogProps) {

  const [formatId, setFormatId] = useState(DEFAULT_FORMAT_ID);

  const [symbology, setSymbology] = useState<BarcodeLabelSymbology>('code128');

  const [copies, setCopies] = useState('1');

  const [quantitySource, setQuantitySource] = useState<'purchase' | 'custom'>('purchase');

  const [customQty, setCustomQty] = useState('1');

  const [customWidth, setCustomWidth] = useState('50');

  const [customHeight, setCustomHeight] = useState('25');



  const preset = useMemo(

    () => BARCODE_LABEL_FORMATS.find((f) => f.id === formatId) ?? BARCODE_LABEL_FORMATS[0],

    [formatId],

  );



  const resolvedFormat = useMemo(() => {

    const w = Number.parseFloat(customWidth);

    const h = Number.parseFloat(customHeight);

    return resolveSelectedFormat(formatId, w, h);

  }, [customHeight, customWidth, formatId]);



  const isCustom = formatId === CUSTOM_FORMAT_ID;



  if (!open) return null;



  const handleGenerate = () => {

    const format = resolvedFormat;

    if (!format) {

      window.alert('Enter valid custom label width and height (mm), both greater than zero.');

      return;

    }



    let copyMultiplier = Number.parseInt(copies, 10);

    if (!Number.isFinite(copyMultiplier) || copyMultiplier < 1) copyMultiplier = 1;



    let customQuantityPerLine = Number.parseInt(customQty, 10);

    if (!Number.isFinite(customQuantityPerLine) || customQuantityPerLine < 1) {

      if (quantitySource === 'custom') {

        window.alert('Enter a custom quantity of at least 1.');

        return;

      }

      customQuantityPerLine = 1;

    }



    onGenerate({

      format,

      symbology,

      quantitySource,

      customQuantityPerLine,

      copyMultiplier,

    });

  };



  return (

    <div className="bl-dialog" role="dialog" aria-modal aria-label="Barcode Label Print">

      <button type="button" className="bl-dialog__backdrop" aria-label="Close" onClick={onClose} />

      <div className="bl-dialog__shell">

        <header className="bl-dialog__titlebar">

          <span className="bl-dialog__title-icon" aria-hidden>

            {'\uE963'}

          </span>

          <div className="bl-dialog__titleblock">

            <h2 className="bl-dialog__title">Barcode label print</h2>

            <p className="bl-dialog__caption">{invoiceCaption}</p>

          </div>

        </header>



        <div className="bl-dialog__content">

          <section className="bl-dialog__card">

            <h3 className="bl-dialog__section-title">Label sheet layout</h3>

            <p className="bl-dialog__section-hint">

              Select a standard A4 sheet preset or define a custom size.

            </p>

            <div className="bl-format-table-wrap">

              <table className="bl-format-table">

                <thead>

                  <tr>

                    <th className="bl-format-table__pick" aria-label="Select" />

                    <th>Option</th>

                    <th>Size</th>

                    <th>Suggested use</th>

                  </tr>

                </thead>

                <tbody>

                  {BARCODE_LABEL_FORMATS.map((row) => {

                    const selected = formatId === row.id;

                    const size =

                      row.id === CUSTOM_FORMAT_ID

                        ? 'Custom'

                        : formatSizeLabel(row.widthMm, row.heightMm);

                    const optionLabel =

                      row.id === CUSTOM_FORMAT_ID

                        ? row.displayName

                        : `${row.displayName}${row.recommended ? ' ⭐' : ''}`;

                    return (

                      <tr

                        key={row.id}

                        className={selected ? 'bl-format-table__row--selected' : undefined}

                        onClick={() => !busy && setFormatId(row.id)}

                      >

                        <td className="bl-format-table__pick">

                          <input

                            type="radio"

                            name="label-format"

                            checked={selected}

                            disabled={busy}

                            onChange={() => setFormatId(row.id)}

                          />

                        </td>

                        <td className="bl-format-table__option">{optionLabel}</td>

                        <td className="bl-format-table__size">{size}</td>

                        <td className="bl-format-table__use">{row.suggestedUse ?? row.description}</td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>



            {isCustom ? (

              <div className="bl-dialog__custom-size">

                <label className="bl-dialog__field bl-dialog__field--inline">

                  <span>Width (mm)</span>

                  <input

                    className="wpf-form-input"

                    type="number"

                    min={1}

                    step={0.1}

                    value={customWidth}

                    disabled={busy}

                    onChange={(e) => setCustomWidth(e.target.value)}

                  />

                </label>

                <label className="bl-dialog__field bl-dialog__field--inline">

                  <span>Height (mm)</span>

                  <input

                    className="wpf-form-input"

                    type="number"

                    min={1}

                    step={0.1}

                    value={customHeight}

                    disabled={busy}

                    onChange={(e) => setCustomHeight(e.target.value)}

                  />

                </label>

                {resolvedFormat ? (

                  <p className="bl-dialog__custom-preview">

                    Layout preview: {resolvedFormat.columnsPerPage} × {resolvedFormat.rowsPerPage}{' '}

                    labels per A4 (

                    {resolvedFormat.labelsPerSheet ??

                      resolvedFormat.columnsPerPage * resolvedFormat.rowsPerPage}{' '}

                    total)

                  </p>

                ) : null}

              </div>

            ) : (

              <p className="bl-dialog__format-summary">

                {preset.displayName}

                {preset.recommended ? ' ⭐' : ''} — {formatSizeLabel(preset.widthMm, preset.heightMm)} —{' '}

                {preset.suggestedUse}

              </p>

            )}

          </section>



          <section className="bl-dialog__card">

            <h3 className="bl-dialog__section-title">Print symbology</h3>

            <p className="bl-dialog__section-hint">Choose barcode or QR code for each label.</p>

            <div className="bl-symbology-cards">

              <button

                type="button"

                className={`bl-symbology-card${symbology === 'code128' ? ' bl-symbology-card--active' : ''}`}

                disabled={busy}

                onClick={() => setSymbology('code128')}

              >

                <span className="bl-symbology-card__icon" aria-hidden>

                  ||| || ||

                </span>

                <span className="bl-symbology-card__title">Code 128 barcode</span>

                <span className="bl-symbology-card__desc">Linear barcode with human-readable text</span>

              </button>

              <button

                type="button"

                className={`bl-symbology-card${symbology === 'qrcode' ? ' bl-symbology-card--active' : ''}`}

                disabled={busy}

                onClick={() => setSymbology('qrcode')}

              >

                <span className="bl-symbology-card__icon bl-symbology-card__icon--qr" aria-hidden>

                  {'\uED14'}

                </span>

                <span className="bl-symbology-card__title">QR code</span>

                <span className="bl-symbology-card__desc">2D code encoding product barcode</span>

              </button>

            </div>

          </section>



          <section className="bl-dialog__card">

            <h3 className="bl-dialog__section-title">Copies &amp; quantity</h3>

            <div className="bl-dialog__options-grid">

              <div>

                <label className="bl-dialog__field">

                  <span>Number of copies (optional)</span>

                  <input

                    className="wpf-form-input"

                    value={copies}

                    disabled={busy}

                    onChange={(e) => setCopies(e.target.value)}

                  />

                </label>



                <fieldset className="bl-dialog__fieldset">

                  <legend>Print quantity source</legend>

                  <label className="bl-dialog__radio">

                    <input

                      type="radio"

                      name="qty-source"

                      checked={quantitySource === 'purchase'}

                      disabled={busy}

                      onChange={() => setQuantitySource('purchase')}

                    />

                    <span>Purchase quantity</span>

                  </label>

                  <label className="bl-dialog__radio">

                    <input

                      type="radio"

                      name="qty-source"

                      checked={quantitySource === 'custom'}

                      disabled={busy}

                      onChange={() => setQuantitySource('custom')}

                    />

                    <span>Custom quantity per line</span>

                  </label>

                </fieldset>

              </div>



              <label

                className={`bl-dialog__field bl-dialog__field--indent${quantitySource !== 'custom' ? ' bl-dialog__field--disabled' : ''}`}

              >

                <span>Custom quantity</span>

                <input

                  className="wpf-form-input"

                  value={customQty}

                  disabled={busy || quantitySource !== 'custom'}

                  onChange={(e) => setCustomQty(e.target.value)}

                />

              </label>

            </div>

          </section>

        </div>



        <footer className="bl-dialog__footer">

          <button type="button" className="wpf-secondary-button" disabled={busy} onClick={onClose}>

            Cancel

          </button>

          <button type="button" className="wpf-action-button" disabled={busy} onClick={handleGenerate}>

            {busy ? 'Generating…' : 'Generate labels'}

          </button>

        </footer>

      </div>

    </div>

  );

}

