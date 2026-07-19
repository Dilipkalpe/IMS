import { createContext, useContext, type ReactNode } from 'react';



interface ProcurementHubTabContextValue {

  activeTab: string;

  setActiveTab: (key: string) => void;

}



const ProcurementHubTabContext = createContext<ProcurementHubTabContextValue | null>(null);



export function ProcurementHubTabProvider({

  activeTab,

  setActiveTab,

  children,

}: ProcurementHubTabContextValue & { children: ReactNode }) {

  return (

    <ProcurementHubTabContext.Provider value={{ activeTab, setActiveTab }}>

      {children}

    </ProcurementHubTabContext.Provider>

  );

}



export function useProcurementHubTab(): ProcurementHubTabContextValue {

  const ctx = useContext(ProcurementHubTabContext);

  if (!ctx) throw new Error('ProcurementHubTabProvider is required.');

  return ctx;

}


