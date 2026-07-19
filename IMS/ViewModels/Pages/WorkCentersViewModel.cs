using IMS.Resources;

namespace IMS.ViewModels;

public sealed class WorkCentersViewModel : MockPageViewModel
{
    public WorkCentersViewModel() : base(
        "Work Centers",
        "Production resources, capacity, and routing.",
        "\uE912",
        "Code", "Work Center", "Capacity", "Utilization",
        [
            new("Work Centers", "8", "\uE912", ThemeColors.Purple),
            new("Avg Utilization", "78%", "\uE9D2", ThemeColors.Primary),
            new("Down Today", "1", "\uE7BA", ThemeColors.Danger),
            new("Shifts", "2", "\uE823", ThemeColors.Slate)
        ],
        [
            new() { Col1 = "WC-CUT", Col2 = "CNC Cutting", Col3 = "16 hrs/day", Col4 = "82%", Status = "Running" },
            new() { Col1 = "WC-ASM", Col2 = "Assembly Line 1", Col3 = "16 hrs/day", Col4 = "91%", Status = "Running" },
            new() { Col1 = "WC-WLD", Col2 = "Welding Station", Col3 = "8 hrs/day", Col4 = "65%", Status = "Running" },
            new() { Col1 = "WC-QC", Col2 = "Quality Inspection", Col3 = "8 hrs/day", Col4 = "0%", Status = "Down" }
        ])
    { }
}
