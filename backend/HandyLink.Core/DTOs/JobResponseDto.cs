using HandyLink.Core.Entities.Enums;

namespace HandyLink.Core.DTOs;

public record JobResponseDto(
    Guid Id,
    Guid ClientId,
    string Title,
    string Description,
    JobCategory Category,
    string City,
    string Country,
    decimal? BudgetMin,
    decimal? BudgetMax,
    JobStatus Status,
    Guid? AcceptedBidId,
    string[] Photos,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
