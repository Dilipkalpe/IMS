using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Views;

namespace IMS.ViewModels.SubPages;

public abstract class DynamicFormViewModelBase : SubPageViewModelBase
{
    private readonly IReadOnlyList<FormFieldDefinition> _definitions;
    private readonly IReadOnlyList<string> _defaultVisibleKeys;
    private readonly Dictionary<string, FormFieldViewModel> _fieldByKey;

    protected DynamicFormViewModelBase(
        MainViewModel host,
        string parentTitle,
        string pageTitle,
        string pageDescription,
        string iconGlyph,
        IReadOnlyList<FormFieldDefinition> fieldDefinitions)
        : base(host, parentTitle, pageTitle, pageDescription, iconGlyph)
    {
        _definitions = fieldDefinitions;
        _defaultVisibleKeys = FormFieldCatalog.DefaultVisibleKeys(_definitions);
        _fieldByKey = new Dictionary<string, FormFieldViewModel>(StringComparer.OrdinalIgnoreCase);

        foreach (var def in _definitions)
        {
            var field = CreateField(def);
            AllFields.Add(field);
            if (!string.IsNullOrEmpty(field.Key))
                _fieldByKey[field.Key] = field;
        }

        ApplyVisibilityFromStore();
        RefreshVisibleFields();

        ManageFieldsCommand = new RelayCommand(OpenFieldSettings);
        ShowAllFieldsCommand = new RelayCommand(ShowAllFields);
        HideOptionalFieldsCommand = new RelayCommand(HideOptionalFields);
        ResetLayoutCommand = new RelayCommand(ResetLayout);
        SaveLayoutCommand = new RelayCommand(SaveCurrentLayout);
        BrowseFieldCommand = new RelayCommand(p =>
        {
            if (p is FormFieldViewModel field)
                OnBrowseField(field);
        });
    }

    protected abstract string FormModuleKey { get; }

    public ObservableCollection<FormFieldViewModel> AllFields { get; } = [];
    public ObservableCollection<FormFieldViewModel> VisibleFields { get; } = [];
    public ObservableCollection<FormSectionViewModel> FormSections { get; } = [];

    public ICommand ManageFieldsCommand { get; }
    public ICommand ShowAllFieldsCommand { get; }
    public ICommand HideOptionalFieldsCommand { get; }
    public ICommand ResetLayoutCommand { get; }
    public ICommand SaveLayoutCommand { get; }
    public ICommand BrowseFieldCommand { get; }

    public IReadOnlyList<string> SectionOrder =>
        _definitions.Select(d => d.Section).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList()!;

    public IEnumerable<FormFieldViewModel> VisibleFieldsInSection(string section) =>
        VisibleFields.Where(f => string.Equals(f.Section, section, StringComparison.Ordinal));

    public FormFieldViewModel? GetField(string key) =>
        _fieldByKey.TryGetValue(key, out var field) ? field : null;

    public string GetText(string key) => GetField(key)?.TextOrSelected?.Trim() ?? string.Empty;

    public bool GetBool(string key) => GetField(key)?.BoolValue ?? false;

    public void SetText(string key, string? value)
    {
        var field = GetField(key);
        if (field is null)
            return;

        if (field.Kind == FormFieldKind.Combo)
            field.SelectedOption = value;
        else
            field.Value = value ?? string.Empty;
    }

    public void SetBool(string key, bool value)
    {
        var field = GetField(key);
        if (field is not null)
            field.BoolValue = value;
    }

    protected virtual void OnBrowseField(FormFieldViewModel field) { }

    protected bool ValidateRequiredFields(params string[] requiredKeys)
    {
        var valid = true;
        foreach (var key in requiredKeys)
        {
            var field = GetField(key);
            if (field is null)
                continue;

            if (!string.IsNullOrWhiteSpace(GetText(key)))
            {
                field.ValidationMessage = null;
                continue;
            }

            field.ValidationMessage = $"{field.Label} is required.";
            valid = false;
        }

        return valid;
    }

