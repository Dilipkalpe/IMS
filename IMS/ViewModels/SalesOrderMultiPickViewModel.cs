using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class SalesOrderMultiPickViewModel : ViewModelBase
{
    private string _statusMessage = string.Empty;

    public SalesOrderMultiPickViewModel(string customer, IReadOnlyList<SalesOrderPendingHeaderDto> orders)
    {
        Customer = customer;
        Rows = new ObservableCollection<SalesOrderMultiPickRow>(
            orders.Select(o => new SalesOrderMultiPickRow(
                o.SoPrefix,
                o.DocNo,
                o.FormattedDocNo,
                o.Customer,
                o.Status,
                o.SoDate)));

        ConfirmCommand = new RelayCommand(Confirm, () => Rows.Any(r => r.IsSelected));
        CancelCommand = new RelayCommand(() => RequestClose?.Invoke(false));
        SelectAllCommand = new RelayCommand(SelectAll);
        ClearSelectionCommand = new RelayCommand(ClearSelection);
    }

    public Action<bool>? RequestClose { get; set; }

    public IReadOnlyList<SalesOrderReferenceDto>? Result { get; private set; }

    public string Customer { get; }

    public ObservableCollection<SalesOrderMultiPickRow> Rows { get; }

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
    }

    private void ClearSelection()
    {
        foreach (var row in Rows)
            row.IsSelected = false;
    }

    private void Confirm()
    {
        var selected = Rows.Where(r => r.IsSelected).ToList();
        if (selected.Count == 0)
        {
            StatusMessage = "Select at least one sales order.";
            return;
        }

        Result = selected
            .Select(r => new SalesOrderReferenceDto
            {
                SoPrefix = r.SoPrefix,
                DocNo = r.DocNo,
                FormattedDocNo = r.FormattedDocNo
            })
            .ToList();

        RequestClose?.Invoke(true);
    }
}
