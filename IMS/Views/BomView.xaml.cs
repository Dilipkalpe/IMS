using System.Windows.Controls;
using IMS.ViewModels.SubPages;
using IMS.Views.Controls;

namespace IMS.Views;

public partial class BomView
{
    public BomView()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, System.Windows.RoutedEventArgs e)
    {
        RawMaterialProductPicker.FocusScanBox();
        if (DataContext is BomViewModel vm)
            await vm.ReloadFromApiAsync();
    }
}
