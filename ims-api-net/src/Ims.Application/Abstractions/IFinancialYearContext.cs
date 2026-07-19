namespace Ims.Application.Abstractions;

public interface IFinancialYearContext
{
    string? YearDatabaseName { get; }

    void SetYearDatabaseName(string yearDatabaseName);
}

public sealed class FinancialYearContext : IFinancialYearContext
{
    private static readonly AsyncLocal<string?> YearDb = new();

    public string? YearDatabaseName => YearDb.Value;

    public void SetYearDatabaseName(string yearDatabaseName)
    {
        YearDb.Value = string.IsNullOrWhiteSpace(yearDatabaseName) ? null : yearDatabaseName.Trim();
    }
}
