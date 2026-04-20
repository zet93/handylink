namespace HandyLink.Core.Entities;

public class WorkerProfile
{
    public Guid Id { get; set; }
    public string[] Categories { get; set; } = [];
    public int YearsExperience { get; set; }
    public string[] PortfolioUrls { get; set; } = [];
    public string? StripeAccountId { get; set; }
    public bool IsVerified { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? ServiceRadiusKm { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Profile Profile { get; set; } = null!;
}
