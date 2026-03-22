using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Reviews.CreateReview;

public class CreateReviewHandler(HandyLinkDbContext context)
    : IRequestHandler<CreateReviewCommand, CreateReviewResponse>
{
    public async Task<CreateReviewResponse> Handle(CreateReviewCommand command, CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken)
            ?? throw new NotFoundException("Job not found.");

        if (job.Status != JobStatus.Completed)
            throw new ValidationException("Job must be completed before leaving a review.");

        if (job.ClientId != command.ReviewerId)
            throw new ForbiddenException("Only the client can review a completed job.");

        var duplicate = await context.Reviews.AnyAsync(
            r => r.JobId == command.JobId && r.ReviewerId == command.ReviewerId, cancellationToken);
        if (duplicate)
            throw new ConflictException("You have already reviewed this job.");

        var review = new Review
        {
            Id = Guid.NewGuid(),
            JobId = command.JobId,
            ReviewerId = command.ReviewerId,
            WorkerId = command.WorkerId,
            Rating = command.Rating,
            Comment = command.Comment,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.Reviews.Add(review);

        var wp = await context.WorkerProfiles.FindAsync(command.WorkerId)
            ?? throw new NotFoundException("Worker profile not found.");

        var newTotal = wp.TotalReviews + 1;
        wp.AverageRating = (wp.AverageRating * wp.TotalReviews + command.Rating) / newTotal;
        wp.TotalReviews = newTotal;

        await context.SaveChangesAsync(cancellationToken);

        return new CreateReviewResponse(review.Id, review.JobId, review.WorkerId,
            review.Rating, review.Comment, review.CreatedAt);
    }
}
