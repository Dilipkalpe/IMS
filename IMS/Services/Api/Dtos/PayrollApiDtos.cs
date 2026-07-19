using System.Text.Json.Serialization;

namespace IMS.Services.Api.Dtos;

public sealed class PayrollEmployeeDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("employeeCode")]
    public string EmployeeCode { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("designation")]
    public string? Designation { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("dateOfJoining")]
    public DateTime? DateOfJoining { get; set; }

    [JsonPropertyName("bankAccountNo")]
    public string? BankAccountNo { get; set; }

    [JsonPropertyName("bankIfsc")]
    public string? BankIfsc { get; set; }

    [JsonPropertyName("panNo")]
    public string? PanNo { get; set; }

    [JsonPropertyName("uanNo")]
    public string? UanNo { get; set; }

    [JsonPropertyName("esiNo")]
    public string? EsiNo { get; set; }

    [JsonPropertyName("linkedUserEmployeeId")]
    public string? LinkedUserEmployeeId { get; set; }

    [JsonPropertyName("payableAccountCode")]
    public string? PayableAccountCode { get; set; }

    [JsonPropertyName("payableAccountName")]
    public string? PayableAccountName { get; set; }

    [JsonPropertyName("employeeType")]
    public string EmployeeType { get; set; } = "permanent";

    [JsonPropertyName("monthlySalary")]
    public decimal MonthlySalary { get; set; }

    [JsonPropertyName("dailyWage")]
    public decimal DailyWage { get; set; }

    [JsonPropertyName("contractStartDate")]
    public DateTime? ContractStartDate { get; set; }

    [JsonPropertyName("contractEndDate")]
    public DateTime? ContractEndDate { get; set; }

    [JsonPropertyName("basicSalary")]
    public decimal BasicSalary { get; set; }

    [JsonPropertyName("hraPercent")]
    public decimal HraPercent { get; set; }

    [JsonPropertyName("hraAmount")]
    public decimal HraAmount { get; set; }

    [JsonPropertyName("otherAllowances")]
    public decimal OtherAllowances { get; set; }

    [JsonPropertyName("bonusPercent")]
    public decimal BonusPercent { get; set; }

    [JsonPropertyName("otherDeductions")]
    public decimal OtherDeductions { get; set; }

    [JsonPropertyName("otRatePerHour")]
    public decimal OtRatePerHour { get; set; }

    [JsonPropertyName("paidDaysPerMonth")]
    public decimal PaidDaysPerMonth { get; set; }

    [JsonPropertyName("tdsPercent")]
    public decimal TdsPercent { get; set; }

    [JsonPropertyName("professionalTaxAmount")]
    public decimal ProfessionalTaxAmount { get; set; }

    [JsonPropertyName("pfApplicable")]
    public bool PfApplicable { get; set; } = true;

    [JsonPropertyName("esiApplicable")]
    public bool EsiApplicable { get; set; } = true;

    [JsonPropertyName("ptApplicable")]
    public bool PtApplicable { get; set; } = true;

    [JsonPropertyName("stateCode")]
    public string? StateCode { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class AttendanceRecordDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("employeeCode")]
    public string EmployeeCode { get; set; } = string.Empty;

    [JsonPropertyName("employeeName")]
    public string? EmployeeName { get; set; }

    [JsonPropertyName("attendanceDate")]
    public DateTime? AttendanceDate { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "present";

    [JsonPropertyName("checkIn")]
    public string? CheckIn { get; set; }

    [JsonPropertyName("checkOut")]
    public string? CheckOut { get; set; }

    [JsonPropertyName("workedHours")]
    public decimal WorkedHours { get; set; }

    [JsonPropertyName("overtimeHours")]
    public decimal OvertimeHours { get; set; }

    [JsonPropertyName("remark")]
    public string? Remark { get; set; }
}

public sealed class PayrollEarningsDto
{
    [JsonPropertyName("basic")]
    public decimal Basic { get; set; }

    [JsonPropertyName("hra")]
    public decimal Hra { get; set; }

    [JsonPropertyName("allowances")]
    public decimal Allowances { get; set; }

