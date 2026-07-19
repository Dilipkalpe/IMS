using System.Windows;

using System.Windows.Controls;

using System.Windows.Input;

using System.Windows.Threading;

using IMS.Helpers;
using IMS.ViewModels.SubPages;



namespace IMS.Views.Controls;



public partial class ProductScanPickerBar : UserControl

{

    public static readonly DependencyProperty IsCompactProperty =

        DependencyProperty.Register(

            nameof(IsCompact),

            typeof(bool),

            typeof(ProductScanPickerBar),

            new PropertyMetadata(false, OnIsCompactChanged));



    public ProductScanPickerBar()

    {

        InitializeComponent();
        FormKeyboardNavigation.SetSuppressEnterAsTab(BarcodeProductBox, true);
        FormKeyboardNavigation.SetSuppressEnterAsTab(BarcodeProductBoxCompact, true);

        Loaded += (_, _) => FocusScanBox();

    }



    public bool IsCompact

    {

        get => (bool)GetValue(IsCompactProperty);

        set => SetValue(IsCompactProperty, value);

    }



    private static void OnIsCompactChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)

    {

        if (d is ProductScanPickerBar bar)

            bar.ApplyCompactLayout();

    }



    private void ApplyCompactLayout()

    {

        var compact = IsCompact;

        StandardLayout.Visibility = compact ? Visibility.Collapsed : Visibility.Visible;

        CompactLayout.Visibility = compact ? Visibility.Visible : Visibility.Collapsed;

    }



    public void FocusScanBox()

    {

        if (!IsLoaded)

            return;



        var box = IsCompact ? BarcodeProductBoxCompact : BarcodeProductBox;

        box.Focus();

        box.SelectAll();

    }



    private async void ProductComboBox_OnDropDownOpened(object sender, EventArgs e)

    {

        if (DataContext is IProductScanPickerHost host && host.ShowProductPicker)

            await host.RefreshProductSearchAsync();

    }



    private void BarcodeProductBox_OnPreviewKeyDown(object sender, KeyEventArgs e)

    {

        if (e.Key is not Key.Enter and not Key.Return)

            return;



        if (DataContext is IProductScanPickerHost host)

            host.AddLineFromScan();



        e.Handled = true;

        Dispatcher.BeginInvoke(FocusScanBox, DispatcherPriority.ApplicationIdle);

    }

}

