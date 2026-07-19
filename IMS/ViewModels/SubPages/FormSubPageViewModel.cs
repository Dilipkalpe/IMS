using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels.SubPages;

public abstract class FormSubPageViewModel : SubPageViewModelBase
{
    protected FormSubPageViewModel(
        MainViewModel host,
        string parentTitle,
        string pageTitle,
        string pageDescription,
        string iconGlyph,
        IEnumerable<FormFieldViewModel> fields)
        : base(host, parentTitle, pageTitle, pageDescription, iconGlyph)
    {
        Fields = new ObservableCollection<FormFieldViewModel>(fields);
        BrowseFieldCommand = new RelayCommand(p =>
        {
            if (p is FormFieldViewModel field)
                OnBrowseField(field);
        });
        ClearFieldCommand = new RelayCommand(p =>
        {
            if (p is FormFieldViewModel field)
            {
                field.Value = string.Empty;
                field.ValidationMessage = null;
            }
        });
    }

    public ObservableCollection<FormFieldViewModel> Fields { get; }

    public ICommand BrowseFieldCommand { get; }
    public ICommand ClearFieldCommand { get; }

    protected virtual void OnBrowseField(FormFieldViewModel field)
    {
        if (PayrollEmployeeFormFields.IsEmployeeCodeField(field))
            PayrollEmployeePickService.PickAndApply(Fields);
    }
}
