using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Reporting.Data;
using IMS.Reporting.Designer.ViewModels;
using IMS.Services.Api;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class ReportFormatsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public ReportFormatsViewModel(MainViewModel host) : base(
        "Report formats (canvas)",
        "MongoDB-driven layouts (schema v2) for print and preview.",
        "\uE8A5",
        "Code", "Name", "Transaction", "Default",
        [],
        [],
        enableDelete: false,
        expandRows: false)
    {
        _host = host;
        DesignRowCommand = CreateDesignRowCommand(OpenDesigner);
        DesignLayoutCommand = new RelayCommand(OpenDesignerFromToolbar, () => SelectedRow is not null);
        SubPageActions =
        [
            new SubPageAction
            {
                Title = "Canvas design",
                IconGlyph = "\uE8A5",
                Command = DesignLayoutCommand
            },
            new SubPageAction
            {
                Title = "Refresh",
                IconGlyph = "\uE72C",
                Command = new RelayCommand(() => TryLoadFromApi())
            }
        ];
        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName == nameof(SelectedRow))
                (DesignLayoutCommand as RelayCommand)?.RaiseCanExecuteChanged();
        };
    }

    public ICommand DesignLayoutCommand { get; }

    protected override void TryLoadFromApi() => Services.Api.ApiListLoader.RefreshReportFormats(this);

    private void OpenDesignerFromToolbar()
    {
        if (SelectedRow is null)
        {
            MessageBox.Show(
                "Select a format row, then click Canvas design (or double-click the row).",
                "Report formats (canvas)",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        OpenDesigner(SelectedRow);
    }

    private void OpenDesigner(MockRow row)
    {
        if (row.Source is not ReportFormatDto dto || string.IsNullOrWhiteSpace(dto.Id))
        {
            MessageBox.Show(
                "Could not open the designer for this row. Refresh the list and try again.",
                "Report formats (canvas)",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        _host.NavigateToSubPage(new ReportFormatDesignerViewModel(_host, dto.Id));
    }
}
