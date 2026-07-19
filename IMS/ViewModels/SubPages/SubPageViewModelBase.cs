using System.Windows.Input;

namespace IMS.ViewModels.SubPages;

public abstract class SubPageViewModelBase : ViewModelBase
{
    private readonly MainViewModel _host;

    protected SubPageViewModelBase(
        MainViewModel host,
        string parentTitle,
        string pageTitle,
        string pageDescription,
        string iconGlyph)
    {
        _host = host;
        ParentTitle = parentTitle;
        PageTitle = pageTitle;
        PageDescription = pageDescription;
        IconGlyph = iconGlyph;
        SaveCommand = new RelayCommand(Save);
        CancelCommand = new RelayCommand(() => _host.GoBack());
    }

    protected MainViewModel Host => _host;

    public string ParentTitle { get; }
    public string PageTitle { get; protected set; }
    public string PageDescription { get; }
    public string IconGlyph { get; }

    public ICommand SaveCommand { get; protected set; }
    public ICommand CancelCommand { get; protected set; }

    private void Save() => _host.GoBack();
}
