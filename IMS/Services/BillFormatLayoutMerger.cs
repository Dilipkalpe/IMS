using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

/// <summary>Merges API template metadata into a layout used for print and preview.</summary>
public static class BillFormatLayoutMerger
{
    public static SalesBillLayoutDefinition PrepareForPrint(
        SalesBillLayoutDefinition layout,
        BillFormatVisibilityRules visibilityRules,
        BillFormatPrintSettings? printSettings = null)
    {
        layout.Visibility = MergeVisibility(layout.Visibility, visibilityRules);
        if (printSettings is not null)
            layout.PrintSettings = printSettings;
        ApplyVisibilityToItemColumns(layout);
        return layout;
    }

    public static SalesBillLayoutDefinition? ToPrintLayout(SalesBillTemplateDto? template)
    {
        if (template is null)
            return null;

        var layout = template.ParseLayout();
        if (layout is null)
            return null;

        layout.Visibility = MergeVisibility(layout.Visibility, template.VisibilityRules);
        layout.PrintSettings = template.PrintSettings ?? layout.PrintSettings;
        ApplyVisibilityToItemColumns(layout);
        return layout;
    }

    public static bool ShouldRenderSection(SalesBillSectionDefinition section, SalesBillLayoutDefinition layout)
    {
        if (!section.Visible)
            return false;

        var v = layout.Visibility;
        return section.Type switch
        {
            "companyLogo" => v.ShowLogo,
            "companyDetails" => true,
            "customerDetails" => v.ShowCustomerInfo,
            "supplierDetails" => v.ShowSupplierInfo,
            "itemTable" => true,
            "taxDetails" => v.ShowTaxBreakup,
            "termsAndConditions" => true,
            "footer" => true,
            "header" => true,
            _ => true
        };
    }

    private static BillFormatVisibilityRules MergeVisibility(
        BillFormatVisibilityRules? fromLayout,
        BillFormatVisibilityRules? fromTemplate)
    {
        var baseRules = fromLayout ?? new BillFormatVisibilityRules();
        if (fromTemplate is null)
            return baseRules;

        return new BillFormatVisibilityRules
        {
            ShowLogo = fromTemplate.ShowLogo,
            ShowGst = fromTemplate.ShowGst,
            ShowDiscount = fromTemplate.ShowDiscount,
            ShowTaxBreakup = fromTemplate.ShowTaxBreakup,
            ShowBankDetails = fromTemplate.ShowBankDetails,
            ShowQrCode = fromTemplate.ShowQrCode,
            ShowSignature = fromTemplate.ShowSignature,
            ShowRate = fromTemplate.ShowRate,
            ShowAmountInWords = fromTemplate.ShowAmountInWords,
            ShowSupplierInfo = fromTemplate.ShowSupplierInfo,
            ShowCustomerInfo = fromTemplate.ShowCustomerInfo
        };
    }

    private static void ApplyVisibilityToItemColumns(SalesBillLayoutDefinition layout)
    {
        var v = layout.Visibility;
        foreach (var col in layout.ItemTable.Columns)
        {
            if (string.Equals(col.Key, "discount", StringComparison.OrdinalIgnoreCase)
                || string.Equals(col.Key, "discountAmount", StringComparison.OrdinalIgnoreCase))
            {
                if (!v.ShowDiscount)
                    col.Visible = false;
            }
            else if (string.Equals(col.Key, "rate", StringComparison.OrdinalIgnoreCase) && !v.ShowRate)
            {
                col.Visible = false;
            }
            else if (string.Equals(col.Key, "gstPercent", StringComparison.OrdinalIgnoreCase) && !v.ShowGst)
            {
                col.Visible = false;
            }
        }
    }
}
