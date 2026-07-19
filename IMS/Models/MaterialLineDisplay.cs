using System.Globalization;
using System.Text;

namespace IMS.Models;

internal static class MaterialLineDisplay
{
    public static string FormatStage(string? stage)
    {
        if (string.IsNullOrWhiteSpace(stage))
            return "—";
        return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(stage.Replace('_', ' '));
    }

    public static string FormatAssignment(string? assignmentType)
    {
        if (string.IsNullOrWhiteSpace(assignmentType))
            return "BOM";
        return assignmentType.ToUpperInvariant() switch
        {
            "BOM" => "BOM",
            "MANUAL" => "Manual",
            "OVERRIDE" => "Override",
            _ => assignmentType
        };
    }

    public static string FormatLastEvent(IReadOnlyList<MaterialStageEvent> events)
    {
        if (events.Count == 0)
            return "—";
        var e = events[^1];
        var when = e.At?.ToString("g", CultureInfo.CurrentCulture) ?? "";
        var place = string.IsNullOrWhiteSpace(e.Godown) ? "" : $" @ {e.Godown}";
        return $"{FormatStage(e.Stage)}{place} · {when}".Trim(' ', '·');
    }

    public static string FormatHistoryToolTip(IReadOnlyList<MaterialStageEvent> events)
    {
        if (events.Count == 0)
            return "No stage history yet.";
        var sb = new StringBuilder();
        foreach (var e in events)
        {
            if (sb.Length > 0)
                sb.AppendLine();
            var when = e.At?.ToString("g", CultureInfo.CurrentCulture) ?? "—";
            var who = string.IsNullOrWhiteSpace(e.By) ? "" : $" · {e.By}";
            var qty = e.Qty > 0 ? $" · qty {e.Qty:N2}" : "";
            var note = string.IsNullOrWhiteSpace(e.Note) ? "" : $" — {e.Note}";
            sb.Append($"{FormatStage(e.Stage)} · {when}{who}{qty}{note}");
        }
        return sb.ToString();
    }
}
