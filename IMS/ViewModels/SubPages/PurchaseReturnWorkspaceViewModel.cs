using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class PurchaseReturnWorkspaceViewModel : PurchaseEntryWorkspaceViewModelBase
{
    public PurchaseReturnWorkspaceViewModel(MainViewModel host) : base(host, PurchaseEntryType.PurchaseReturn) { }

    protected override PurchaseEntryFormViewModelBase CreateForm(int docNo) =>
        new AddPurchaseReturnViewModel(Host, this, docNo);

    protected override Task<int> GetNextDocNoFromApiAsync() =>
        Task.FromResult(0);

    public void AddEditTab(string formattedDocNo) => _ = AddEditTabAsync(formattedDocNo);

    private async Task AddEditTabAsync(string formattedDocNo)
    {
        var form = new AddPurchaseReturnViewModel(Host, this, 0, forEdit: true);
        await form.EnsureLoadedAsync(formattedDocNo);
        AddTab(form);
    }
}
