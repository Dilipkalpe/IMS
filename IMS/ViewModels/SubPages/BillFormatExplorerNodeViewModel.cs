using System.Collections.ObjectModel;
using System.Windows.Input;

namespace IMS.ViewModels.SubPages;

public sealed class BillFormatExplorerNodeViewModel : ViewModelBase
{
    public BillFormatExplorerNodeViewModel(
        string title,
        bool isCategory = false,
        string? sectionType = null,
        string? fieldToken = null,
        string? columnKey = null,
        ICommand? insertCommand = null)
    {
        Title = title;
        IsCategory = isCategory;
        SectionType = sectionType;
        FieldToken = fieldToken;
        ColumnKey = columnKey;
        InsertCommand = insertCommand;
        Children = [];
    }

    public string Title { get; }
    public bool IsCategory { get; }
    public string? SectionType { get; }
    public string? FieldToken { get; }
    public string? ColumnKey { get; }
    public ICommand? InsertCommand { get; }
    public ObservableCollection<BillFormatExplorerNodeViewModel> Children { get; }

    public bool CanInsert => !IsCategory && InsertCommand is not null;
}
