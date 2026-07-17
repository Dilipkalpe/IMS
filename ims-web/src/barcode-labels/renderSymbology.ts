import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { BarcodeLabelSymbology } from './types';

export async function renderSymbologyDataUrl(
  symbology: BarcodeLabelSymbology,
  value: string,
  widthPx: number,
  heightPx: number,
): Promise<string | null> {
  const payload = value.trim();
  if (!payload) return null;

  if (symbology === 'qrcode') {
    const size = Math.max(64, Math.min(widthPx, heightPx));
    try {
      return await QRCode.toDataURL(payload, { width: size, margin: 1, errorCorrectionLevel: 'M' });
    } catch {
      return null;
    }
  }

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, payload, {
      format: 'CODE128',
      width: 2,
      height: Math.max(32, heightPx),
      displayValue: true,
      fontSize: 12,
      margin: 4,
      textMargin: 2,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
