using System.Collections.ObjectModel;
using IMS.Services;

namespace IMS.ViewModels.SubPages;

public sealed class BillFormatBandViewModel : ViewModelBase
{
    public BillFormatBandViewModel(BillFormatBandDefinition definition)
    {
        Key = definition.Key;
        Title = definition.Title;
        HeaderColor = definition.HeaderColor;
        Sections = [];
    }

    public string Key { get; }
    public string Title { get; }
    public string HeaderColor { get; }
    public ObservableCollection<DesignerSectionViewModel> Sections { get; }

    public double BandHeight => Key switch
    {
        "details" => 120,
        "reportHeader" => 100,
        "reportFooter" => 90,
        _ => 72
    };
}
