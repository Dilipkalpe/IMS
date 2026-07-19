using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class PurchaseInvoiceWorkspaceViewModel : PurchaseEntryWorkspaceViewModelBase
{
    public PurchaseInvoiceWorkspaceViewModel(MainViewModel host) : base(host, PurchaseEntryType.PurchaseInvoice) { }

    protected override PurchaseEntryFormViewModelBase CreateForm(int docNo) =>
        new AddPurchaseInvoiceViewModel(Host, this, docNo);

    protected override Task<int> GetNextDocNoFromApiAsync() =>
        Task.FromResult(0);

    public void AddEditTab(string formattedDocNo) => _ = AddEditTabAsync(formattedDocNo);

    private async Task AddEditTabAsync(string formattedDocNo)
    {
        var form = new AddPurchaseInvoiceViewModel(Host, this, 0, forEdit: true);
        await form.EnsureLoadedAsync(formattedDocNo);
        AddTab(form);
    }
}
