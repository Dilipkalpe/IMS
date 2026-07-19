using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using IMS.Views;

namespace IMS.Helpers;

/// <summary>
/// Maps Enter to the next tab stop (same as Tab) for common form inputs app-wide.
/// Uses bubbling <see cref="UIElement.KeyDownEvent"/> so existing <see cref="UIElement.PreviewKeyDownEvent"/>
/// handlers (prefix commit, barcode scan, etc.) still run first.
/// </summary>
public static class FormKeyboardNavigation
{
    public static readonly DependencyProperty SuppressEnterAsTabProperty =
        DependencyProperty.RegisterAttached(
            "SuppressEnterAsTab",
            typeof(bool),
            typeof(FormKeyboardNavigation),
            new PropertyMetadata(false));

    public static bool GetSuppressEnterAsTab(DependencyObject element) =>
        (bool)element.GetValue(SuppressEnterAsTabProperty);

    public static void SetSuppressEnterAsTab(DependencyObject element, bool value) =>
        element.SetValue(SuppressEnterAsTabProperty, value);

    public static void Register()
    {
        RegisterHandler<TextBox>();
        RegisterHandler<ComboBox>();
        RegisterHandler<DatePicker>();
        RegisterHandler<PasswordBox>();
        RegisterHandler<CheckBox>();
    }

    private static void RegisterHandler<T>() where T : UIElement
    {
        // Must use KeyEventHandler explicitly; a bare method group becomes Action<> and throws at runtime.
        EventManager.RegisterClassHandler(
            typeof(T),
            UIElement.KeyDownEvent,
            new KeyEventHandler(OnInputKeyDown),
            handledEventsToo: false);
    }

    private static void OnInputKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key is not (Key.Enter or Key.Return))
            return;

        if (Keyboard.Modifiers != ModifierKeys.None)
            return;

        if (e.Handled || sender is not UIElement element)
            return;

        if (!element.IsEnabled || element.Visibility != Visibility.Visible)
            return;

        if (HasSuppressEnterAsTab(element) || IsExcludedWindowContext(element))
            return;

        if (!ShouldTreatEnterAsTab(element))
            return;

        CommitPendingInput(element);

        if (!TryMoveFocusNext(element))
            return;

        e.Handled = true;
    }

    private static bool ShouldTreatEnterAsTab(UIElement element) => element switch
    {
        TextBox { AcceptsReturn: true } => false,
        ComboBox { IsDropDownOpen: true } => false,
        TextBoxBase { IsReadOnly: true } => true,
        TextBox => true,
        ComboBox => true,
        DatePicker => true,
        PasswordBox => true,
        CheckBox => true,
        _ => false
    };

    private static bool HasSuppressEnterAsTab(DependencyObject element)
    {
        for (var current = element; current is not null; current = VisualTreeHelper.GetParent(current))
        {
            if (current is DependencyObject d && GetSuppressEnterAsTab(d))
                return true;
        }

        return false;
    }

    private static bool IsExcludedWindowContext(DependencyObject element)
    {
        var window = FindParentWindow(element);
        return window is LoginWindow or ConfirmationPasswordWindow;
    }

    private static Window? FindParentWindow(DependencyObject? element)
    {
        while (element is not null)
        {
            if (element is Window window)
                return window;

            element = VisualTreeHelper.GetParent(element);
        }

        return null;
    }

    private static void CommitPendingInput(UIElement element)
    {
        switch (element)
        {
            case TextBox textBox:
                textBox.GetBindingExpression(TextBox.TextProperty)?.UpdateSource();
                _ = SalesEntryPrefixHelper.TryCommitPrefixOnNavigateAsync(textBox);
                _ = PurchaseEntryPrefixHelper.TryCommitPrefixOnNavigateAsync(textBox);
                break;
            case ComboBox comboBox:
                comboBox.GetBindingExpression(ComboBox.TextProperty)?.UpdateSource();
                comboBox.GetBindingExpression(Selector.SelectedItemProperty)?.UpdateSource();
                break;
            case DatePicker datePicker:
                datePicker.GetBindingExpression(DatePicker.SelectedDateProperty)?.UpdateSource();
                break;
            case CheckBox checkBox:
                checkBox.GetBindingExpression(CheckBox.IsCheckedProperty)?.UpdateSource();
                break;
        }
    }

    private static bool TryMoveFocusNext(UIElement element)
    {
        var request = new TraversalRequest(FocusNavigationDirection.Next);
        return element.MoveFocus(request);
    }
}
