using System.Windows.Input;

namespace IMS.ViewModels;

public interface IStandardReportViewModel
{
    string PageTitle { get; }
    string SummaryText { get; }
    bool IsBusy { get; }
    ICommand ShowCommand { get; }
    ICommand? PrintCommand { get; }
}
