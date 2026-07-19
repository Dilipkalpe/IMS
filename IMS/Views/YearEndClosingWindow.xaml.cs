using System.Windows;
using IMS.Services.Api.Dtos;

namespace IMS.Views;

public partial class YearEndClosingWindow : Window
{
    private readonly FinancialYearDto _fromYear;

    public YearEndClosingWindow(FinancialYearDto fromYear)
    {
        _fromYear = fromYear;
        InitializeComponent();
        DataContext = this;

        var startYear = fromYear.EndDate.Year; // next FY begins after end year boundary
        var nextStart = new DateTime(startYear, 4, 1);
        var nextEnd = new DateTime(startYear + 1, 3, 31);

        ToStartPicker.SelectedDate = nextStart;
        ToEndPicker.SelectedDate = nextEnd;
        ToNameBox.Text = $"{startYear}-{String.Format("{0:00}", (startYear + 1) % 100)}";
    }

    public string FromYearLabel =>
        $"Source: {_fromYear.FinancialYearName}  ({_fromYear.StartDate:d} to {_fromYear.EndDate:d})  DB: {_fromYear.DatabaseName}";

    public string ToFinancialYearName => ToNameBox.Text.Trim();
    public DateTime ToStartDate => ToStartPicker.SelectedDate ?? DateTime.Today;
    public DateTime ToEndDate => ToEndPicker.SelectedDate ?? DateTime.Today;

    private void Cancel_Click(object sender, RoutedEventArgs e) => DialogResult = false;

    private void Ok_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(ToFinancialYearName))
        {
            MessageBox.Show("Enter new financial year name (e.g., 2026-27).", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ToStartDate >= ToEndDate)
        {
            MessageBox.Show("Start date must be before end date.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        DialogResult = true;
    }
}

