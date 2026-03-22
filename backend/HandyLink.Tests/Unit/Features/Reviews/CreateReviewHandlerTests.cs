using FluentAssertions;
using HandyLink.API.Features.Reviews.CreateReview;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Reviews;

public class CreateReviewHandlerTests
{
    private static (HandyLinkDbContext ctx, CreateReviewHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new CreateReviewHandler(ctx));
    }

    private static async Task<(Profile client, Profile worker, WorkerProfile workerProfile, Job job)> Seed(
        HandyLinkDbContext ctx, JobStatus status = JobStatus.Completed)
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
        var wp = new WorkerProfile
        {
            Id = worker.Id, Categories = [], PortfolioUrls = [],
            AverageRating = 0, TotalReviews = 0, CreatedAt = DateTimeOffset.UtcNow
        };
        var job = new Job
        {
            Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job",
            Description = "Desc here", Category = JobCategory.General, City = "City",
            Country = "RO", Status = status, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.AddRange(client, worker);
        ctx.WorkerProfiles.Add(wp);
        ctx.Jobs.Add(job);
        await ctx.SaveChangesAsync();
        return (client, worker, wp, job);
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenJobMissing()
    {
        var (_, handler) = Build();
        var act = () => handler.Handle(
            new CreateReviewCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 5, null),
            CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ThrowsValidationException_WhenJobNotCompleted()
    {
        var (ctx, handler) = Build();
        var (client, worker, _, job) = await Seed(ctx, JobStatus.InProgress);
        var act = () => handler.Handle(
            new CreateReviewCommand(client.Id, job.Id, worker.Id, 5, null), CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_ThrowsForbiddenException_WhenNotClient()
    {
        var (ctx, handler) = Build();
        var (_, worker, _, job) = await Seed(ctx);
        var act = () => handler.Handle(
            new CreateReviewCommand(worker.Id, job.Id, worker.Id, 5, null), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Handle_ThrowsConflictException_WhenDuplicateReview()
    {
        var (ctx, handler) = Build();
        var (client, worker, _, job) = await Seed(ctx);
        await handler.Handle(
            new CreateReviewCommand(client.Id, job.Id, worker.Id, 5, "Great"), CancellationToken.None);
        var act = () => handler.Handle(
            new CreateReviewCommand(client.Id, job.Id, worker.Id, 4, "Again"), CancellationToken.None);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Handle_UpdatesWorkerAverageRating()
    {
        var (ctx, handler) = Build();
        var (client, worker, _, job) = await Seed(ctx);
        await handler.Handle(
            new CreateReviewCommand(client.Id, job.Id, worker.Id, 4, "Good work"), CancellationToken.None);

        var wp = await ctx.WorkerProfiles.FindAsync(worker.Id);
        wp!.TotalReviews.Should().Be(1);
        wp.AverageRating.Should().Be(4);
    }
}
