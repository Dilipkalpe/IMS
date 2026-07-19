namespace IMS.ViewModels.SubPages;

public interface ISalesEntryPrefixSupport
{
    bool IsPrefixReadOnly { get; }
    Task CommitPrefixAsync();
}
