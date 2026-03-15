using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Integration.Data;

public class HandyLinkDbContextTests
{
    private static HandyLinkDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HandyLinkDbContext(options);
    }

    [Fact]
    public async Task CanAddAndQueryProfile()
    {
        await using var context = CreateContext();
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            FullName = "Test Client",
            Role = "client",
            Country = "RO",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        context.Profiles.Add(profile);
        await context.SaveChangesAsync();

        var loaded = await context.Profiles.FindAsync(profile.Id);
        Assert.NotNull(loaded);
        Assert.Equal("Test Client", loaded.FullName);
    }

    [Fact]
    public async Task CanAddJobLinkedToProfile()
    {
        await using var context = CreateContext();
        var clientId = Guid.NewGuid();
        context.Profiles.Add(new Profile
        {
            Id = clientId,
            FullName = "Client",
            Role = "client",
            Country = "RO",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        context.Jobs.Add(new Job
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            Title = "Fix my sink",
            Description = "Leaking pipe under kitchen sink",
            Category = JobCategory.Plumbing,
            City = "Bucharest",
            Country = "RO",
            Status = JobStatus.Open,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        await context.SaveChangesAsync();

        var job = await context.Jobs.FirstAsync();
        Assert.Equal("Fix my sink", job.Title);
        Assert.Equal(JobCategory.Plumbing, job.Category);
    }
}
