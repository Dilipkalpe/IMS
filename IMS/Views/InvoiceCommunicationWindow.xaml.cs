using System.Windows;
using System.Windows.Controls;
using IMS.Models;
using IMS.Services;

namespace IMS.Views;

public partial class InvoiceCommunicationWindow : Window
{
    private readonly Dictionary<CommunicationChannel, CheckBox> _channelBoxes = new();

    private InvoiceCommunicationWindow(
        Window owner,
        IReadOnlyList<CommunicationChannel> availableChannels,
        bool sendByDefault)
    {
        InitializeComponent();
        Owner = owner;

        foreach (var channel in availableChannels)
        {
            var box = new CheckBox
            {
                Content = channel.ToString(),
                IsChecked = sendByDefault,
                FontSize = 13,
                Margin = new Thickness(0, 0, 0, 8)
            };
            _channelBoxes[channel] = box;
            ChannelPanel.Children.Add(box);
        }

        if (_channelBoxes.Count == 0)
            ChannelPanel.Children.Add(new TextBlock
            {
                Text = "No communication channels are enabled in Settings.",
                TextWrapping = TextWrapping.Wrap,
                Foreground = System.Windows.Media.Brushes.Gray
            });
    }

    public static InvoiceCommunicationChoice? ShowDialog(
        Window owner,
        IReadOnlyList<CommunicationChannel> availableChannels,
        bool sendByDefault)
    {
        var window = new InvoiceCommunicationWindow(owner, availableChannels, sendByDefault);
        return window.ShowDialog() == true ? window.BuildChoice(send: true) : null;
    }

    private void Send_OnClick(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }

    private void Skip_OnClick(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private InvoiceCommunicationChoice BuildChoice(bool send) =>
        new()
        {
            Send = send,
            Channels = _channelBoxes
                .Where(pair => pair.Value.IsChecked == true)
                .Select(pair => pair.Key)
                .ToList()
        };
}
