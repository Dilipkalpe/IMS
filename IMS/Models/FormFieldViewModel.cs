using IMS.Services;
using IMS.ViewModels;

namespace IMS.Models;

public enum FormFieldKind
{
    Text,
    Number,
    Date,
    Combo,
    Multiline,
    Boolean,
    FilePath,
    Image
}

public sealed class FormFieldViewModel : ViewModelBase
{
    private string _value = string.Empty;
    private string? _selectedOption;
    private bool _boolValue;
    private bool _isVisible = true;
    private string? _validationMessage;

    public FormFieldViewModel(
        string label,
        FormFieldKind kind,
        string placeholder = "",
        string? defaultValue = null,
        IReadOnlyList<string>? options = null,
        bool hasBrowseButton = false,
        bool isReadOnly = false)
    {
        Key = string.Empty;
        Label = label;
        Kind = kind;
        Placeholder = placeholder;
        Options = options ?? [];
        ToolTip = null;
        Section = null;
        IsRequired = label.Contains('*', StringComparison.Ordinal);
        IsOptional = !IsRequired;
        HasBrowseButton = hasBrowseButton;
        IsReadOnly = isReadOnly;
        _value = defaultValue ?? string.Empty;
        _selectedOption = ResolveDefaultOption(defaultValue, Options);
        if (kind == FormFieldKind.Boolean)
            _boolValue = string.Equals(defaultValue, "true", StringComparison.OrdinalIgnoreCase);
    }

    public FormFieldViewModel(FormFieldDefinition definition)
    {
        Key = definition.Key;
        Label = definition.Label;
        Kind = definition.Kind;
        Placeholder = definition.Placeholder;
        Options = definition.Options ?? [];
        ToolTip = definition.ToolTip;
        Section = definition.Section;
        IsRequired = definition.IsRequired;
        IsOptional = definition.IsOptional;
        HasBrowseButton = definition.HasBrowseButton;
        _value = definition.DefaultValue ?? string.Empty;
        _selectedOption = ResolveDefaultOption(definition.DefaultValue, Options);
        if (definition.Kind == FormFieldKind.Boolean)
            _boolValue = string.Equals(definition.DefaultValue, "true", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ResolveDefaultOption(string? defaultValue, IReadOnlyList<string> options)
    {
        if (options.Count == 0)
            return null;

        if (string.IsNullOrWhiteSpace(defaultValue))
            return options[0];

        return options.FirstOrDefault(o => string.Equals(o, defaultValue, StringComparison.OrdinalIgnoreCase))
               ?? defaultValue;
    }

    public string Key { get; }
    public string Label { get; }
    public FormFieldKind Kind { get; }
    public string Placeholder { get; }
    public IReadOnlyList<string> Options { get; }
    public string? ToolTip { get; }
    public string? Section { get; }
    public bool IsRequired { get; }
    public bool IsOptional { get; }
    public bool HasBrowseButton { get; }

    public bool IsReadOnly { get; }

    public bool CanToggleVisibility => !IsRequired;

    public string DisplayLabel => IsRequired ? $"{Label} *" : Label;

    public string Value
    {
        get => _value;
        set
        {
            if (SetProperty(ref _value, value))
                ValidationMessage = null;
        }
    }

    public string? SelectedOption
    {
        get => _selectedOption;
        set
        {
            if (SetProperty(ref _selectedOption, value))
                ValidationMessage = null;
        }
    }

    public bool BoolValue
    {
        get => _boolValue;
        set => SetProperty(ref _boolValue, value);
    }

    public bool IsVisible
    {
        get => _isVisible;
        set => SetProperty(ref _isVisible, value);
    }

    public string? ValidationMessage
    {
        get => _validationMessage;
        set => SetProperty(ref _validationMessage, value);
    }

    public string TextOrSelected => Kind == FormFieldKind.Combo
        ? (string.IsNullOrWhiteSpace(Value) ? SelectedOption : Value) ?? SelectedOption ?? Value
        : Value;
}
