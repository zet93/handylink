using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Services;
using HandyLink.Infrastructure.Data;
using HandyLink.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Services;

public class JobServiceTests
{
    private static (HandyLinkDbContext ctx, JobService svc) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new JobService(new JobRepository(ctx)));
    }

    private static Profile SeedProfile(HandyLinkDbContext ctx)
    {
        var p = new Profile { Id = Guid.NewGuid(), FullName = "Client", Role = "client", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        ctx.Profiles.Add(p);
        ctx.SaveChanges();
        return p;
    }

    [Fact]
    public async Task CreateJob_ReturnsDto_WithCorrectClientId()
    {
        var (ctx, svc) = Build();
        var userId = SeedProfile(ctx).Id;
        var dto = new CreateJobDto("Fix sink", "Leaking pipe", JobCategory.Plumbing, "Bucharest", "RO", null, null, null, null, null, null);

        var result = await svc.CreateJobAsync(userId, dto);

        Assert.Equal(userId, result.ClientId);
        Assert.Equal(JobStatus.Open, result.Status);
        Assert.Equal("Fix sink", result.Title);
    }

    [Fact]
    public async Task GetJobById_ThrowsNotFound_WhenMissing()
    {
        var (_, svc) = Build();
        await Assert.ThrowsAsync<NotFoundException>(() => svc.GetJobByIdAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task GetJobById_ReturnsDto_WhenExists()
    {
        var (ctx, svc) = Build();
        var userId = SeedProfile(ctx).Id;
        var created = await svc.CreateJobAsync(userId, new CreateJobDto("Tile work", "Bathroom", JobCategory.General, "Cluj", "RO", null, null, null, null, null, null));

        var result = await svc.GetJobByIdAsync(created.Id);

        Assert.Equal(created.Id, result.Id);
    }

    [Fact]
    public async Task UpdateJobStatus_ThrowsForbidden_WhenNotOwner()
    {
        var (ctx, svc) = Build();
        var ownerId = SeedProfile(ctx).Id;
        var otherId = SeedProfile(ctx).Id;
        var job = await svc.CreateJobAsync(ownerId, new CreateJobDto("Job", "Desc", JobCategory.General, "City", "RO", null, null, null, null, null, null));

        await Assert.ThrowsAsync<ForbiddenException>(() => svc.UpdateJobStatusAsync(otherId, job.Id, JobStatus.Cancelled));
    }

    [Fact]
    public async Task UpdateJobStatus_UpdatesStatus_WhenOwner()
    {
        var (ctx, svc) = Build();
        var userId = SeedProfile(ctx).Id;
        var job = await svc.CreateJobAsync(userId, new CreateJobDto("Job", "Desc", JobCategory.General, "City", "RO", null, null, null, null, null, null));

        var result = await svc.UpdateJobStatusAsync(userId, job.Id, JobStatus.Cancelled);

        Assert.Equal(JobStatus.Cancelled, result.Status);
    }

    [Fact]
    public async Task GetJobs_FiltersByCategory()
    {
        var (ctx, svc) = Build();
        var userId = SeedProfile(ctx).Id;
        await svc.CreateJobAsync(userId, new CreateJobDto("A", "D", JobCategory.Plumbing, "City", "RO", null, null, null, null, null, null));
        await svc.CreateJobAsync(userId, new CreateJobDto("B", "D", JobCategory.Electrical, "City", "RO", null, null, null, null, null, null));

        var result = await svc.GetJobsAsync(new JobFilter(Category: JobCategory.Plumbing));

        Assert.Single(result.Items);
        Assert.Equal("A", result.Items[0].Title);
    }
}
