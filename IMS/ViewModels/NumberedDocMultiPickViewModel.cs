using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class NumberedDocMultiPickViewModel : ViewModelBase
{
    private string _statusMessage = string.Empty;

    public NumberedDocMultiPickViewModel(
        string partyLabel,
        string partyName,
        string instructions,
        string docNoColumnHeader,
        IReadOnlyList<PendingNumberedDocHeaderDto> items,
        Func<PendingNumberedDocHeaderDto, string?> partySelector,
        Func<PendingNumberedDocHeaderDto, DateTime?> dateSelector)
    {
        PartyLabel = partyLabel;
        PartyName = partyName;
        Instructions = instructions;
        DocNoColumnHeader = docNoColumnHeader;
        Rows = new ObservableCollection<NumberedDocMultiPickRow>(
            items.Select(o => new NumberedDocMultiPickRow(
                o.DocPrefix,
                o.DocNo,
                o.FormattedDocNo,
                partySelector(o),
                o.Status,
                dateSelector(o))));

        ConfirmCommand = new RelayCommand(Confirm, () => Rows.Any(r => r.IsSelected));
        CancelCommand = new RelayCommand(() => RequestClose?.Invoke(false));
        SelectAllCommand = new RelayCommand(SelectAll);
        ClearSelectionCommand = new RelayCommand(ClearSelection);

        foreach (var row in Rows)
        {
            row.PropertyChanged += (_, e) =>
            {
                if (e.PropertyName == nameof(NumberedDocMultiPickRow.IsSelected))
                    (ConfirmCommand as RelayCommand)?.RaiseCanExecuteChanged();
            };
        }
    }

    public Action<bool>? RequestClose { get; set; }

    public IReadOnlyList<NumberedDocReferenceDto>? Result { get; private set; }

    public string PartyLabel { get; }
    public string PartyName { get; }
    public string Instructions { get; }
    public string DocNoColumnHeader { get; }

    public ObservableCollection<NumberedDocMultiPickRow> Rows { get; }

    public ICommand ConfirmCommand { get; }
    public ICommand CancelCommand { get; }
    public ICommand SelectAllCommand { get; }
    public ICommand ClearSelectionCommand { get; }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    private void SelectAll()
    {
        foreach (var row in Rows)
            row.IsSelected = true;
        (ConfirmCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void ClearSelection()
    {
        foreach (var row in Rows)
            row.IsSelected = false;
        (ConfirmCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void Confirm()
    {
        var selected = Rows.Where(r => r.IsSelected).ToList();
        if (selected.Count == 0)
        {
            StatusMessage = "Select at least one document.";
            return;
        }

        Result = selected
            .Select(r => new NumberedDocReferenceDto
            {
                DocPrefix = r.DocPrefix,
                DocNo = r.DocNo,
                FormattedDocNo = r.FormattedDocNo
            })
            .ToList();

        RequestClose?.Invoke(true);
    }
}
