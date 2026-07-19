using System.ComponentModel;
using System.Windows.Input;

namespace IMS.ViewModels.SubPages;

public sealed class SalesEntryTabViewModel : ViewModelBase
{
    private bool _isSelected;

    public SalesEntryTabViewModel(
        SalesEntryFormViewModelBase order,
        Action<SalesEntryTabViewModel> selectTab,
        Action<SalesEntryTabViewModel> closeTab)
    {
        Order = order;
        SelectTabCommand = new RelayCommand(() => selectTab(this));
        CloseTabCommand = new RelayCommand(() => closeTab(this));
        Order.PropertyChanged += OnOrderPropertyChanged;
    }

    public SalesEntryFormViewModelBase Order { get; }

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }

    public string TabTitle => $"{Order.DocPrefix}-{Order.BillNo}";

    public ICommand SelectTabCommand { get; }
    public ICommand CloseTabCommand { get; }

    private void OnOrderPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(SalesEntryFormViewModelBase.BillNo))
            OnPropertyChanged(nameof(TabTitle));
    }
}
