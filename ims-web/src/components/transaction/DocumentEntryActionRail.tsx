import type { RefObject } from 'react';
import { FIELD_FOCUS_KEY } from '../../keyboard/formKeyboardNavigation';

export interface DocumentEntryActionDef {
  icon: string;
  label: string;
  action: string;
  variant: 'primary' | 'secondary';
  key: string;
  ref?: RefObject<HTMLButtonElement | null>;
  disabled?: boolean;
  title?: string;
}

const BASE_ACTIONS: DocumentEntryActionDef[] = [
  { icon: '\uE710', label: 'New', action: 'New Bill', variant: 'primary', key: 'action-new' },
  { icon: '\uE74E', label: 'Save', action: 'Save', variant: 'primary', key: 'action-save' },
  { icon: '\uE74E', label: 'Next', action: 'Save, Next (F11)', variant: 'secondary', key: 'action-next' },
  { icon: '\uE749', label: 'S+P', action: 'Save, Print, Next (F12)', variant: 'primary', key: 'action-sp' },
  { icon: '\uE749', label: 'Print', action: 'Print', variant: 'primary', key: 'action-print' },
];

const EXTENDED_ACTIONS: DocumentEntryActionDef[] = [
  { icon: '\uE721', label: 'Search', action: 'Search (F9)', variant: 'secondary', key: 'action-search', title: 'Search (F9)' },
  { icon: '\uE8C8', label: 'Dup', action: 'Duplicate', variant: 'secondary', key: 'action-dup', title: 'Duplicate document' },
  { icon: '\uE749', label: 'Prev', action: 'Print Previous', variant: 'secondary', key: 'action-print-prev', title: 'Print previous document' },
  { icon: '\uE711', label: 'Close', action: 'Close', variant: 'secondary', key: 'action-close' },
];

export function buildDocumentEntryActions(options?: {
  saveButtonRef?: RefObject<HTMLButtonElement | null>;
  includeExtended?: boolean;
  extraActions?: DocumentEntryActionDef[];
  disabled?: boolean;
}): DocumentEntryActionDef[] {
  const actions: DocumentEntryActionDef[] = BASE_ACTIONS.map((a) => ({
    ...a,
    ref: a.key === 'action-save' ? options?.saveButtonRef : undefined,
    disabled: options?.disabled,
  }));
  if (options?.includeExtended !== false) {
    actions.push(...EXTENDED_ACTIONS.map((a) => ({ ...a, disabled: options?.disabled })));
  } else {
    actions.push({ icon: '\uE711', label: 'Close', action: 'Close', variant: 'secondary', key: 'action-close', disabled: options?.disabled });
  }
  if (options?.extraActions?.length) {
    const closeIdx = actions.findIndex((a) => a.action === 'Close');
    actions.splice(closeIdx, 0, ...options.extraActions);
  }
  return actions;
}

export function DocumentEntryActionRail({
  actions,
  onAction,
}: {
  actions: DocumentEntryActionDef[];
  onAction: (action: string) => void;
}) {
  return (
    <div className="si-action-rail" role="toolbar" aria-label="Document actions">
      {actions.map((btn) => (
        <button
          key={btn.key}
          ref={btn.ref}
          type="button"
          className={`si-action-btn si-action-btn--${btn.variant}`}
          title={
            btn.title ??
            `${btn.action}${btn.action === 'Save, Next (F11)' ? ' (F11)' : btn.action === 'Save, Print, Next (F12)' ? ' (F12)' : btn.action === 'Search (F9)' ? ' (F9)' : ''}`
          }
          {...{ [FIELD_FOCUS_KEY]: btn.key }}
          onClick={() => void onAction(btn.action)}
          disabled={btn.disabled}
        >
          <span className="icon-text">{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
