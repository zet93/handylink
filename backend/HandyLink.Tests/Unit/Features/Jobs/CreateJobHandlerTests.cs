using FluentAssertions;
using HandyLink.API.Features.Jobs.CreateJob;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Jobs;

public class CreateJobHandlerTests
{
    private static (HandyLinkDbContext ctx, CreateJobHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new CreateJobHandler(ctx));
    }

    [Fact]
    public async Task Handle_CreatesJob_WithOpenStatus()
    {
        var (ctx, handler) = Build();
        var clientId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile
        {
            Id = clientId, FullName = "Client", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        await ctx.SaveChangesAsync();

        var cmd = new CreateJobCommand(clientId, "Fix my sink", "Leaking badly",
            JobCategory.Plumbing, "Bucharest", "RO", null, 100, 300, null, null, null);
        var result = await handler.Handle(cmd, CancellationToken.None);

        result.Status.Should().Be(JobStatus.Open);
        result.ClientId.Should().Be(clientId);
        result.Title.Should().Be("Fix my sink");
    }

    [Fact]
    public async Task Handle_PersistsJobToDatabase()
    {
        var (ctx, handler) = Build();
        var clientId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile
        {
            Id = clientId, FullName = "Client", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        await ctx.SaveChangesAsync();

        var cmd = new CreateJobCommand(clientId, "Paint wall", "Big wall",
            JobCategory.Painting, "Cluj", "RO", null, 50, 200, null, null, null);
        await handler.Handle(cmd, CancellationToken.None);

        var count = await ctx.Jobs.CountAsync();
        count.Should().Be(1);
    }
}
