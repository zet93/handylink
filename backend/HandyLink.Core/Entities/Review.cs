namespace HandyLink.Core.Entities;

public class Review
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Guid ReviewerId { get; set; }
    public Guid WorkerId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Job Job { get; set; } = null!;
    public Profile Reviewer { get; set; } = null!;
    public Profile Worker { get; set; } = null!;
}
