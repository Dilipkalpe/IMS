using System.Windows;
using IMS.Services;
using IMS.ViewModels;

namespace IMS.Views;

public partial class ListColumnSettingsWindow : Window
{
    private readonly string _moduleKey;
    private readonly List<ColumnToggleItem> _items;

    public IReadOnlyList<string>? ResultKeys { get; private set; }

    public ListColumnSettingsWindow(
        string moduleKey,
        IReadOnlyList<ListColumnDef> allColumns,
        IReadOnlyList<string> currentVisible,
        IReadOnlyList<string> defaultVisibleKeys)
    {
        InitializeComponent();
        _moduleKey = moduleKey;
        _allColumns = allColumns;
        _defaultVisibleKeys = defaultVisibleKeys;
        var visible = new HashSet<string>(currentVisible, StringComparer.OrdinalIgnoreCase);
        _items = allColumns
            .Select(c => new ColumnToggleItem(
                c.Key,
                c.Header,
                visible.Contains(c.Key),
                !c.Mandatory))
            .ToList();
        ColumnList.ItemsSource = _items;
    }

    private readonly IReadOnlyList<ListColumnDef> _allColumns;
    private readonly IReadOnlyList<string> _defaultVisibleKeys;

    private void Apply_Click(object sender, RoutedEventArgs e)
    {
        ResultKeys = _items.Where(i => i.IsVisible).Select(i => i.Key).ToList();
        ListColumnPreferenceStore.Save(_moduleKey, ResultKeys, _allColumns, _defaultVisibleKeys);
        DialogResult = true;
        Close();
    }

    private void Reset_Click(object sender, RoutedEventArgs e)
    {
        foreach (var item in _items)
            item.IsVisible = _defaultVisibleKeys.Contains(item.Key, StringComparer.OrdinalIgnoreCase)
                || !item.CanToggle;
    }

    public sealed class ColumnToggleItem : ViewModelBase
    {
        private bool _isVisible;

        public ColumnToggleItem(string key, string header, bool isVisible, bool canToggle)
        {
            Key = key;
            Header = header;
            _isVisible = isVisible;
            CanToggle = canToggle;
        }

        public string Key { get; }
        public string Header { get; }
        public bool CanToggle { get; }

        public bool IsVisible
        {
            get => _isVisible;
            set => SetProperty(ref _isVisible, value);
        }
    }
}
