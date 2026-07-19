using System.Windows;

namespace IMS.Views;

public partial class CreateFinancialYearWindow : Window
{
    public CreateFinancialYearWindow()
    {
        InitializeComponent();

        var today = DateTime.Today;
        var year = today.Month >= 4 ? today.Year : today.Year - 1;
        StartPicker.SelectedDate = new DateTime(year + 1, 4, 1);
        EndPicker.SelectedDate = new DateTime(year + 2, 3, 31);
        NameBox.Text = $"{year + 1}-{String.Format("{0:00}", (year + 2) % 100)}";
    }

    public string FinancialYearName => NameBox.Text.Trim();
    public DateTime StartDate => StartPicker.SelectedDate ?? DateTime.Today;
    public DateTime EndDate => EndPicker.SelectedDate ?? DateTime.Today;

    private void Cancel_Click(object sender, RoutedEventArgs e) => DialogResult = false;

    private void Ok_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(FinancialYearName))
        {
            MessageBox.Show("Enter financial year name (e.g., 2026-27).", "Validation", MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        if (StartDate >= EndDate)
        {
            MessageBox.Show("Start date must be before end date.", "Validation", MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        DialogResult = true;
    }
}

