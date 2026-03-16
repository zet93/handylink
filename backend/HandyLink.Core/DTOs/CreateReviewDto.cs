namespace HandyLink.Core.DTOs;

public record CreateReviewDto(Guid JobId, Guid WorkerId, int Rating, string? Comment);
