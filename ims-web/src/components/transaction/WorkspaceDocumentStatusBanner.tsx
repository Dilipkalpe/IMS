import { useMemo } from 'react';
import { isInterStateSupply, taxContextFromHeader, validateGstTax } from '../../sales-invoice/calculations';

export interface WorkspaceDocumentStatusInput {
  statusMessage: string | null;
  isDirty: boolean;
  isSaving: boolean;
  header: {
    placeOfSupply?: string;
    sellerGstin?: string;
    customerGstin?: string;
  };
}

export function WorkspaceDocumentStatusBanner({
  statusMessage,
  isDirty,
  isSaving,
  header,
}: WorkspaceDocumentStatusInput) {
  const taxExtras = useMemo(() => {
    const taxContext = taxContextFromHeader({
      placeOfSupply: header.placeOfSupply,
      sellerGstin: header.sellerGstin,
      customerGstin: header.customerGstin,
    });
    return {
      isInterState: isInterStateSupply(taxContext),
      gstWarnings: validateGstTax(taxContext).filter((m) => m.severity === 'warning'),
    };
  }, [header.placeOfSupply, header.sellerGstin, header.customerGstin]);

  if (!statusMessage && !isDirty && !isSaving) return null;

  return (
    <span className="si-status-banner si-workspace__status" role="status">
      {statusMessage}
      {isDirty ? ' · Unsaved changes' : ''}
      {isSaving ? ' · Saving…' : ''}
      {taxExtras.isInterState ? ' · IGST (inter-state)' : header.placeOfSupply ? ' · CGST+SGST (intra-state)' : ''}
      {taxExtras.gstWarnings.length > 0 ? ` · ${taxExtras.gstWarnings[0].message}` : ''}
    </span>
  );
}

export function WorkspaceTabBarStatus({
  activeTabId,
  documents,
}: {
  activeTabId: string | undefined;
  documents: Record<string, WorkspaceDocumentStatusInput>;
}) {
  const doc = activeTabId ? documents[activeTabId] : undefined;
  if (!doc) return null;
  return <WorkspaceDocumentStatusBanner {...doc} />;
}
