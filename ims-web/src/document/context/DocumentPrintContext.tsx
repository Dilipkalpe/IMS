import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DocumentPrintService, documentPrintService } from '../providers/documentPrintService';
import type { DocumentPrintProviders } from '../providers/types';

const DocumentPrintContext = createContext<DocumentPrintService>(documentPrintService);

export function DocumentPrintProvider({
  providers,
  children,
}: {
  providers?: DocumentPrintProviders;
  children: ReactNode;
}) {
  const service = useMemo(
    () => (providers ? new DocumentPrintService(providers) : documentPrintService),
    [providers],
  );
  return <DocumentPrintContext.Provider value={service}>{children}</DocumentPrintContext.Provider>;
}

export function useDocumentPrintService(): DocumentPrintService {
  return useContext(DocumentPrintContext);
}
