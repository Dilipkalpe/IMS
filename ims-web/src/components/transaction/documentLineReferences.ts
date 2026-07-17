/** Structured header reference to an upstream numbered document (mirrors API schemas). */

export interface SalesOrderDocReference {
  soPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface NumberedDocReference {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export function lineHasSalesOrderSource(line: {
  soDocNo?: number | null;
  soLineSr?: number | null;
}): boolean {
  return line.soDocNo != null && line.soLineSr != null;
}

export function lineHasDeliveryChallanSource(line: {
  dcDocNo?: number | null;
  dcLineSr?: number | null;
}): boolean {
  return line.dcDocNo != null && line.dcLineSr != null;
}

export function formatNumberedDocReferenceText(
  refs: readonly { formattedDocNo?: string }[],
): string {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const ref of refs) {
    const label = ref.formattedDocNo?.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels.join(', ');
}

export function collectSoReferencesFromDcLines(
  lines: readonly {
    soPrefix?: string;
    soDocNo?: number;
    soFormattedDocNo?: string;
  }[],
): SalesOrderDocReference[] {
  const map = new Map<string, SalesOrderDocReference>();
  for (const line of lines) {
    if (line.soDocNo == null) continue;
    const soPrefix = (line.soPrefix || 'SO').trim().toUpperCase();
    const docNo = Number(line.soDocNo);
    if (!Number.isFinite(docNo)) continue;
    const key = `${soPrefix}|${docNo}`;
    if (!map.has(key)) {
      map.set(key, {
        soPrefix,
        docNo,
        formattedDocNo: line.soFormattedDocNo?.trim() || `${soPrefix}-${docNo}`,
      });
    }
  }
  return [...map.values()];
}

export function collectDcReferencesFromSiLines(
  lines: readonly {
    dcPrefix?: string;
    dcDocNo?: number;
    dcFormattedDocNo?: string;
  }[],
): NumberedDocReference[] {
  const map = new Map<string, NumberedDocReference>();
  for (const line of lines) {
    if (line.dcDocNo == null) continue;
    const docPrefix = (line.dcPrefix || 'DC').trim().toUpperCase();
    const docNo = Number(line.dcDocNo);
    if (!Number.isFinite(docNo)) continue;
    const key = `${docPrefix}|${docNo}`;
    if (!map.has(key)) {
      map.set(key, {
        docPrefix,
        docNo,
        formattedDocNo: line.dcFormattedDocNo?.trim() || `${docPrefix}-${docNo}`,
      });
    }
  }
  return [...map.values()];
}

export function buildSoReferenceTextFromDcLines(
  lines: Parameters<typeof collectSoReferencesFromDcLines>[0],
): string {
  return formatNumberedDocReferenceText(collectSoReferencesFromDcLines(lines));
}

export function buildDcReferenceTextFromSiLines(
  lines: Parameters<typeof collectDcReferencesFromSiLines>[0],
): string {
  return formatNumberedDocReferenceText(collectDcReferencesFromSiLines(lines));
}
