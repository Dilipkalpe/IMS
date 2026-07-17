const EXPORT_ALL_THRESHOLD = 2500;

/** WPF: SalesOrdersViewModel.ResolveExportRowsAsync */
export async function resolveListExportRows<TRow>(options: {
  currentPageRows: TRow[];
  totalRecords: number;
  fetchAll: () => Promise<TRow[]>;
  docLabelPlural: string;
}): Promise<TRow[]> {
  const { currentPageRows, totalRecords, fetchAll, docLabelPlural } = options;

  if (totalRecords === 0 || currentPageRows.length === 0) {
    return [];
  }

  if (totalRecords <= EXPORT_ALL_THRESHOLD) {
    return fetchAll();
  }

  const exportAll = window.confirm(
    `${totalRecords.toLocaleString()} ${docLabelPlural} match your filters.\n\n` +
      `OK — export all (may take several minutes)\n` +
      `Cancel — export current page only (${currentPageRows.length} row(s))`,
  );

  return exportAll ? fetchAll() : currentPageRows;
}
