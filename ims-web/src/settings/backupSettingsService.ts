export type ExitBackupPreference = 'always_ask' | 'always_backup' | 'never_ask';

const STORAGE_KEY = 'ims.exitBackupPreference';

export const EXIT_BACKUP_OPTIONS: { value: ExitBackupPreference; label: string; description: string }[] = [
  {
    value: 'always_ask',
    label: 'Always ask',
    description: 'Prompt whether to back up the database when you close the application.',
  },
  {
    value: 'always_backup',
    label: 'Always backup before exit',
    description: 'Create a backup automatically when closing (when supported).',
  },
  {
    value: 'never_ask',
    label: 'Never ask again',
    description: 'Close without backup prompts.',
  },
];

export function loadExitBackupPreference(): ExitBackupPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'always_backup' || raw === 'never_ask') return raw;
    return 'always_ask';
  } catch {
    return 'always_ask';
  }
}

export function saveExitBackupPreference(value: ExitBackupPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}
