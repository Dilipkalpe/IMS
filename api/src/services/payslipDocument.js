function money(n) {
  return (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildPayslipHtml(report, companyName = 'IMS Company') {
  const p = report.payslip;
  const e = report.employee ?? {};
  const earn = p.earnings ?? {};
  const ded = p.deductions ?? {};
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Payslip ${p.payslipNo ?? ''}</title>
<style>
  body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f0f4f8; }
  .amt { text-align: right; }
  .net { font-size: 16px; font-weight: bold; margin-top: 12px; }
  @media print { body { margin: 12px; } }
</style></head><body>
  <h1>${companyName}</h1>
  <div class="sub">Salary Payslip — ${report.periodMonth ?? ''} · Run #${report.runNo ?? ''}</div>
  <table>
    <tr><th>Employee</th><td>${p.employeeCode ?? ''} — ${p.employeeName ?? ''}</td>
        <th>Department</th><td>${p.department ?? e.department ?? ''}</td></tr>
    <tr><th>Designation</th><td>${p.designation ?? e.designation ?? ''}</td>
        <th>Employee Type</th><td>${p.employeeTypeLabel ?? e.employeeType ?? 'Permanent'}</td></tr>
    <tr><th>PAN</th><td>${p.panNo ?? e.panNo ?? ''}</td>
        <th>Salary basis</th><td>${p.salaryCalcMethod ?? ''}</td></tr>
    <tr><th>Paid days</th><td>${p.paidDays ?? 0}</td>
        <th>Hours / OT</th><td>${p.workedHours ?? 0} / ${p.otHours ?? 0}</td></tr>
  </table>
  <table>
    <tr><th colspan="2">Earnings</th><th class="amt">Amount (₹)</th></tr>
    <tr><td colspan="2">Basic</td><td class="amt">${money(earn.basic)}</td></tr>
    <tr><td colspan="2">HRA</td><td class="amt">${money(earn.hra)}</td></tr>
    <tr><td colspan="2">Allowances</td><td class="amt">${money(earn.allowances)}</td></tr>
    <tr><td colspan="2">Bonus</td><td class="amt">${money(earn.bonus)}</td></tr>
    <tr><td colspan="2">Overtime</td><td class="amt">${money(earn.overtime)}</td></tr>
    <tr><th colspan="2">Gross</th><th class="amt">${money(earn.gross)}</th></tr>
  </table>
  <table>
    <tr><th colspan="2">Deductions</th><th class="amt">Amount (₹)</th></tr>
    <tr><td colspan="2">PF</td><td class="amt">${money(ded.pf)}</td></tr>
    <tr><td colspan="2">ESI</td><td class="amt">${money(ded.esi)}</td></tr>
    <tr><td colspan="2">Professional Tax</td><td class="amt">${money(ded.professionalTax)}</td></tr>
    <tr><td colspan="2">TDS</td><td class="amt">${money(ded.tds)}</td></tr>
    <tr><td colspan="2">Other</td><td class="amt">${money(ded.other)}</td></tr>
    <tr><th colspan="2">Total deductions</th><th class="amt">${money(ded.total)}</th></tr>
  </table>
  <p class="net">Net pay: ₹ ${money(p.netPay)}</p>
  <p style="font-size:11px;color:#666;">Payslip No: ${p.payslipNo ?? ''} · Generated ${new Date().toLocaleString()}</p>
</body></html>`;
}
