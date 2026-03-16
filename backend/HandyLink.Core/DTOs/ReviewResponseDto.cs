namespace HandyLink.Core.DTOs;

public record ReviewResponseDto(
    Guid Id,
    Guid JobId,
    Guid ReviewerId,
    Guid WorkerId,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt);
