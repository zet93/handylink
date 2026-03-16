using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;

namespace HandyLink.Core.Services;

public class ReviewService(IReviewRepository reviews, IJobRepository jobs, IWorkerRepository workers)
{
    public async Task<ReviewResponseDto> CreateReviewAsync(Guid reviewerId, CreateReviewDto dto, CancellationToken ct = default)
    {
        var job = await jobs.GetByIdAsync(dto.JobId, ct)
            ?? throw new NotFoundException($"Job {dto.JobId} not found");
        if (job.Status != JobStatus.Completed)
            throw new ValidationException("Job must be completed before leaving a review");
        if (job.ClientId != reviewerId)
            throw new ForbiddenException("Only the client can review a completed job");
        if (await reviews.ExistsAsync(dto.JobId, reviewerId, ct))
            throw new ConflictException("You have already reviewed this job");

        var review = new Review
        {
            Id = Guid.NewGuid(),
            JobId = dto.JobId,
            ReviewerId = reviewerId,
            WorkerId = dto.WorkerId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTimeOffset.UtcNow
        };
        await reviews.AddAsync(review, ct);
        await reviews.SaveChangesAsync(ct);

        var workerProfile = await workers.GetByIdTrackedAsync(dto.WorkerId, ct);
        if (workerProfile is not null)
        {
            workerProfile.AverageRating = await reviews.GetAverageRatingAsync(dto.WorkerId, ct);
            workerProfile.TotalReviews = await reviews.GetTotalReviewsAsync(dto.WorkerId, ct);
            await workers.SaveChangesAsync(ct);
        }

        return new ReviewResponseDto(review.Id, review.JobId, review.ReviewerId, review.WorkerId, review.Rating, review.Comment, review.CreatedAt);
    }
}
