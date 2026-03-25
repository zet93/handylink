namespace HandyLink.API.Features.Reviews.CreateReview;

public record CreateReviewResponse(
    Guid Id,
    Guid JobId,
    Guid WorkerId,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt);
