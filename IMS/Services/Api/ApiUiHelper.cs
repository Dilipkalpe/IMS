using System.Net.Http;
using System.Windows;

namespace IMS.Services;

// ApiUiHelper lives in IMS.Services so ViewModels can use it alongside other services.

public static class ApiUiHelper
{
    public static async Task RunWithApiAsync(Func<Task> action, string failureTitle = "API Error")
    {
        try
        {
            await action().ConfigureAwait(true);
        }
        catch (Api.ApiException ex)
        {
            await UiThread.RunAsync(() => MessageBox.Show(
                $"{ex.Message}\n\nEnsure MongoDB is running and the API is started (npm run dev in the api folder).",
                failureTitle,
                MessageBoxButton.OK,
                MessageBoxImage.Warning));
        }
        catch (HttpRequestException ex)
        {
            await UiThread.RunAsync(() => MessageBox.Show(
                $"Cannot reach API at {Api.ApiConfiguration.BaseUrl}.\n{ex.Message}",
                failureTitle,
                MessageBoxButton.OK,
                MessageBoxImage.Warning));
        }
    }

    public static void RunWithApiFireAndForget(Func<Task> action) =>
        _ = RunWithApiAsync(action);
}