    private FormFieldViewModel CreateField(FormFieldDefinition def) => new(def);

    private void ApplyVisibilityFromStore()
    {
        var visible = new HashSet<string>(
            FormFieldPreferenceStore.Load(FormModuleKey, _definitions, _defaultVisibleKeys),
            StringComparer.OrdinalIgnoreCase);

        foreach (var field in AllFields)
        {
            if (string.IsNullOrEmpty(field.Key))
            {
                field.IsVisible = true;
                continue;
            }

            field.IsVisible = visible.Contains(field.Key) || field.IsRequired;
        }
    }

    public virtual void RefreshVisibleFields()
    {
        VisibleFields.Clear();
        FormSections.Clear();
        foreach (var field in AllFields.Where(f => f.IsVisible))
            VisibleFields.Add(field);

        foreach (var section in SectionOrder)
        {
            var inSection = VisibleFields.Where(f => string.Equals(f.Section, section, StringComparison.Ordinal)).ToList();
            if (inSection.Count > 0)
                FormSections.Add(new FormSectionViewModel(section!, inSection));
        }

        var unsectioned = VisibleFields.Where(f => string.IsNullOrWhiteSpace(f.Section)).ToList();
        if (unsectioned.Count > 0)
            FormSections.Add(new FormSectionViewModel(string.Empty, unsectioned));
    }

    private void OpenFieldSettings()
    {
        var dlg = new FormFieldSettingsWindow(
            FormModuleKey,
            _definitions,
            VisibleFields.Select(f => f.Key).ToList(),
            _defaultVisibleKeys,
            AllFields,
            RefreshVisibleFields,
            SaveCurrentLayout)
        {
            Owner = Application.Current?.MainWindow
        };

        if (dlg.ShowDialog() != true)
            return;

        ApplyVisibilityKeys(dlg.ResultKeys ?? _defaultVisibleKeys);
    }

    private void ApplyVisibilityKeys(IEnumerable<string> visibleKeys)
    {
        var visible = new HashSet<string>(visibleKeys, StringComparer.OrdinalIgnoreCase);
        foreach (var field in AllFields)
        {
            if (string.IsNullOrEmpty(field.Key))
                continue;

            field.IsVisible = visible.Contains(field.Key) || field.IsRequired;
        }

        RefreshVisibleFields();
    }

    private void ShowAllFields() => ApplyVisibilityKeys(_defaultVisibleKeys);

    private void HideOptionalFields()
    {
        var keys = _definitions.Where(d => !d.IsOptional).Select(d => d.Key);
        ApplyVisibilityKeys(keys);
    }

    private void ResetLayout()
    {
        FormFieldPreferenceStore.Save(FormModuleKey, _defaultVisibleKeys, _definitions, _defaultVisibleKeys);
        ApplyVisibilityKeys(_defaultVisibleKeys);
    }

    private void SaveCurrentLayout()
    {
        var keys = AllFields.Where(f => f.IsVisible && !string.IsNullOrEmpty(f.Key)).Select(f => f.Key);
        FormFieldPreferenceStore.Save(FormModuleKey, keys, _definitions, _defaultVisibleKeys);
        MessageBox.Show("Form layout saved.", "Form Settings", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    public void ResetFieldsToDefaults()
    {
        foreach (var def in _definitions)
        {
            var field = GetField(def.Key);
            if (field is null)
                continue;

            field.ValidationMessage = null;

            if (def.Kind == FormFieldKind.Boolean)
            {
                field.BoolValue = string.Equals(def.DefaultValue, "true", StringComparison.OrdinalIgnoreCase);
                continue;
            }

            var defaultValue = def.DefaultValue ?? string.Empty;
            if (def.Kind == FormFieldKind.Combo)
            {
                field.Value = string.Empty;
                field.SelectedOption = field.Options.FirstOrDefault(o =>
                    string.Equals(o, defaultValue, StringComparison.OrdinalIgnoreCase))
                    ?? field.Options.FirstOrDefault();
            }
            else
                field.Value = defaultValue;
        }
    }

}
