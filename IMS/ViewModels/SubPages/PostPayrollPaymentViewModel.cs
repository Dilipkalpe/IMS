using System.Globalization;
using System.Text;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class PostPayrollPaymentViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly int _runNo;

    public PostPayrollPaymentViewModel(MainViewModel host, int runNo, PayrollRunDto? run = null) : base(
        host,
        parentTitle: "Payroll Processing",
        pageTitle: $"Post Payment — Run #{runNo}",
        pageDescription: "Create payment & receipt vouchers linked to Account Master (Finance module).",
        iconGlyph: "\uE8C8",
        fields:
        [
            new("Cash / Bank", FormFieldKind.Combo, options: ["BANK", "CASH"], defaultValue: "BANK"),
            new("Payment mode", FormFieldKind.Combo, options: ["per_employee", "consolidated"], defaultValue: "per_employee"),
            new("Payable account (consolidated / fallback)", FormFieldKind.Text, "SAL-PAYROLL", "SAL-PAYROLL"),
            new("Voucher date", FormFieldKind.Text, DateTime.Today.ToString("yyyy-MM-dd"), DateTime.Today.ToString("yyyy-MM-dd")),
            new("Create accrual receipt", FormFieldKind.Combo, options: ["Yes", "No"], defaultValue: "Yes"),
            new("Statutory payments (PF/ESI/TDS)", FormFieldKind.Combo, options: ["No", "Yes"], defaultValue: "No")
        ])
    {
        _host = host;
        _runNo = runNo;
        SaveCommand = new AsyncRelayCommand(PostAsync);
    }

    private async Task PostAsync()
    {
        if (!DateTime.TryParse(GetFieldValue("Voucher date"), CultureInfo.InvariantCulture, DateTimeStyles.None, out var vDate))
        {
            MessageBox.Show("Enter a valid voucher date.", "Payroll Payment", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var req = new PostPayrollPaymentRequestDto
        {
            CashBank = GetComboValue("Cash / Bank"),
            PaymentMode = GetComboValue("Payment mode"),
            ConsolidatedAccountCode = GetFieldValue("Payable account (consolidated / fallback)"),
            VoucherDate = vDate,
            CreateAccrualReceipt = GetComboValue("Create accrual receipt") == "Yes",
            CreateStatutoryPayments = GetComboValue("Statutory payments (PF/ESI/TDS)") == "Yes",
            PaidBy = AuthSession.DisplayName
        };

        PostPayrollPaymentResultDto? result = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            result = await ImsApiClient.PostPayrollPaymentAsync(_runNo, req);
        }, "Post Payment");

        if (result is null)
            return;

        var sb = new StringBuilder();
        sb.AppendLine(result.Message ?? "Payment posted.");
        if (result.PaymentVoucherNos.Count > 0)
            sb.AppendLine($"Payment vouchers: {string.Join(", ", result.PaymentVoucherNos)}");
        if (result.ReceiptVoucherNos.Count > 0)
            sb.AppendLine($"Receipt vouchers: {string.Join(", ", result.ReceiptVoucherNos)}");
        sb.AppendLine("\nOpen Finance → Payment Voucher / Receipt Voucher or Ledger Report.");

        MessageBox.Show(sb.ToString(), "Payroll Posted", MessageBoxButton.OK, MessageBoxImage.Information);
        _host.GoBack();
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? string.Empty;
}
