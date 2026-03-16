using HandyLink.Core.Entities.Enums;

namespace HandyLink.Core.DTOs;

public record JobFilter(
    JobCategory? Category = null,
    string? City = null,
    string? Country = null,
    JobStatus? Status = null,
    int Page = 1,
    int PageSize = 20);
