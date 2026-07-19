namespace Ims.Domain.Common;

/// <summary>Base for all persisted entities. Id is exposed as Mongo-compatible _id in JSON.</summary>
public abstract class EntityBase
{
    public string Id { get; set; } = ObjectIdGenerator.NewId();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public interface IYearScoped
{
    string YearDatabaseName { get; set; }
}
