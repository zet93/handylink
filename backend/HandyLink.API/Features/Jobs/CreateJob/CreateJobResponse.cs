using HandyLink.Core.Entities.Enums;

namespace HandyLink.API.Features.Jobs.CreateJob;

public record CreateJobResponse(
    Guid Id,
    Guid ClientId,
    string Title,
    string Description,
    string Category,
    string City,
    string Country,
    decimal? BudgetMin,
    decimal? BudgetMax,
    JobStatus Status,
    DateTimeOffset CreatedAt);
