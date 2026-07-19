using IMS.ViewModels;

namespace IMS.Models;

public sealed class BomConsumableLine : ViewModelBase
{
    private int _srNo;
    private string _material = string.Empty;
    private string _qty = "0";
    private string _rate = "0";
    private string _amount = "0";

    public int SrNo
    {
        get => _srNo;
        set => SetProperty(ref _srNo, value);
    }

    public string Material
    {
        get => _material;
        set => SetProperty(ref _material, value);
    }

    public string Qty
    {
        get => _qty;
        set
        {
            if (!SetProperty(ref _qty, value))
                return;
            RecalculateAmount();
        }
    }

    public string Rate
    {
        get => _rate;
        set
        {
            if (!SetProperty(ref _rate, value))
                return;
            RecalculateAmount();
        }
    }

    public string Amount
    {
        get => _amount;
        private set => SetProperty(ref _amount, value);
    }

    public void RecalculateAmount()
    {
        var qty = decimal.TryParse(Qty, out var q) ? q : 0;
        var rate = decimal.TryParse(Rate, out var r) ? r : 0;
        Amount = (qty * rate).ToString("N2");
    }
}
