using IMS.Reporting.Models;



namespace IMS.Reporting.Services;



public static class ReportLayoutBootstrap

{

    public static void EnsureElements(ReportLayoutDocument layout, string transactionType)

    {

        if (layout.Elements.Count > 0)

            return;



        ReportStandardLayouts.ApplyStandard(layout, transactionType);

    }

}

