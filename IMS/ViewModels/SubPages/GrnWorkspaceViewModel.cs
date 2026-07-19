using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class GrnWorkspaceViewModel : PurchaseEntryWorkspaceViewModelBase
{
    public GrnWorkspaceViewModel(MainViewModel host) : base(host, PurchaseEntryType.Grn) { }

    protected override PurchaseEntryFormViewModelBase CreateForm(int docNo) =>
        new AddGrnViewModel(Host, this, docNo);

    protected override Task<int> GetNextDocNoFromApiAsync() =>
        Task.FromResult(0);

    public void AddEditTab(string formattedDocNo) => _ = AddEditTabAsync(formattedDocNo);

    private async Task AddEditTabAsync(string formattedDocNo)
    {
        var form = new AddGrnViewModel(Host, this, 0, forEdit: true);
        await form.EnsureLoadedAsync(formattedDocNo);
        AddTab(form);
    }
}
