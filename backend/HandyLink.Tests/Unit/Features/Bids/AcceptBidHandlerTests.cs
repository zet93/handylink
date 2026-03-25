using FluentAssertions;
using HandyLink.API.Features.Bids.AcceptBid;
using HandyLink.API.Features.Bids.SubmitBid;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace HandyLink.Tests.Unit.Features.Bids;

public class AcceptBidHandlerTests
{
    private static (HandyLinkDbContext ctx, AcceptBidHandler acceptHandler, SubmitBidHandler submitHandler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        var mediator = new Mock<IMediator>().Object;
        return (ctx, new AcceptBidHandler(ctx, mediator), new SubmitBidHandler(ctx, mediator));
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
        var (_, acceptHandler, _) = Build();
        var act = () => acceptHandler.Handle(
            new AcceptBidCommand(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsForbiddenException_WhenNotJobOwner()
    {
        var (ctx, acceptHandler, submitHandler) = Build();
        var (_, worker, job) = await Seed(ctx);
        var bid = await submitHandler.Handle(
            new SubmitBidCommand(worker.Id, job.Id, 100, "msg"), CancellationToken.None);

        var act = () => acceptHandler.Handle(
            new AcceptBidCommand(Guid.NewGuid(), bid.Id), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_SetsJobAccepted_AndStoresAcceptedBidId()
    {
        var (ctx, acceptHandler, submitHandler) = Build();
        var (client, worker, job) = await Seed(ctx);
        var bid = await submitHandler.Handle(
            new SubmitBidCommand(worker.Id, job.Id, 100, "msg"), CancellationToken.None);

        await acceptHandler.Handle(new AcceptBidCommand(client.Id, bid.Id), CancellationToken.None);

        var updatedJob = await ctx.Jobs.FindAsync(job.Id);
        updatedJob!.Status.Should().Be(JobStatus.Accepted);
        updatedJob.AcceptedBidId.Should().Be(bid.Id);
    }

    [Fact]
    public async Task Handle_RejectsAllOtherPendingBids()
    {
        var (ctx, acceptHandler, submitHandler) = Build();
        var (client, worker, job) = await Seed(ctx);
        var worker2 = new Profile
        {
            Id = Guid.NewGuid(), FullName = "W2", Role = "worker",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.Add(worker2);
        await ctx.SaveChangesAsync();

        var bid1 = await submitHandler.Handle(new SubmitBidCommand(worker.Id, job.Id, 100, "a"), CancellationToken.None);
        var bid2 = await submitHandler.Handle(new SubmitBidCommand(worker2.Id, job.Id, 120, "b"), CancellationToken.None);

        await acceptHandler.Handle(new AcceptBidCommand(client.Id, bid1.Id), CancellationToken.None);

        var rejectedBid = await ctx.Bids.FindAsync(bid2.Id);
        rejectedBid!.Status.Should().Be(BidStatus.Rejected);
    }
}
