using System.Collections.ObjectModel;
using IMS.Models;

namespace IMS.ViewModels;

public sealed class NavigationSectionViewModel : ViewModelBase
{
    private bool _isExpanded = true;

    public NavigationSectionViewModel(string name, bool isFavorites = false)
    {
        Name = name;
        IsFavorites = isFavorites;
        Items = new ObservableCollection<NavigationItem>();
        ToggleExpandCommand = new RelayCommand(() => IsExpanded = !IsExpanded);
    }

    public string Name { get; }
    public bool IsFavorites { get; }
    public ObservableCollection<NavigationItem> Items { get; }

    public bool IsExpanded
    {
        get => _isExpanded;
        set => SetProperty(ref _isExpanded, value);
    }

    public RelayCommand ToggleExpandCommand { get; }
}
