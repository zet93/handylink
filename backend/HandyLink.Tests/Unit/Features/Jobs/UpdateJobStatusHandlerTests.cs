using FluentAssertions;
using HandyLink.API.Features.Jobs.UpdateJobStatus;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Jobs;

public class UpdateJobStatusHandlerTests
{
    private static (HandyLinkDbContext ctx, UpdateJobStatusHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new UpdateJobStatusHandler(ctx));
    }

    private static async Task<(Profile client, Job job)> Seed(HandyLinkDbContext ctx, JobStatus status = JobStatus.Accepted)
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
        await ctx.SaveChangesAsync();
        return (client, job);
    }

    [Fact]
    public async Task Handle_TransitionsAcceptedToInProgress_ForJobOwner()
    {
        var (ctx, handler) = Build();
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
        var (ctx, handler) = Build();
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
        var (ctx, handler) = Build();
        var (_, job) = await Seed(ctx, JobStatus.Accepted);

        var act = () => handler.Handle(
            new UpdateJobStatusCommand(Guid.NewGuid(), job.Id, "InProgress"), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenJobMissing()
    {
        var (_, handler) = Build();

        var act = () => handler.Handle(
            new UpdateJobStatusCommand(Guid.NewGuid(), Guid.NewGuid(), "InProgress"), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsValidationException_ForInvalidTransition()
    {
        var (ctx, handler) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Open);

        var act = () => handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "Completed"), CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_ParsesSnakeCaseStatus_Correctly()
    {
        var (ctx, handler) = Build();
        var (client, job) = await Seed(ctx, JobStatus.Accepted);

        var result = await handler.Handle(
            new UpdateJobStatusCommand(client.Id, job.Id, "in_progress"), CancellationToken.None);

        result.Status.Should().Be("InProgress");
        var updated = await ctx.Jobs.FindAsync(job.Id);
        updated!.Status.Should().Be(JobStatus.InProgress);
    }
}
