namespace IMS.ViewModels;

/// <summary>Page ViewModels that load API data when their view is displayed.</summary>
public interface IPageViewLoadAware
{
    void OnPageViewLoaded();
}
