using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.ViewModels;

namespace IMS.Views;

public partial class FormFieldSettingsWindow : Window
{
    private readonly string _moduleKey;
    private readonly IReadOnlyList<FormFieldDefinition> _definitions;
    private readonly IReadOnlyList<string> _defaultVisibleKeys;
    private readonly List<FieldToggleItem> _items;
    private readonly Action _onLayoutChanged;
    private readonly Action _onSaveLayout;

    public IReadOnlyList<string>? ResultKeys { get; private set; }

    public FormFieldSettingsWindow(
        string moduleKey,
        IReadOnlyList<FormFieldDefinition> definitions,
        IReadOnlyList<string> currentVisible,
        IReadOnlyList<string> defaultVisibleKeys,
        IEnumerable<FormFieldViewModel> allFields,
        Action onLayoutChanged,
        Action onSaveLayout)
    {
        InitializeComponent();
        _moduleKey = moduleKey;
        _definitions = definitions;
        _defaultVisibleKeys = defaultVisibleKeys;
        _onLayoutChanged = onLayoutChanged;
        _onSaveLayout = onSaveLayout;

        var visible = new HashSet<string>(currentVisible, StringComparer.OrdinalIgnoreCase);
        _items = allFields
            .Where(f => !string.IsNullOrEmpty(f.Key))
            .Select(f => new FieldToggleItem(f, visible.Contains(f.Key) || f.IsRequired))
            .ToList();

        foreach (var item in _items)
            item.VisibilityChanged += OnItemVisibilityChanged;

        FieldList.ItemsSource = _items;
    }

    private void OnItemVisibilityChanged()
    {
        SyncToFields();
        _onLayoutChanged();
    }

    private void SyncToFields()
    {
        foreach (var item in _items)
            item.Field.IsVisible = item.IsVisible || item.Field.IsRequired;
    }

    private void ShowAll_Click(object sender, RoutedEventArgs e)
    {
        foreach (var item in _items)
            item.IsVisible = true;
        SyncToFields();
        _onLayoutChanged();
    }

    private void HideOptional_Click(object sender, RoutedEventArgs e)
    {
        foreach (var item in _items)
            item.IsVisible = !item.Field.IsOptional;
        SyncToFields();
        _onLayoutChanged();
    }

    private void Reset_Click(object sender, RoutedEventArgs e)
    {
        foreach (var item in _items)
        {
            item.IsVisible = _defaultVisibleKeys.Contains(item.Field.Key, StringComparer.OrdinalIgnoreCase)
                || !item.CanToggle;
        }

        SyncToFields();
        _onLayoutChanged();
    }

    private void SaveLayout_Click(object sender, RoutedEventArgs e)
    {
        SyncToFields();
        _onSaveLayout();
    }

    private void Apply_Click(object sender, RoutedEventArgs e)
    {
        SyncToFields();
        ResultKeys = _items.Where(i => i.IsVisible).Select(i => i.Field.Key).ToList();
        FormFieldPreferenceStore.Save(_moduleKey, ResultKeys, _definitions, _defaultVisibleKeys);
        _onLayoutChanged();
        DialogResult = true;
        Close();
    }

    private sealed class FieldToggleItem : ViewModelBase
    {
        private bool _isVisible;

        public FieldToggleItem(FormFieldViewModel field, bool isVisible)
        {
            Field = field;
            Label = field.Label;
            CanToggle = field.CanToggleVisibility;
            _isVisible = isVisible;
        }

        public event Action? VisibilityChanged;

        public FormFieldViewModel Field { get; }
        public string Label { get; }
        public bool CanToggle { get; }

        public bool IsVisible
        {
            get => _isVisible;
            set
            {
                if (SetProperty(ref _isVisible, value))
                    VisibilityChanged?.Invoke();
            }
        }
    }
}
