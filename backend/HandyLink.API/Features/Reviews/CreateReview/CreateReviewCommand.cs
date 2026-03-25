using MediatR;

namespace HandyLink.API.Features.Reviews.CreateReview;

public record CreateReviewCommand(
    Guid ReviewerId,
    Guid JobId,
    Guid WorkerId,
    int Rating,
    string? Comment
) : IRequest<CreateReviewResponse>;
