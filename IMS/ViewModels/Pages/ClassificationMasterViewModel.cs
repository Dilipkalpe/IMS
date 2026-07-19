using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public sealed class ClassificationMasterViewModel : MockPageViewModel
{
    public ClassificationMasterViewModel(MainViewModel host, ClassificationMasterKind kind)
        : base(
            Def(kind).PageTitle,
            Def(kind).PageDescription,
            Def(kind).IconGlyph,
            Def(kind).Col1Header,
            Def(kind).Col2Header,
            Def(kind).Col3Header,
            Def(kind).Col4Header,
            Def(kind).Stats,
            Def(kind).SeedRows)
    {
        Kind = kind;
        var def = Def(kind);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, def.AddActionTitle, "\uE710", () => def.CreateAddPage(host))
        ];
    }

    public ClassificationMasterKind Kind { get; }

    private static ClassificationMasterDefinition Def(ClassificationMasterKind kind) =>
        ClassificationMasterCatalog.Get(kind);
}
