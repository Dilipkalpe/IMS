using System.Windows;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;
using IMS.Views;

namespace IMS.Services;

public static class PayrollEmployeePickService
{
    public static MasterPickRow? Pick(Window? owner = null) =>
        MasterPickService.PickPayrollEmployee(owner);

    public static bool PickAndApply(IEnumerable<FormFieldViewModel> fields, Window? owner = null)
    {
        var selected = Pick(owner);
        if (selected is null)
            return false;

        PayrollEmployeeFormFields.ApplySelection(fields, selected);
        return true;
    }
}
