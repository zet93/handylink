using FluentAssertions;
using HandyLink.API.Features.Bids.RejectBid;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Bids;

public class RejectBidHandlerTests
{
    private static (HandyLinkDbContext ctx, RejectBidHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new RejectBidHandler(ctx));
    }

    private static async Task<(Profile client, Profile worker, Job job)> Seed(HandyLinkDbContext ctx)
    {
        var client = new Profile
        {
            Id = Guid.NewGuid(), FullName = "Client", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        var worker = new Profile
        {
            Id = Guid.NewGuid(), FullName = "Worker", Role = "worker",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        var job = new Job
        {
            Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job",
            Description = "Desc here", Category = JobCategory.General, City = "City",
            Country = "RO", Status = JobStatus.Open, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.AddRange(client, worker);
        ctx.Jobs.Add(job);
        await ctx.SaveChangesAsync();
        return (client, worker, job);
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenBidMissing()
    {
        var (_, handler) = Build();
        var act = () => handler.Handle(
            new RejectBidCommand(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsForbiddenException_WhenNotJobOwner()
    {
        var (ctx, handler) = Build();
        var (_, worker, job) = await Seed(ctx);
        var bid = new Bid
        {
            Id = Guid.NewGuid(), JobId = job.Id, WorkerId = worker.Id,
            PriceEstimate = 100, Message = "msg", Status = BidStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Bids.Add(bid);
        await ctx.SaveChangesAsync();

        var act = () => handler.Handle(
            new RejectBidCommand(Guid.NewGuid(), bid.Id), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_ThrowsValidationException_WhenBidNotPending()
    {
        var (ctx, handler) = Build();
        var (client, worker, job) = await Seed(ctx);
        var bid = new Bid
        {
            Id = Guid.NewGuid(), JobId = job.Id, WorkerId = worker.Id,
            PriceEstimate = 100, Message = "msg", Status = BidStatus.Accepted,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Bids.Add(bid);
        await ctx.SaveChangesAsync();

        var act = () => handler.Handle(
            new RejectBidCommand(client.Id, bid.Id), CancellationToken.None);
        await act.Should().ThrowAsync<HandyLink.Core.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task Handle_SetsBidRejected_WhenPendingAndOwner()
    {
        var (ctx, handler) = Build();
        var (client, worker, job) = await Seed(ctx);
        var bid = new Bid
        {
            Id = Guid.NewGuid(), JobId = job.Id, WorkerId = worker.Id,
            PriceEstimate = 100, Message = "msg", Status = BidStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Bids.Add(bid);
        await ctx.SaveChangesAsync();

        var result = await handler.Handle(
            new RejectBidCommand(client.Id, bid.Id), CancellationToken.None);

        result.Status.Should().Be("Rejected");
        var updatedBid = await ctx.Bids.FindAsync(bid.Id);
        updatedBid!.Status.Should().Be(BidStatus.Rejected);
    }
}
