export function buildDatabaseName(financialYearName, startDate, endDate) {
  const name = String(financialYearName ?? '').trim();
  const normalized = name.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
  if (normalized) {
    const startYear = normalized[1];
    const endYearRaw = normalized[2];
    const endYear = endYearRaw.length === 2 ? `${startYear.slice(0, 2)}${endYearRaw}` : endYearRaw;
    return `IWM_${startYear.slice(-2)}${endYear.slice(-2)}`;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const yy = String(start.getFullYear()).slice(-2);
  const zz = String(end.getFullYear()).slice(-2);
  return `IWM_${yy}${zz}`;
}

