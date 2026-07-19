using System.Windows;

using System.Windows.Controls;

using System.Windows.Documents;

using System.Windows.Input;

using System.Windows.Media;

using IMS.ViewModels;



namespace IMS;



public partial class LoginWindow : Window

{

    private readonly LoginViewModel _viewModel;

    private SolidColorBrush _inputTextBrush = new(Color.FromRgb(0x0F, 0x17, 0x2A));

    private SolidColorBrush _inputBackgroundBrush = Brushes.White;

    private SolidColorBrush _inputBorderBrush = new(Color.FromRgb(0xCB, 0xD5, 0xE1));

    private readonly SolidColorBrush _caretBrush = new(Color.FromRgb(0x63, 0x66, 0xF1));



    public LoginWindow()

    {

        InitializeComponent();



        _viewModel = new LoginViewModel();

        DataContext = _viewModel;



        _viewModel.LoginSucceeded += OnLoginSucceeded;

        _viewModel.DarkModeChanged += (_, _) => ApplyTheme(_viewModel.IsDarkMode);

        _viewModel.PropertyChanged += (_, args) =>

        {

            if (args.PropertyName == nameof(LoginViewModel.ShowPassword))

            {

                SyncPasswordFields();

                Dispatcher.BeginInvoke(RefreshLoginInputTheme);

            }

        };



        ApplyTheme(_viewModel.IsDarkMode);



        Loaded += (_, _) =>

        {

            RefreshLoginInputTheme();

            SyncPasswordFields();

            LoginIdBox.Focus();

            Keyboard.Focus(LoginIdBox);

        };

    }



    private void SyncPasswordFields()

    {

        if (_viewModel.ShowPassword)

            PasswordTextBox.Text = PasswordBox.Password;

        else

            PasswordBox.Password = _viewModel.Password;

    }



    private void PullCredentialsFromControls()

    {

        var loginId = LoginIdBox.Text;

        var password = _viewModel.ShowPassword ? PasswordTextBox.Text : PasswordBox.Password;

        _viewModel.PrepareLogin(loginId, password);

    }



    private void OnLoginSucceeded(object? sender, EventArgs e)

    {

        if (!Dispatcher.CheckAccess())

        {

            Dispatcher.Invoke(() => OnLoginSucceeded(sender, e));

            return;

        }



        DialogResult = true;

        Close();

    }



    private void CloseButton_OnClick(object sender, RoutedEventArgs e) => CloseLogin();



    private void LoginWindow_OnPreviewKeyDown(object sender, KeyEventArgs e)

    {

        if (e.Key == Key.Escape)

        {

            CloseLogin();

            e.Handled = true;

        }

    }



    private void CloseLogin()

    {

        DialogResult = false;

        Close();

    }



    private void LoginPanel_OnKeyDown(object sender, KeyEventArgs e)

    {

        if (e.Key != Key.Enter)

            return;



        PullCredentialsFromControls();

        if (_viewModel.LoginCommand.CanExecute(null))

        {

            _viewModel.LoginCommand.Execute(null);

            e.Handled = true;

        }

    }



    private void SignInButton_OnClick(object sender, RoutedEventArgs e)

    {

        PullCredentialsFromControls();

        if (_viewModel.LoginCommand.CanExecute(null))

            _viewModel.LoginCommand.Execute(null);

    }



    private void PasswordBox_OnPasswordChanged(object sender, RoutedEventArgs e)

    {

        if (sender is PasswordBox box && !_viewModel.ShowPassword)

            _viewModel.Password = box.Password;

    }



    private void ApplyTheme(bool dark)

