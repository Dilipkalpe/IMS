using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class PayrollReportsViewModel : MockPageViewModel
{
    public PayrollReportsViewModel(MainViewModel host) : base(
        "Payroll Reports",
        "Generate payslips, tax/statutory summary, and staff hours from payroll and attendance.",
        "\uE9D9",
        "Report", "Description", "Output", "Status",
        [
            new("Reports", "3", "\uE9D9", ThemeColors.Primary),
            new("Payslip", "Per employee", "\uE8A5", ThemeColors.Success),
            new("Tax", "Monthly", "\uE8C0", ThemeColors.Warning),
            new("Hours", "Monthly", "\uE787", ThemeColors.Slate)
        ],
        [
            new MockRow { Col1 = "Payslip", Col2 = "Salary slip with earnings and deductions", Col3 = "Screen", Col4 = "Ready", Status = "Ready" },
            new MockRow { Col1 = "Tax Summary", Col2 = "TDS, PF, ESI, PT by employee", Col3 = "Screen", Col4 = "Ready", Status = "Ready" },
            new MockRow { Col1 = "Staff Hours", Col2 = "Attendance hours and paid days", Col3 = "Screen", Col4 = "Ready", Status = "Ready" }
        ],
        enableDelete: false,
        expandRows: false)
    {
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Payslip", "\uE8A5", () => new PayslipReportViewModel(host)),
            SubPageActionsFactory.Add(host, "Tax Summary", "\uE8C0", () => new PayrollTaxReportViewModel(host)),
            SubPageActionsFactory.Add(host, "Staff Hours", "\uE787", () => new StaffHoursReportViewModel(host))
        ];
        EditRowCommand = new RelayCommand(p =>
        {
            if (p is not MockRow row)
                return;
            var sub = row.Col1 switch
            {
                "Payslip" => (SubPageViewModelBase)new PayslipReportViewModel(host),
                "Tax Summary" => new PayrollTaxReportViewModel(host),
                "Staff Hours" => new StaffHoursReportViewModel(host),
                _ => null
            };
            if (sub is not null)
                host.NavigateToSubPage(sub);
        });
    }

    protected override void TryLoadFromApi()
    {
    }
}
