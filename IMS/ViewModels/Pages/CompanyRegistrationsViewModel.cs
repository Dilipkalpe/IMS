using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class CompanyRegistrationsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public CompanyRegistrationsViewModel(MainViewModel host) : base(
        CompanyCatalog.PageTitle,
        CompanyCatalog.PageDescription,
        CompanyCatalog.IconGlyph,
        "Code", "Business Name", "GSTIN", "Default",
        CompanyCatalog.Stats,
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Register Company", "\uE710",
                () => new AddCompanyRegistrationViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshCompanies(this);

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteCompanyByCodeAsync(row.Col1);
            ApiListLoader.RefreshCompanies(this);
        });
        MessageBox.Show(
            $"Company \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Company Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddCompanyRegistrationViewModel(_host, row));
    }

    public void RefreshStats(IReadOnlyList<CompanyDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var defaultCompany = items.FirstOrDefault(c => c.IsDefault)?.BusinessName
            ?? items.FirstOrDefault()?.BusinessName
            ?? "—";
        var withGstin = items.Count(c => !string.IsNullOrWhiteSpace(c.Gstin));

        StatsList[0] = new MockStat("Registered", items.Count.ToString("N0"), "\uE731", ThemeColors.Primary);
        StatsList[1] = new MockStat("Default Company", defaultCompany, "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("With GSTIN", withGstin.ToString("N0"), "\uE8A5", ThemeColors.Slate);
        StatsList[3] = new MockStat("Last Updated", "Today", "\uE823", ThemeColors.Warning);
        OnPropertyChanged(nameof(Stats));
    }
}
