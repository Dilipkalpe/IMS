using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class PurchaseOrderWorkspaceViewModel : PurchaseEntryWorkspaceViewModelBase
{
    public PurchaseOrderWorkspaceViewModel(MainViewModel host) : base(host, PurchaseEntryType.PurchaseOrder) { }

    protected override PurchaseEntryFormViewModelBase CreateForm(int docNo) =>
        new AddPurchaseOrderViewModel(Host, this, docNo);

    protected override Task<int> GetNextDocNoFromApiAsync() =>
        Task.FromResult(0);

    public void AddEditTab(string formattedDocNo) => _ = AddEditTabAsync(formattedDocNo);

    private async Task AddEditTabAsync(string formattedDocNo)
    {
        var form = new AddPurchaseOrderViewModel(Host, this, 0, forEdit: true);
        await form.EnsureLoadedAsync(formattedDocNo);
        AddTab(form);
    }
}