    [JsonPropertyName("bonus")]
    public decimal Bonus { get; set; }

    [JsonPropertyName("overtime")]
    public decimal Overtime { get; set; }

    [JsonPropertyName("gross")]
    public decimal Gross { get; set; }
}

public sealed class PayrollDeductionsDto
{
    [JsonPropertyName("pf")]
    public decimal Pf { get; set; }

    [JsonPropertyName("esi")]
    public decimal Esi { get; set; }

    [JsonPropertyName("professionalTax")]
    public decimal ProfessionalTax { get; set; }

    [JsonPropertyName("tds")]
    public decimal Tds { get; set; }

    [JsonPropertyName("other")]
    public decimal Other { get; set; }

    [JsonPropertyName("total")]
    public decimal Total { get; set; }
}

public sealed class PayrollLineDto
{
    [JsonPropertyName("employeeCode")]
    public string? EmployeeCode { get; set; }

    [JsonPropertyName("employeeName")]
    public string? EmployeeName { get; set; }

    [JsonPropertyName("employeeType")]
    public string? EmployeeType { get; set; }

    [JsonPropertyName("employeeTypeLabel")]
    public string? EmployeeTypeLabel { get; set; }

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("paidDays")]
    public decimal PaidDays { get; set; }

    [JsonPropertyName("workedHours")]
    public decimal WorkedHours { get; set; }

    [JsonPropertyName("otHours")]
    public decimal OtHours { get; set; }

    [JsonPropertyName("earnings")]
    public PayrollEarningsDto? Earnings { get; set; }

    [JsonPropertyName("deductions")]
    public PayrollDeductionsDto? Deductions { get; set; }

    [JsonPropertyName("taxableIncome")]
    public decimal TaxableIncome { get; set; }

    [JsonPropertyName("netPay")]
    public decimal NetPay { get; set; }

    [JsonPropertyName("payslipNo")]
    public string? PayslipNo { get; set; }
}

public sealed class PayrollRunDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("runNo")]
    public int RunNo { get; set; }

    [JsonPropertyName("periodMonth")]
    public string? PeriodMonth { get; set; }

    [JsonPropertyName("periodFrom")]
    public DateTime? PeriodFrom { get; set; }

    [JsonPropertyName("periodTo")]
    public DateTime? PeriodTo { get; set; }

    [JsonPropertyName("processedAt")]
    public DateTime? ProcessedAt { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "draft";

    [JsonPropertyName("employeeCount")]
    public int EmployeeCount { get; set; }

    [JsonPropertyName("totalGross")]
    public decimal TotalGross { get; set; }

    [JsonPropertyName("totalDeductions")]
    public decimal TotalDeductions { get; set; }

    [JsonPropertyName("totalNet")]
    public decimal TotalNet { get; set; }

    [JsonPropertyName("totalTds")]
    public decimal TotalTds { get; set; }

    [JsonPropertyName("lines")]
    public List<PayrollLineDto> Lines { get; set; } = [];

    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; set; }

    [JsonPropertyName("paymentVoucherNos")]
    public List<int> PaymentVoucherNos { get; set; } = [];

    [JsonPropertyName("receiptVoucherNos")]
    public List<int> ReceiptVoucherNos { get; set; } = [];

    [JsonPropertyName("cashBank")]
    public string? CashBank { get; set; }

    [JsonPropertyName("paymentMode")]
    public string? PaymentMode { get; set; }
}

public sealed class PostPayrollPaymentRequestDto
{
    [JsonPropertyName("cashBank")]
    public string CashBank { get; set; } = "BANK";

    [JsonPropertyName("paymentMode")]
    public string PaymentMode { get; set; } = "per_employee";

    [JsonPropertyName("consolidatedAccountCode")]
    public string ConsolidatedAccountCode { get; set; } = "SAL-PAYROLL";

    [JsonPropertyName("voucherDate")]
    public DateTime? VoucherDate { get; set; }

    [JsonPropertyName("createAccrualReceipt")]
    public bool CreateAccrualReceipt { get; set; } = true;

    [JsonPropertyName("createStatutoryPayments")]
    public bool CreateStatutoryPayments { get; set; }

