import { createContext, useContext, type ReactNode } from 'react';

interface SalesHubTabContextValue {
  activeTab: string;
  setActiveTab: (key: string) => void;
}

const SalesHubTabContext = createContext<SalesHubTabContextValue | null>(null);

export function SalesHubTabProvider({
  activeTab,
  setActiveTab,
  children,
}: SalesHubTabContextValue & { children: ReactNode }) {
  return (
    <SalesHubTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SalesHubTabContext.Provider>
  );
}

export function useSalesHubTab(): SalesHubTabContextValue {
  const ctx = useContext(SalesHubTabContext);
  if (!ctx) throw new Error('SalesHubTabProvider is required.');
  return ctx;
}
