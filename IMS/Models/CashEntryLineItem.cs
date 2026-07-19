using IMS.ViewModels;

namespace IMS.Models;

public sealed class CashEntryLineItem : ViewModelBase
{
    private int _srNo;
    private string _particular = string.Empty;
    private string _amount = "0";

    public int SrNo
    {
        get => _srNo;
        set => SetProperty(ref _srNo, value);
    }

    public string Particular
    {
        get => _particular;
        set => SetProperty(ref _particular, value);
    }

    public string Amount
    {
        get => _amount;
        set => SetProperty(ref _amount, value);
    }
}
