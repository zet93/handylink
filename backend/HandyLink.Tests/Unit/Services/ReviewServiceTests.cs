using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Services;
using HandyLink.Infrastructure.Data;
using HandyLink.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Services;

public class ReviewServiceTests
{
    private static (HandyLinkDbContext ctx, ReviewService svc) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new ReviewService(new ReviewRepository(ctx), new JobRepository(ctx), new WorkerRepository(ctx)));
    }

    private static (Profile client, Profile worker, Job job) Seed(HandyLinkDbContext ctx, JobStatus status = JobStatus.Completed)
    {
        var client = new Profile { Id = Guid.NewGuid(), FullName = "Client", Role = "client", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var worker = new Profile { Id = Guid.NewGuid(), FullName = "Worker", Role = "worker", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var wp = new WorkerProfile { Id = worker.Id, Categories = [], YearsExperience = 1, PortfolioUrls = [], AverageRating = 0, TotalReviews = 0, CreatedAt = DateTimeOffset.UtcNow };
        var job = new Job { Id = Guid.NewGuid(), ClientId = client.Id, Title = "Job", Description = "D", Category = JobCategory.General, City = "City", Country = "RO", Status = status, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        ctx.Profiles.AddRange(client, worker);
        ctx.WorkerProfiles.Add(wp);
        ctx.Jobs.Add(job);
        ctx.SaveChanges();
        return (client, worker, job);
    }

    [Fact]
    public async Task CreateReview_ThrowsNotFound_WhenJobMissing()
    {
        var (_, svc) = Build();
        await Assert.ThrowsAsync<NotFoundException>(() =>
            svc.CreateReviewAsync(Guid.NewGuid(), new CreateReviewDto(Guid.NewGuid(), Guid.NewGuid(), 5, null)));
    }

    [Fact]
    public async Task CreateReview_ThrowsValidation_WhenJobNotCompleted()
    {
        var (ctx, svc) = Build();
        var (client, worker, job) = Seed(ctx, JobStatus.Open);
        await Assert.ThrowsAsync<ValidationException>(() =>
            svc.CreateReviewAsync(client.Id, new CreateReviewDto(job.Id, worker.Id, 5, null)));
    }

    [Fact]
    public async Task CreateReview_ThrowsForbidden_WhenNotClient()
    {
        var (ctx, svc) = Build();
        var (_, worker, job) = Seed(ctx);
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            svc.CreateReviewAsync(worker.Id, new CreateReviewDto(job.Id, worker.Id, 5, null)));
    }

    [Fact]
    public async Task CreateReview_ThrowsConflict_WhenDuplicate()
    {
        var (ctx, svc) = Build();
        var (client, worker, job) = Seed(ctx);
        await svc.CreateReviewAsync(client.Id, new CreateReviewDto(job.Id, worker.Id, 4, null));
        await Assert.ThrowsAsync<ConflictException>(() =>
            svc.CreateReviewAsync(client.Id, new CreateReviewDto(job.Id, worker.Id, 3, null)));
    }

    [Fact]
    public async Task CreateReview_UpdatesWorkerAverageRating()
    {
        var (ctx, svc) = Build();
        var (client, worker, job) = Seed(ctx);
        await svc.CreateReviewAsync(client.Id, new CreateReviewDto(job.Id, worker.Id, 4, "Good"));
        var wp = await ctx.WorkerProfiles.FindAsync(worker.Id);
        Assert.Equal(4m, wp!.AverageRating);
        Assert.Equal(1, wp.TotalReviews);
    }
}
