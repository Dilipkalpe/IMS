using IMS.Models;

namespace IMS.Helpers;

internal static class MockRowFactory
{
    public const int DefaultListSize = 24;

    public static List<MockRow> Expand(IEnumerable<MockRow> seeds, int total = DefaultListSize)
    {
        var seedList = seeds.ToList();
        if (seedList.Count == 0)
            return [];

        var result = new List<MockRow>(total);
        for (var i = 0; i < total; i++)
        {
            var s = seedList[i % seedList.Count];
            var suffix = (i / seedList.Count) + 1;
            result.Add(new MockRow
            {
                Col1 = suffix > 1 ? $"{s.Col1}-{suffix:D2}" : s.Col1,
                Col2 = s.Col2,
                Col3 = s.Col3,
                Col4 = s.Col4,
                Col5 = s.Col5,
                Status = s.Status
            });
        }

        return result;
    }
}