    [JsonPropertyName("paidBy")]
    public string? PaidBy { get; set; }
}

public sealed class PostPayrollPaymentResultDto
{
    [JsonPropertyName("run")]
    public PayrollRunDto? Run { get; set; }

    [JsonPropertyName("paymentVoucherNos")]
    public List<int> PaymentVoucherNos { get; set; } = [];

    [JsonPropertyName("receiptVoucherNos")]
    public List<int> ReceiptVoucherNos { get; set; } = [];

    [JsonPropertyName("message")]
    public string? Message { get; set; }
}

public sealed class ProcessPayrollRequestDto
{
    [JsonPropertyName("periodMonth")]
    public string PeriodMonth { get; set; } = string.Empty;

    [JsonPropertyName("bonusPercent")]
    public decimal BonusPercent { get; set; }

    [JsonPropertyName("processedBy")]
    public string? ProcessedBy { get; set; }

    [JsonPropertyName("remark")]
    public string? Remark { get; set; }

    [JsonPropertyName("reprocess")]
    public bool Reprocess { get; set; }
}

public sealed class PayslipReportDto
{
    [JsonPropertyName("runNo")]
    public int RunNo { get; set; }

    [JsonPropertyName("periodMonth")]
    public string? PeriodMonth { get; set; }

    [JsonPropertyName("payslip")]
    public PayrollLineDto? Payslip { get; set; }

    [JsonPropertyName("employee")]
    public PayrollEmployeeDto? Employee { get; set; }
}

public sealed class PayrollTaxSummaryDto
{
    [JsonPropertyName("runNo")]
    public int RunNo { get; set; }

    [JsonPropertyName("periodMonth")]
    public string? PeriodMonth { get; set; }

    [JsonPropertyName("totals")]
    public PayrollTaxTotalsDto? Totals { get; set; }

    [JsonPropertyName("employees")]
    public List<PayrollTaxEmployeeRowDto> Employees { get; set; } = [];
}

public sealed class PayrollTaxTotalsDto
{
    [JsonPropertyName("gross")]
    public decimal Gross { get; set; }

    [JsonPropertyName("tds")]
    public decimal Tds { get; set; }

    [JsonPropertyName("pf")]
    public decimal Pf { get; set; }

    [JsonPropertyName("esi")]
    public decimal Esi { get; set; }

    [JsonPropertyName("net")]
    public decimal Net { get; set; }
}

public sealed class PayrollTaxEmployeeRowDto
{
    [JsonPropertyName("employeeCode")]
    public string? EmployeeCode { get; set; }

    [JsonPropertyName("employeeName")]
    public string? EmployeeName { get; set; }

    [JsonPropertyName("employeeType")]
    public string? EmployeeType { get; set; }

    [JsonPropertyName("employeeTypeLabel")]
    public string? EmployeeTypeLabel { get; set; }

    [JsonPropertyName("panNo")]
    public string? PanNo { get; set; }

    [JsonPropertyName("gross")]
    public decimal Gross { get; set; }

    [JsonPropertyName("tds")]
    public decimal Tds { get; set; }

    [JsonPropertyName("netPay")]
    public decimal NetPay { get; set; }
}

public sealed class StaffHoursReportDto
{
    [JsonPropertyName("periodMonth")]
    public string? PeriodMonth { get; set; }

    [JsonPropertyName("employees")]
    public List<StaffHoursRowDto> Employees { get; set; } = [];
}

public sealed class StaffHoursRowDto
{
    [JsonPropertyName("employeeCode")]
    public string? EmployeeCode { get; set; }

    [JsonPropertyName("employeeName")]
    public string? EmployeeName { get; set; }

    [JsonPropertyName("employeeType")]
    public string? EmployeeType { get; set; }

    [JsonPropertyName("employeeTypeLabel")]
    public string? EmployeeTypeLabel { get; set; }

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("paidDays")]
    public decimal PaidDays { get; set; }

    [JsonPropertyName("workedHours")]
    public decimal WorkedHours { get; set; }

    [JsonPropertyName("otHours")]
    public decimal OtHours { get; set; }
}
