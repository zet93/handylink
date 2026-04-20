namespace HandyLink.API.Features.Jobs.GetJobs;

public record JobSummary(
    Guid Id,
    Guid ClientId,
    string Title,
    string Category,
    string City,
    string Country,
    decimal? BudgetMin,
    decimal? BudgetMax,
    string Status,
    int BidCount,
    DateTimeOffset CreatedAt,
    decimal? Latitude,
    decimal? Longitude,
    string? Address);

public record GetJobsResponse(List<JobSummary> Items, int TotalCount, int Page, int PageSize);
