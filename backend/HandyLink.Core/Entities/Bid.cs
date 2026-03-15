namespace HandyLink.Core.Entities;

public class Bid
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public Guid WorkerId { get; set; }
    public decimal PriceEstimate { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Job Job { get; set; } = null!;
    public Profile Worker { get; set; } = null!;
}
