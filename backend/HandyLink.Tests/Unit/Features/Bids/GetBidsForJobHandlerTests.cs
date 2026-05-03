using FluentAssertions;
using HandyLink.API.Features.Bids.GetBidsForJob;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Bids;

public class GetBidsForJobHandlerTests
{
    private static (HandyLinkDbContext ctx, GetBidsForJobHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new GetBidsForJobHandler(ctx));
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
    public async Task Handle_ThrowsNotFoundException_WhenJobMissing()
    {
        var (_, handler) = Build();
        var act = () => handler.Handle(
            new GetBidsForJobQuery(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsForbiddenException_WhenNotJobOwner()
    {
        var (ctx, handler) = Build();
        var (_, _, job) = await Seed(ctx);
        var act = () => handler.Handle(
            new GetBidsForJobQuery(Guid.NewGuid(), job.Id), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_ReturnsEmptyList_WhenJobHasNoBids()
    {
        var (ctx, handler) = Build();
        var (client, _, job) = await Seed(ctx);
        var result = await handler.Handle(
            new GetBidsForJobQuery(client.Id, job.Id), CancellationToken.None);
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ReturnsBids_WhenCallerIsJobOwner()
    {
        var (ctx, handler) = Build();
        var (client, worker, job) = await Seed(ctx);
        ctx.Bids.Add(new Bid
        {
            Id = Guid.NewGuid(), JobId = job.Id, WorkerId = worker.Id,
            PriceEstimate = 100, Message = "test bid", Status = BidStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        await ctx.SaveChangesAsync();

        var result = await handler.Handle(
            new GetBidsForJobQuery(client.Id, job.Id), CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].WorkerId.Should().Be(worker.Id);
        result[0].Status.Should().Be("Pending");
    }
}
