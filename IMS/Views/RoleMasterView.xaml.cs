using System.Windows.Controls;
using System.Windows.Input;
using IMS.ViewModels;

namespace IMS.Views;

public partial class RoleMasterView : UserControl
{
    public RoleMasterView() => InitializeComponent();

    private void RolesGrid_OnMouseDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (DataContext is RoleMasterViewModel vm)
            vm.EditSelectedRole();
    }
}
