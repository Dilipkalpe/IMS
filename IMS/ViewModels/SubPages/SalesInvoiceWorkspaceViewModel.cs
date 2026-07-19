using IMS.Models;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class SalesInvoiceWorkspaceViewModel : SalesEntryWorkspaceViewModelBase
{
    public SalesInvoiceWorkspaceViewModel(MainViewModel host) : base(host, SalesEntryType.SalesInvoice) { }

    protected override SalesEntryFormViewModelBase CreateForm(int docNo) =>
        new AddSalesInvoiceViewModel(Host, this, docNo);

    protected override Task<int> GetNextDocNoFromApiAsync() =>
        Task.FromResult(0);

    public void AddEditTab(string formattedDocNo) => _ = AddEditTabAsync(formattedDocNo);

    private async Task AddEditTabAsync(string formattedDocNo)
    {
        var form = new AddSalesInvoiceViewModel(Host, this, 0, forEdit: true);
        await form.EnsureLoadedAsync(formattedDocNo);
        AddTab(form);
    }
}
