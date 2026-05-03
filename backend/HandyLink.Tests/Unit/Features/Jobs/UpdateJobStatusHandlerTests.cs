using FluentAssertions;
using HandyLink.API.Features.Jobs.UpdateJobStatus;
using HandyLink.Core.Commands;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace HandyLink.Tests.Unit.Features.Jobs;

public class UpdateJobStatusHandlerTests
{
    private static (HandyLinkDbContext ctx, UpdateJobStatusHandler handler, Mock<IMediator> mediator) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        var mediator = new Mock<IMediator>();
        return (ctx, new UpdateJobStatusHandler(ctx, mediator.Object), mediator);
    }

    private static async Task<(Profile client, Job job)> Seed(HandyLinkDbContext ctx, JobStatus status = JobStatus.Accepted, bool withAcceptedBid = false)
    {
        var client = new Profile
        {
            Id = Guid.NewGuid(), FullName = "Client", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        var job = new Job
        {
            Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job",
            Description = "Desc here", Category = JobCategory.General, City = "City",
            Country = "RO", Status = status, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.Add(client);
        ctx.Jobs.Add(job);

        if (withAcceptedBid)
        {
            var worker = new Profile
            {
                Id = Guid.NewGuid(), FullName = "Worker", Role = "worker",
                Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            };
            ctx.Profiles.Add(worker);
            var bid = new Bid
            {
                Id = Guid.NewGuid(), JobId = job.Id, WorkerId = worker.Id,
                PriceEstimate = 100, Message = "msg", Status = BidStatus.Accepted,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            };
            ctx.Bids.Add(bid);
            job.AcceptedBidId = bid.Id;
        }

        await ctx.SaveChangesAsync();
        return (client, job);
    }

    [Fact]
    public async Task Handle_TransitionsAcceptedToInProgress_ForJobOwner()
    {
        var (ctx, handler, _) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Accepted);

        var result = await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "InProgress"), CancellationToken.None);

        result.Status.Should().Be("InProgress");
        var updated = await ctx.Jobs.FindAsync(job.Id);
        updated!.Status.Should().Be(JobStatus.InProgress);
    }

    [Fact]
    public async Task Handle_TransitionsInProgressToCompleted_ForJobOwner()
    {
        var (ctx, handler, _) = Build();
        var (client, job) = await Seed(ctx, JobStatus.InProgress);

        var result = await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "Completed"), CancellationToken.None);

        result.Status.Should().Be("Completed");
        var updated = await ctx.Jobs.FindAsync(job.Id);
        updated!.Status.Should().Be(JobStatus.Completed);
    }

    [Fact]
    public async Task Handle_ThrowsForbiddenException_WhenNotJobOwner()
    {
        var (ctx, handler, _) = Build();
        var (_, job) = await Seed(ctx, JobStatus.Accepted);

        var act = () => handler.Handle(
            new UpdateJobStatusCommand(Guid.NewGuid(), job.Id, "InProgress"), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenJobMissing()
    {
        var (_, handler, _) = Build();

        var act = () => handler.Handle(
            new UpdateJobStatusCommand(Guid.NewGuid(), Guid.NewGuid(), "InProgress"), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsValidationException_ForInvalidTransition()
    {
        var (ctx, handler, _) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Open);

        var act = () => handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "Completed"), CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_ParsesSnakeCaseStatus_Correctly()
    {
        var (ctx, handler, _) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Accepted);

        var result = await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "in_progress"), CancellationToken.None);

        result.Status.Should().Be("InProgress");
        var updated = await ctx.Jobs.FindAsync(job.Id);
        updated!.Status.Should().Be(JobStatus.InProgress);
    }

    [Fact]
    public async Task Handle_SendsNotification_WhenTransitionToInProgress()
    {
        var (ctx, handler, mediator) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Accepted, withAcceptedBid: true);

        await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "InProgress"), CancellationToken.None);

        mediator.Verify(m => m.Send(
            It.Is<SendPushNotificationCommand>(c => c.Type == "job_in_progress"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_SendsNotification_WhenTransitionToCompleted()
    {
        var (ctx, handler, mediator) = Build();
        var (client, job) = await Seed(ctx, JobStatus.InProgress, withAcceptedBid: true);

        await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "Completed"), CancellationToken.None);

        mediator.Verify(m => m.Send(
            It.Is<SendPushNotificationCommand>(c => c.Type == "job_completed"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_SendsNotification_WhenTransitionToCancelled()
    {
        var (ctx, handler, mediator) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Accepted, withAcceptedBid: true);

        await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "Cancelled"), CancellationToken.None);

        mediator.Verify(m => m.Send(
            It.Is<SendPushNotificationCommand>(c => c.Type == "job_cancelled"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_SkipsNotification_WhenNoAcceptedBid()
    {
        var (ctx, handler, mediator) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Accepted, withAcceptedBid: false);

        await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "Cancelled"), CancellationToken.None);

        mediator.Verify(m => m.Send(
            It.IsAny<SendPushNotificationCommand>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
