using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;
using HandyLink.Core.Services;
using HandyLink.Infrastructure.Data;
using HandyLink.Infrastructure.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace HandyLink.Tests.Unit.Services;

public class BidServiceTests
{
    private static (HandyLinkDbContext ctx, BidService svc) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        var notifSvc = new NotificationService(new NotificationRepository(ctx));
        var mediator = new Mock<IMediator>().Object;
        var profiles = new Mock<IProfileRepository>().Object;
        var svc = new BidService(new BidRepository(ctx), new JobRepository(ctx), notifSvc, mediator, profiles);
        return (ctx, svc);
    }

    private static (Profile client, Profile worker, Job job) Seed(HandyLinkDbContext ctx, JobStatus status = JobStatus.Open)
    {
        var client = new Profile { Id = Guid.NewGuid(), FullName = "Client", Role = "client", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var worker = new Profile { Id = Guid.NewGuid(), FullName = "Worker", Role = "worker", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Title = "Test Job", Description = "Desc", Category = JobCategory.General, City = "City", Country = "RO", Status = status, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        ctx.Profiles.AddRange(client, worker);
        ctx.Jobs.Add(job);
        ctx.SaveChanges();
        return (client, worker, job);
    }

    [Fact]
    public async Task SubmitBid_ThrowsNotFound_WhenJobMissing()
    {
        var (_, svc) = Build();
        await Assert.ThrowsAsync<NotFoundException>(() =>
            svc.SubmitBidAsync(Guid.NewGuid(), Guid.NewGuid(), new SubmitBidDto(100, "msg")));
    }

    [Fact]
    public async Task SubmitBid_ThrowsValidation_WhenJobCompleted()
    {
        var (ctx, svc) = Build();
        var (_, worker, job) = Seed(ctx, JobStatus.Completed);
        await Assert.ThrowsAsync<ValidationException>(() =>
            svc.SubmitBidAsync(worker.Id, job.Id, new SubmitBidDto(100, "msg")));
    }

    [Fact]
    public async Task SubmitBid_ThrowsConflict_WhenDuplicateBid()
    {
        var (ctx, svc) = Build();
        var (_, worker, job) = Seed(ctx);
        await svc.SubmitBidAsync(worker.Id, job.Id, new SubmitBidDto(100, "first"));
        await Assert.ThrowsAsync<ConflictException>(() =>
            svc.SubmitBidAsync(worker.Id, job.Id, new SubmitBidDto(200, "second")));
    }

    [Fact]
    public async Task SubmitBid_SetsJobToBidding_WhenJobWasOpen()
    {
        var (ctx, svc) = Build();
        var (_, worker, job) = Seed(ctx);
        await svc.SubmitBidAsync(worker.Id, job.Id, new SubmitBidDto(100, "msg"));
        var updated = await ctx.Jobs.FindAsync(job.Id);
        Assert.Equal(JobStatus.Bidding, updated!.Status);
    }

    [Fact]
    public async Task AcceptBid_ThrowsForbidden_WhenNotJobOwner()
    {
        var (ctx, svc) = Build();
        var (_, worker, job) = Seed(ctx);
        var bid = await svc.SubmitBidAsync(worker.Id, job.Id, new SubmitBidDto(100, "msg"));
        var other = new Profile { Id = Guid.NewGuid(), FullName = "Other", Role = "client", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        ctx.Profiles.Add(other);
        await ctx.SaveChangesAsync();
        await Assert.ThrowsAsync<ForbiddenException>(() => svc.AcceptBidAsync(other.Id, bid.Id));
    }

    [Fact]
    public async Task AcceptBid_SetsJobAccepted_AndRejectsOtherBids()
    {
        var (ctx, svc) = Build();
        var (client, worker, job) = Seed(ctx);
        var worker2 = new Profile { Id = Guid.NewGuid(), FullName = "Worker2", Role = "worker", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        ctx.Profiles.Add(worker2);
        await ctx.SaveChangesAsync();

        var bid1 = await svc.SubmitBidAsync(worker.Id, job.Id, new SubmitBidDto(100, "a"));
        var bid2 = await svc.SubmitBidAsync(worker2.Id, job.Id, new SubmitBidDto(120, "b"));

        await svc.AcceptBidAsync(client.Id, bid1.Id);

        var updatedJob = await ctx.Jobs.FindAsync(job.Id);
        Assert.Equal(JobStatus.Accepted, updatedJob!.Status);
        Assert.Equal(bid1.Id, updatedJob.AcceptedBidId);
        var rejectedBid = await ctx.Bids.FindAsync(bid2.Id);
        Assert.Equal(BidStatus.Rejected, rejectedBid!.Status);
    }
}
