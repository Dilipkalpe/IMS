using IMS.Models;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class SalesOrderWorkspaceViewModel : SalesEntryWorkspaceViewModelBase
{
    public SalesOrderWorkspaceViewModel(MainViewModel host) : base(host, SalesEntryType.SalesOrder) { }

    protected override Task<int> GetNextDocNoFromApiAsync() =>
        Task.FromResult(0);

    protected override SalesEntryFormViewModelBase CreateForm(int docNo) =>
        new AddSalesOrderViewModel(Host, this, docNo);

    public void AddEditTab(string formattedDocNo) => _ = AddEditTabAsync(formattedDocNo);

    private async Task AddEditTabAsync(string formattedDocNo)
    {
        var order = new AddSalesOrderViewModel(Host, this, 0, forEdit: true);
        await order.EnsureLoadedAsync(formattedDocNo);
        AddTab(order);
    }
}
