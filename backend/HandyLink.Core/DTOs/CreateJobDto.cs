using HandyLink.Core.Entities.Enums;

namespace HandyLink.Core.DTOs;

public record CreateJobDto(
    string Title,
    string Description,
    JobCategory Category,
    string City,
    string Country,
    decimal? BudgetMin,
    decimal? BudgetMax,
    string[]? Photos,
    decimal? Latitude,
    decimal? Longitude,
    string? Address);
