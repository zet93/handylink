using FluentAssertions;
using HandyLink.API.Features.Bids.SubmitBid;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace HandyLink.Tests.Unit.Features.Bids;

public class SubmitBidHandlerTests
{
    private static (HandyLinkDbContext ctx, SubmitBidHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        var mediator = new Mock<IMediator>().Object;
        return (ctx, new SubmitBidHandler(ctx, mediator));
    }

    private static (Profile client, Profile worker, Job job) Seed(
        HandyLinkDbContext ctx, JobStatus status = JobStatus.Open)
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
            Country = "RO", Status = status, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.AddRange(client, worker);
        ctx.Jobs.Add(job);
        ctx.SaveChanges();
        return (client, worker, job);
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenJobMissing()
    {
        var (_, handler) = Build();
        var act = () => handler.Handle(
            new SubmitBidCommand(Guid.NewGuid(), Guid.NewGuid(), 100, "msg"), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsValidationException_WhenJobCompleted()
    {
        var (ctx, handler) = Build();
        var (_, worker, job) = Seed(ctx, JobStatus.Completed);
        var act = () => handler.Handle(
            new SubmitBidCommand(worker.Id, job.Id, 100, "msg"), CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_ThrowsConflictException_WhenDuplicateBid()
    {
        var (ctx, handler) = Build();
        var (_, worker, job) = Seed(ctx);
        await handler.Handle(new SubmitBidCommand(worker.Id, job.Id, 100, "first"), CancellationToken.None);
        var act = () => handler.Handle(
            new SubmitBidCommand(worker.Id, job.Id, 200, "second"), CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Handle_TransitionsJobToBidding_WhenJobWasOpen()
    {
        var (ctx, handler) = Build();
        var (_, worker, job) = Seed(ctx);
        await handler.Handle(new SubmitBidCommand(worker.Id, job.Id, 150, "msg"), CancellationToken.None);
        var updated = await ctx.Jobs.FindAsync(job.Id);
        updated!.Status.Should().Be(JobStatus.Bidding);
    }

    [Fact]
    public async Task Handle_RetainsBiddingStatus_WhenJobAlreadyBidding()
    {
        var (ctx, handler) = Build();
        var (_, worker, job) = Seed(ctx, JobStatus.Bidding);
        var worker2 = new Profile
        {
            Id = Guid.NewGuid(), FullName = "W2", Role = "worker",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.Add(worker2);
        await ctx.SaveChangesAsync();

        await handler.Handle(new SubmitBidCommand(worker2.Id, job.Id, 120, "msg"), CancellationToken.None);

        var updated = await ctx.Jobs.FindAsync(job.Id);
        updated!.Status.Should().Be(JobStatus.Bidding);
    }
}
