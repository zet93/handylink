using HandyLink.Core.Entities.Enums;

namespace HandyLink.Core.Entities;

public class Job
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public JobCategory Category { get; set; }
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = "RO";
    public string[] Photos { get; set; } = [];
    public decimal? BudgetMin { get; set; }
    public decimal? BudgetMax { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Open;
    public Guid? AcceptedBidId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Profile Client { get; set; } = null!;
    public ICollection<Bid> Bids { get; set; } = [];
    public Bid? AcceptedBid { get; set; }
}
