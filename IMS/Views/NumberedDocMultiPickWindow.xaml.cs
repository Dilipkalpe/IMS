using System.Windows;
using IMS.ViewModels;

namespace IMS.Views;

public partial class NumberedDocMultiPickWindow : Window
{
    public NumberedDocMultiPickWindow(NumberedDocMultiPickViewModel viewModel, string title)
    {
        InitializeComponent();
        Title = title;
        DataContext = viewModel;
        DocNoColumn.Header = viewModel.DocNoColumnHeader;
        viewModel.RequestClose = ok =>
        {
            DialogResult = ok;
            Close();
        };
    }
}