    {

        if (dark)

        {

            RootGrid.Background = (Brush)FindResource("LoginPageBackground");

            _inputTextBrush = new SolidColorBrush(Color.FromRgb(0xF8, 0xFA, 0xFC));

            _inputBackgroundBrush = new SolidColorBrush(Color.FromRgb(0x0F, 0x17, 0x2A));

            _inputBorderBrush = new SolidColorBrush(Color.FromRgb(0x47, 0x55, 0x69));

            SetThemeBrush("LoginTextBrush", ((SolidColorBrush)_inputTextBrush).Color);

            SetThemeBrush("LoginTextMutedBrush", Color.FromRgb(0x94, 0xA3, 0xB8));

            SetThemeBrush("LoginInputBackgroundBrush", ((SolidColorBrush)_inputBackgroundBrush).Color);

            SetThemeBrush("LoginInputBorderBrush", ((SolidColorBrush)_inputBorderBrush).Color);

            SetThemeBrush("LoginChromeBackgroundBrush", Color.FromArgb(0x18, 0xFF, 0xFF, 0xFF));

            SetThemeBrush("LoginChromeBorderBrush", Color.FromArgb(0x28, 0xFF, 0xFF, 0xFF));

            SetThemeBrush("LoginCardBrush", Color.FromArgb(0x20, 0xFF, 0xFF, 0xFF));

            SetThemeBrush("LoginBorderBrush", Color.FromArgb(0x28, 0xFF, 0xFF, 0xFF));

            SetThemeBrush("LoginErrorBgBrush", Color.FromArgb(0x26, 0xF8, 0x71, 0x71));

        }

        else

        {

            RootGrid.Background = (Brush)FindResource("LoginPageBackgroundLight");

            _inputTextBrush = new SolidColorBrush(Color.FromRgb(0x0F, 0x17, 0x2A));

            _inputBackgroundBrush = Brushes.White;

            _inputBorderBrush = new SolidColorBrush(Color.FromRgb(0xCB, 0xD5, 0xE1));

            SetThemeBrush("LoginTextBrush", ((SolidColorBrush)_inputTextBrush).Color);

            SetThemeBrush("LoginTextMutedBrush", Color.FromRgb(0x47, 0x55, 0x69));

            SetThemeBrush("LoginInputBackgroundBrush", Colors.White);

            SetThemeBrush("LoginInputBorderBrush", ((SolidColorBrush)_inputBorderBrush).Color);

            SetThemeBrush("LoginChromeBackgroundBrush", Color.FromRgb(0xF1, 0xF5, 0xF9));

            SetThemeBrush("LoginChromeBorderBrush", Color.FromRgb(0xE2, 0xE8, 0xF0));

            SetThemeBrush("LoginCardBrush", Color.FromArgb(0xF5, 0xFF, 0xFF, 0xFF));

            SetThemeBrush("LoginBorderBrush", Color.FromRgb(0xE2, 0xE8, 0xF0));

            SetThemeBrush("LoginErrorBgBrush", Color.FromRgb(0xFE, 0xF2, 0xF2));

        }



        RefreshLoginInputTheme();

    }



    private void SetThemeBrush(string key, Color color) =>

        Resources[key] = new SolidColorBrush(color);



    private void RefreshLoginInputTheme()

    {

        ApplyInputTheme(LoginIdBorder, LoginIdBox);

        ApplyInputTheme(PasswordBorder, PasswordBox);

        ApplyInputTheme(PasswordTextBorder, PasswordTextBox);

    }



    private void ApplyInputTheme(Border border, Control input)

    {

        border.Background = _inputBackgroundBrush;

        border.BorderBrush = _inputBorderBrush;



        input.Foreground = _inputTextBrush;

        input.Background = Brushes.Transparent;

        TextElement.SetForeground(input, _inputTextBrush);



        if (input is TextBox textBox)

            textBox.CaretBrush = _caretBrush;

        else if (input is PasswordBox passwordBox)

            passwordBox.CaretBrush = _caretBrush;

    }



    protected override void OnClosed(EventArgs e)

    {

        _viewModel.LoginSucceeded -= OnLoginSucceeded;

        base.OnClosed(e);

    }

}


