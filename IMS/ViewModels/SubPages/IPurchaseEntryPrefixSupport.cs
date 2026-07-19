namespace IMS.ViewModels.SubPages;

public interface IPurchaseEntryPrefixSupport
{
    bool IsPrefixReadOnly { get; }
    Task CommitPrefixAsync();
}
