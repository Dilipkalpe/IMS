import { useEffect } from 'react';
import { useWorkspaceDocumentHeader } from '../../context/WorkspaceDocumentHeaderContext';
import {
  workspaceDocumentHeaderLabel,
  type WorkspaceHeaderDocument,
} from './workspaceDocumentHeaderLabel';

export function usePublishWorkspaceDocumentHeader(
  activeDocument: WorkspaceHeaderDocument | undefined,
) {
  const { publishDocumentLabel, clearDocumentLabel } = useWorkspaceDocumentHeader();

  useEffect(() => {
    publishDocumentLabel(workspaceDocumentHeaderLabel(activeDocument));
  }, [activeDocument, publishDocumentLabel]);

  useEffect(() => () => clearDocumentLabel(), [clearDocumentLabel]);
}
