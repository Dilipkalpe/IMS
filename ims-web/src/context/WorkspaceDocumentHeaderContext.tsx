import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface WorkspaceDocumentHeaderState {
  documentLabel: string | null;
}

const WorkspaceDocumentHeaderContext = createContext<{
  documentLabel: string | null;
  publishDocumentLabel: (label: string | null) => void;
  clearDocumentLabel: () => void;
} | null>(null);

export function WorkspaceDocumentHeaderProvider({ children }: { children: ReactNode }) {
  const [documentLabel, setDocumentLabel] = useState<string | null>(null);

  const publishDocumentLabel = useCallback((label: string | null) => {
    setDocumentLabel(label);
  }, []);

  const clearDocumentLabel = useCallback(() => {
    setDocumentLabel(null);
  }, []);

  const value = useMemo(
    () => ({ documentLabel, publishDocumentLabel, clearDocumentLabel }),
    [clearDocumentLabel, documentLabel, publishDocumentLabel],
  );

  return (
    <WorkspaceDocumentHeaderContext.Provider value={value}>
      {children}
    </WorkspaceDocumentHeaderContext.Provider>
  );
}

export function useWorkspaceDocumentHeader() {
  const ctx = useContext(WorkspaceDocumentHeaderContext);
  if (!ctx) throw new Error('WorkspaceDocumentHeaderProvider is required.');
  return ctx;
}

export function useWorkspaceDocumentHeaderOptional() {
  return useContext(WorkspaceDocumentHeaderContext);
}
