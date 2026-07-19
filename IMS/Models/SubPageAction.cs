using System.Windows.Input;

namespace IMS.Models;

public sealed class SubPageAction
{
    public required string Title { get; init; }
    public required string IconGlyph { get; init; }
    public required ICommand Command { get; init; }
}
