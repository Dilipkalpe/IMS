export const LAYOUT_SCHEMA_VERSION = 2;

export function emptyReportLayout(paperSize) {
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    page: {
      paperSizeKey: paperSize?.key ?? 'A4_PORTRAIT',
      orientation: paperSize?.orientation ?? 'portrait',
      widthMm: paperSize?.widthMm ?? 210,
      heightMm: paperSize?.heightMm ?? 297,
      marginsMm: paperSize?.marginsMm ?? { top: 10, right: 10, bottom: 10, left: 10 }
    },
    theme: {
      fontFamily: 'Segoe UI',
      baseFontSizePt: 10,
      primaryColor: '#1e293b',
      textColor: '#0f172a',
      borderColor: '#334155'
    },
    options: {
      showLogo: true,
      showGst: true,
      showAmountInWords: true,
      watermark: 'original'
    },
    elements: []
  };
}

export function validateLayoutJson(layout) {
  if (!layout || typeof layout !== 'object') {
    throw new Error('layoutJson must be an object.');
  }
  if (!Array.isArray(layout.elements)) {
    throw new Error('layoutJson.elements must be an array.');
  }
  const version = Number(layout.schemaVersion) || 1;
  if (version > LAYOUT_SCHEMA_VERSION) {
    throw new Error(`Unsupported layout schemaVersion ${version}.`);
  }
  return layout;
}
