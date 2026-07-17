import type { DocumentPrintProviders } from './types';
import { apiBillFormatProvider } from './apiBillFormatProvider';
import { stubExportProvider } from './stubExportProvider';
import { stubPrintProvider } from './stubPrintProvider';

/** Phase 2.2 — API bill templates + browser print (export still stub). */
export const apiDocumentPrintProviders: DocumentPrintProviders = {
  printProvider: stubPrintProvider,
  billFormatProvider: apiBillFormatProvider,
  exportProvider: stubExportProvider,
};
