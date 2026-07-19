using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class AttendanceViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;
    private string _periodMonth = DateTime.Today.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    public AttendanceViewModel(MainViewModel host) : base(
        "Attendance",
        "Track daily presence, leave, worked hours, and overtime for payroll.",
        "\uE787",
        "Date", "Employee", "Name", "Status",
        [
            new("Records", "0", "\uE787", ThemeColors.Primary),
            new("Period", DateTime.Today.ToString("MMM yyyy"), "\uE823", ThemeColors.Slate),
            new("Present", "—", "\uE73E", ThemeColors.Success),
            new("Absent", "—", "\uE10F", ThemeColors.Warning)
        ],
        [],
        enableDelete: true)
    {
        _host = host;
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Mark Attendance", "\uE710", () => new MarkAttendanceViewModel(host, _periodMonth))
        ];
    }

    public string PeriodMonth
    {
        get => _periodMonth;
        set
        {
            if (!SetProperty(ref _periodMonth, value))
                return;
            ApiListLoader.RefreshAttendance(this, _periodMonth);
        }
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshAttendance(this, _periodMonth);

    protected override async Task<bool> DeleteRowCoreAsync(MockRow row)
    {
        if (row.Source is not AttendanceRecordDto dto || string.IsNullOrWhiteSpace(dto.Id))
            return false;
        var deleted = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            await ImsApiClient.DeleteAttendanceByIdAsync(dto.Id!);
            deleted = true;
        }, "Delete Attendance");
        if (deleted)
            ApiListLoader.RefreshAttendance(this, _periodMonth);
        return deleted;
    }

    protected override void OnRowDeleted(MockRow row) =>
        MessageBox.Show("Attendance record deleted.", "Attendance", MessageBoxButton.OK, MessageBoxImage.Information);
}
