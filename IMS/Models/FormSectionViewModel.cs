using System.Collections.ObjectModel;

namespace IMS.Models;

public sealed class FormSectionViewModel
{
    public FormSectionViewModel(string title, IEnumerable<FormFieldViewModel> fields)
    {
        Title = title;
        Fields = new ObservableCollection<FormFieldViewModel>(fields);
    }

    public string Title { get; }
    public bool HasTitle => !string.IsNullOrWhiteSpace(Title);
    public ObservableCollection<FormFieldViewModel> Fields { get; }
}
