using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using IMS.Helpers;

namespace IMS.ViewModels;

public abstract class ViewModelBase : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected static bool IsUiAvailable =>
        !ApplicationState.IsShuttingDown
        && Application.Current?.Dispatcher is { HasShutdownStarted: false };

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        if (!IsUiAvailable)
            return;

        var handler = PropertyChanged;
        if (handler is null)
            return;

        if (Application.Current?.Dispatcher?.CheckAccess() == false)
        {
            Application.Current.Dispatcher.BeginInvoke(() =>
            {
                if (IsUiAvailable)
                    handler(this, new PropertyChangedEventArgs(propertyName));
            });
            return;
        }

        handler(this, new PropertyChangedEventArgs(propertyName));
    }

    protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
            return false;

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    /// <summary>Raises bindings used by list and dashboard loading overlays.</summary>
    protected void NotifyListLoadingBindings()
    {
        OnPropertyChanged("ShowLoadingOverlay");
        OnPropertyChanged("ShowInitialLoadingOverlay");
        OnPropertyChanged("ShowBusyOverlay");
        OnPropertyChanged("IsListBusy");
        OnPropertyChanged("ShowEmptyState");
        OnPropertyChanged("CanExportData");
    }
}
