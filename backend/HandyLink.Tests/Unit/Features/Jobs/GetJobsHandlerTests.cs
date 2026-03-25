using FluentAssertions;
using HandyLink.API.Features.Jobs.GetJobs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Jobs;

public class GetJobsHandlerTests
{
    private static (HandyLinkDbContext ctx, GetJobsHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new GetJobsHandler(ctx));
    }

    private static Job MakeJob(Guid clientId, JobCategory cat = JobCategory.General, JobStatus status = JobStatus.Open)
        => new()
        {
            Id = Guid.NewGuid(), ClientId = clientId, Title = "Test Job",
            Description = "Test description here", Category = cat, City = "City",
            Country = "RO", Status = status, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };

    [Fact]
    public async Task Handle_ReturnsPaginatedResult()
    {
        var (ctx, handler) = Build();
        var clientId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile
        {
            Id = clientId, FullName = "C", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        for (int i = 0; i < 25; i++) ctx.Jobs.Add(MakeJob(clientId));
        await ctx.SaveChangesAsync();

        var result = await handler.Handle(new GetJobsQuery(null, null, 1, 20), CancellationToken.None);

        result.Items.Should().HaveCount(20);
        result.TotalCount.Should().Be(25);
    }

    [Fact]
    public async Task Handle_FiltersByCategory()
    {
        var (ctx, handler) = Build();
        var clientId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile
        {
            Id = clientId, FullName = "C", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        ctx.Jobs.Add(MakeJob(clientId, JobCategory.Plumbing));
        ctx.Jobs.Add(MakeJob(clientId, JobCategory.Electrical));
        await ctx.SaveChangesAsync();

        var result = await handler.Handle(new GetJobsQuery(JobCategory.Plumbing, null, 1, 20), CancellationToken.None);

        result.Items.Should().HaveCount(1);
        result.Items[0].Category.Should().Be("Plumbing");
    }

    [Fact]
    public async Task Handle_ExcludesCompletedJobs_ByDefault()
    {
        var (ctx, handler) = Build();
        var clientId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile
        {
            Id = clientId, FullName = "C", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        ctx.Jobs.Add(MakeJob(clientId, JobCategory.General, JobStatus.Open));
        ctx.Jobs.Add(MakeJob(clientId, JobCategory.General, JobStatus.Completed));
        await ctx.SaveChangesAsync();

        var result = await handler.Handle(new GetJobsQuery(null, null, 1, 20), CancellationToken.None);

        result.Items.Should().HaveCount(1);
    }
}
