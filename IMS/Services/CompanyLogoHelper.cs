using System.IO;
using System.Net.Http;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using IMS.Services.Api;
using Microsoft.Win32;

namespace IMS.Services;

public static class CompanyLogoHelper
{
    private const int MaxLogoBytes = 350_000;

    private static readonly string ImageFilter =
        "Image files|*.png;*.jpg;*.jpeg;*.gif;*.webp|All files|*.*";

    public static bool HasLogoReference(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var raw = value.Trim();
        return raw.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)
               || raw.StartsWith("/api/companies/by-code/", StringComparison.OrdinalIgnoreCase)
               || raw.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
               || raw.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
    }

    public static string ResolveLogoUri(string? logoRef)
    {
        if (string.IsNullOrWhiteSpace(logoRef))
            return string.Empty;

        var raw = logoRef.Trim();
        if (raw.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            return raw;

        if (raw.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || raw.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return raw;

        if (raw.StartsWith('/'))
            return $"{ApiConfiguration.BaseUrl.TrimEnd('/')}{raw}";

        return raw;
    }

    public static bool TryPickImageFromFile(out string dataUri, out string fileName)
    {
        dataUri = string.Empty;
        fileName = string.Empty;

        var dialog = new OpenFileDialog
        {
            Filter = ImageFilter,
            Title = "Select company logo"
        };
        if (dialog.ShowDialog() != true)
            return false;

        return TryReadFileAsDataUri(dialog.FileName, out dataUri, out fileName);
    }

    public static bool TryReadFileAsDataUri(string path, out string dataUri, out string fileName)
    {
        dataUri = string.Empty;
        fileName = Path.GetFileName(path);

        if (!File.Exists(path))
            return false;

        var ext = Path.GetExtension(path).ToLowerInvariant();
        var mime = ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => null
        };
        if (mime is null)
            return false;

        var bytes = File.ReadAllBytes(path);
        if (bytes.Length == 0 || bytes.Length > MaxLogoBytes)
            return false;

        dataUri = $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
        return true;
    }

    public static ImageSource? CreateImageSource(string? logoRef)
    {
        if (string.IsNullOrWhiteSpace(logoRef))
            return null;

        var uriText = ResolveLogoUri(logoRef);
        if (string.IsNullOrWhiteSpace(uriText))
            return null;

        try
        {
            if (uriText.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || uriText.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return CreateImageSourceFromHttp(uriText);
            }

            var image = new BitmapImage();
            image.BeginInit();
            image.CacheOption = BitmapCacheOption.OnLoad;
            image.CreateOptions = BitmapCreateOptions.IgnoreImageCache;
            image.UriSource = new Uri(uriText, UriKind.Absolute);
            image.EndInit();
            image.Freeze();
            return image;
        }
        catch
        {
            return null;
        }
    }

    private static ImageSource? CreateImageSourceFromHttp(string url)
    {
        try
        {
            using var client = new HttpClient();
            var bytes = client.GetByteArrayAsync(url).GetAwaiter().GetResult();
            if (bytes.Length == 0)
                return null;

            using var stream = new MemoryStream(bytes);
            var image = new BitmapImage();
            image.BeginInit();
            image.CacheOption = BitmapCacheOption.OnLoad;
            image.StreamSource = stream;
            image.EndInit();
            image.Freeze();
            return image;
        }
        catch
        {
            return null;
        }
    }

    public static UIElement? CreateLogoElement(string? dataUri, string? logoText, double maxWidth, double maxHeight)
    {
        var image = CreateImageSource(dataUri);
        if (image is not null)
        {
            return new Image
            {
                Source = image,
                Stretch = Stretch.Uniform,
                MaxWidth = maxWidth,
                MaxHeight = maxHeight,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };
        }

        var label = string.IsNullOrWhiteSpace(logoText) ? "LOGO" : logoText.Trim();
        return new TextBlock
        {
            Text = label,
            FontWeight = FontWeights.Bold,
            FontStyle = FontStyles.Italic,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            TextAlignment = TextAlignment.Center
        };
    }
}
