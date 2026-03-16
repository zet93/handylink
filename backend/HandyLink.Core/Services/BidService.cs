using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;

namespace HandyLink.Core.Services;

public class BidService(IBidRepository bids, IJobRepository jobs, NotificationService notifications)
{
    public async Task<BidResponseDto> SubmitBidAsync(Guid workerId, Guid jobId, SubmitBidDto dto, CancellationToken ct = default)
    {
        var job = await jobs.GetByIdAsync(jobId, ct)
            ?? throw new NotFoundException($"Job {jobId} not found");
        if (job.Status is not (JobStatus.Open or JobStatus.Bidding))
            throw new ValidationException("Job is not accepting bids");
        if (await bids.ExistsAsync(jobId, workerId, ct))
            throw new ConflictException("You have already submitted a bid on this job");

        var bid = new Bid
        {
            Id = Guid.NewGuid(),
            JobId = jobId,
            WorkerId = workerId,
            PriceEstimate = dto.PriceEstimate,
            Message = dto.Message,
            Status = BidStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await bids.AddAsync(bid, ct);

        if (job.Status == JobStatus.Open)
        {
            var trackedJob = (await jobs.GetByIdTrackedAsync(jobId, ct))!;
            trackedJob.Status = JobStatus.Bidding;
            trackedJob.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await bids.SaveChangesAsync(ct);

        await notifications.CreateAsync(job.ClientId, "New bid received",
            $"A worker submitted a bid of {dto.PriceEstimate:C} on your job", "bid_received", bid.Id, ct);
        return ToDto(bid);
    }

    public async Task<BidResponseDto> AcceptBidAsync(Guid userId, Guid bidId, CancellationToken ct = default)
    {
        var bid = await bids.GetByIdTrackedAsync(bidId, ct)
            ?? throw new NotFoundException($"Bid {bidId} not found");
        var job = await jobs.GetByIdTrackedAsync(bid.JobId, ct)
            ?? throw new NotFoundException("Associated job not found");
        if (job.ClientId != userId) throw new ForbiddenException("Not the job owner");

        bid.Status = BidStatus.Accepted;
        bid.UpdatedAt = DateTimeOffset.UtcNow;
        job.AcceptedBidId = bid.Id;
        job.Status = JobStatus.Accepted;
        job.UpdatedAt = DateTimeOffset.UtcNow;

        var otherBids = await bids.GetByJobIdTrackedAsync(job.Id, ct);
        foreach (var other in otherBids.Where(b => b.Id != bidId && b.Status == BidStatus.Pending))
        {
            other.Status = BidStatus.Rejected;
            other.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await bids.SaveChangesAsync(ct);

        await notifications.CreateAsync(bid.WorkerId, "Your bid was accepted",
            $"Congratulations! Your bid on '{job.Title}' was accepted.", "bid_accepted", bidId, ct);
        return ToDto(bid);
    }

    public async Task<BidResponseDto> RejectBidAsync(Guid userId, Guid bidId, CancellationToken ct = default)
    {
        var bid = await bids.GetByIdTrackedAsync(bidId, ct)
            ?? throw new NotFoundException($"Bid {bidId} not found");
        var job = await jobs.GetByIdAsync(bid.JobId, ct)
            ?? throw new NotFoundException("Associated job not found");
        if (job.ClientId != userId) throw new ForbiddenException("Not the job owner");

        bid.Status = BidStatus.Rejected;
        bid.UpdatedAt = DateTimeOffset.UtcNow;
        await bids.SaveChangesAsync(ct);

        await notifications.CreateAsync(bid.WorkerId, "Your bid was not selected",
            $"The client has rejected your bid on '{job.Title}'.", "bid_rejected", bidId, ct);
        return ToDto(bid);
    }

    private static BidResponseDto ToDto(Bid b) => new(
        b.Id, b.JobId, b.WorkerId, b.PriceEstimate, b.Message, b.Status, b.CreatedAt, b.UpdatedAt);
}
