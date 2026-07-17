import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchEditDeletePolicy, verifyEditDeletePassword } from '../api/security';
import { ConfirmationPasswordDialog } from '../components/security/ConfirmationPasswordDialog';

interface PendingAuth {
  action: 'edit' | 'delete';
  module: string;
  recordKey: string;
  recordLabel: string;
  resolve: (authorized: boolean) => void;
}

interface EditDeleteGuardContextValue {
  authorizeEdit: (module: string, recordKey: string, recordLabel: string) => Promise<boolean>;
  authorizeDelete: (module: string, recordKey: string, recordLabel: string) => Promise<boolean>;
}

const EditDeleteGuardContext = createContext<EditDeleteGuardContextValue | null>(null);

function confirmDelete(module: string, recordKey: string, recordLabel: string): boolean {
  const label = recordLabel.trim() || recordKey.trim() || 'this record';
  const message = module.trim()
    ? `Are you sure you want to delete "${label}" from ${module}?\n\nThis action cannot be undone.`
    : `Are you sure you want to delete "${label}"?\n\nThis action cannot be undone.`;
  return window.confirm(message);
}

/** WPF: EditDeleteGuard */
export function EditDeleteGuardProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingAuth | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const authorize = useCallback(
    async (action: 'edit' | 'delete', module: string, recordKey: string, recordLabel: string) => {
      if (action === 'delete' && !confirmDelete(module, recordKey, recordLabel)) {
        return false;
      }

      const policy = await fetchEditDeletePolicy();
      if (!policy.confirmationRequired) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        setErrorMessage(null);
        setPending({ action, module, recordKey, recordLabel, resolve });
      });
    },
    [],
  );

  const authorizeEdit = useCallback(
    (module: string, recordKey: string, recordLabel: string) =>
      authorize('edit', module, recordKey, recordLabel),
    [authorize],
  );

  const authorizeDelete = useCallback(
    (module: string, recordKey: string, recordLabel: string) =>
      authorize('delete', module, recordKey, recordLabel),
    [authorize],
  );

  const closePending = useCallback((authorized: boolean) => {
    if (pending) pending.resolve(authorized);
    setPending(null);
    setErrorMessage(null);
    setBusy(false);
  }, [pending]);

  const submitPassword = useCallback(
    async (password: string) => {
      if (!pending) return;
      if (!password.trim()) {
        setErrorMessage('Confirmation password is required.');
        return;
      }

      setBusy(true);
      setErrorMessage(null);
      try {
        const ok = await verifyEditDeletePassword({
          password,
          action: pending.action,
          module: pending.module,
          recordKey: pending.recordKey,
        });
        if (!ok) {
          setErrorMessage('Incorrect confirmation password. Edit/delete was not allowed.');
          setBusy(false);
          return;
        }
        closePending(true);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Verification failed.');
        setBusy(false);
      }
    },
    [closePending, pending],
  );

  const value = useMemo(
    () => ({ authorizeEdit, authorizeDelete }),
    [authorizeDelete, authorizeEdit],
  );

  const dialogTitle = pending?.action === 'delete' ? 'Confirm delete' : 'Confirm edit';
  const dialogDescription = pending
    ? pending.action === 'delete'
      ? `Enter the confirmation password to delete "${pending.recordLabel || pending.recordKey}" (${pending.recordKey}) in ${pending.module}.`
      : `Enter the confirmation password to edit "${pending.recordLabel || pending.recordKey}" (${pending.recordKey}) in ${pending.module}.`
    : '';

  return (
    <EditDeleteGuardContext.Provider value={value}>
      {children}
      <ConfirmationPasswordDialog
        open={pending != null}
        title={dialogTitle}
        description={dialogDescription}
        errorMessage={errorMessage}
        busy={busy}
        onSubmit={(password) => void submitPassword(password)}
        onCancel={() => closePending(false)}
      />
    </EditDeleteGuardContext.Provider>
  );
}

export function useEditDeleteGuard() {
  const ctx = useContext(EditDeleteGuardContext);
  if (!ctx) throw new Error('EditDeleteGuardProvider is required.');
  return ctx;
}
