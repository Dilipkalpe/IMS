using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.ViewModels;

namespace IMS.Views;

public partial class MasterPickWindow : Window
{
    private readonly MasterPickViewModel _viewModel;

    public MasterPickWindow(MasterPickViewModel viewModel)
    {
        _viewModel = viewModel;
        InitializeComponent();
        Title = viewModel.Title;
        DataContext = viewModel;
        CodeColumn.Header = viewModel.CodeColumnHeader;
        viewModel.RequestClose = ok =>
        {
            DialogResult = ok;
            Close();
        };
        Loaded += OnLoadedAsync;
    }

    private async void OnLoadedAsync(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoadedAsync;
        try
        {
            await _viewModel.LoadInitialAsync();
            PickGrid.Focus();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Could not load records: {ex.Message}",
                _viewModel.Title,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }

    private void PickGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (PickGrid.SelectedItem is not MasterPickRow)
            return;

        _viewModel.ConfirmSelect();
    }
}
