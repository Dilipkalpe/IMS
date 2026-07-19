using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using IMS.Models;
using IMS.ViewModels;

namespace IMS.Views;

public partial class ProductBrowseWindow : Window
{
    private readonly ProductBrowseViewModel _viewModel;

    public ProductBrowseWindow(ProductBrowseViewModel viewModel)
    {
        _viewModel = viewModel;
        InitializeComponent();
        DataContext = viewModel;
        RateColumn.Header = viewModel.RateColumnHeader;
        viewModel.RequestClose = ok =>
        {
            DialogResult = ok;
            Close();
        };
        SingleSelectModeRadio.IsChecked = true;
        Loaded += OnLoadedAsync;
    }

    private async void OnLoadedAsync(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoadedAsync;
        try
        {
            await _viewModel.LoadInitialAsync();
            ProductsGrid.Focus();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Could not load products: {ex.Message}",
                "Browse Products",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }

    private void SelectModeRadio_OnChecked(object sender, RoutedEventArgs e)
    {
        if (sender is not RadioButton radio || radio.IsChecked != true)
            return;

        _viewModel.IsMultiSelectMode = ReferenceEquals(radio, MultiSelectModeRadio);
    }

    private void ProductsGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (ProductsGrid.SelectedItem is not ProductBrowseRow row)
            return;

        if (_viewModel.IsMultiSelectMode)
        {
            _viewModel.ToggleRowSelection(row);
            return;
        }

        _viewModel.SelectedRow = row;
        _viewModel.ConfirmSelect();
    }
}
