using System.Windows;
using IMS.ViewModels;

namespace IMS.Views;

public partial class SalesOrderMultiPickWindow : Window
{
    public SalesOrderMultiPickWindow(SalesOrderMultiPickViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
        viewModel.RequestClose = ok =>
        {
            DialogResult = ok;
            Close();
        };
    }
}
