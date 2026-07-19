using System.Collections.ObjectModel;
using System.Windows.Input;

namespace IMS.ViewModels.SubPages;

/// <summary>View models that expose Sales Order–style barcode scan and product picker entry.</summary>
public interface IProductScanPickerHost
{
    bool ShowProductPicker { get; }

    bool ShowProductBrowse => ShowProductPicker;
    ObservableCollection<string> ProductOptions { get; }
    string BarcodeOrProduct { get; set; }
    string ProductSearchText { get; set; }
    string? SelectedProduct { get; set; }
    string ProductSearchStatus { get; }
    bool IsProductSearchBusy { get; }
    ICommand BrowseProductsCommand { get; }
    void AddLineFromScan();
    Task RefreshProductSearchAsync();
}
