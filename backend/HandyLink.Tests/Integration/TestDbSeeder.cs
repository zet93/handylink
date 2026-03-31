using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace HandyLink.Tests.Integration;

public static class TestDbSeeder
{
    public static async Task<(Profile client, Profile worker)> SeedUsersAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HandyLinkDbContext>();
        var client = new Profile { Id = Guid.NewGuid(), FullName = "Test Client", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        var worker = new Profile { Id = Guid.NewGuid(), FullName = "Test Worker", Role = "worker",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.Profiles.AddRange(client, worker);
        await db.SaveChangesAsync();
        return (client, worker);
    }

    public static async Task<Job> SeedJobAsync(IServiceProvider sp, Guid clientId, JobStatus status = JobStatus.Open)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HandyLinkDbContext>();
        var job = new Job { Id = Guid.NewGuid(), ClientId = clientId, Title = "Test Job",
            Description = "Test description here", Category = JobCategory.General,
            City = "Bucharest", Country = "RO", Status = status, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.Jobs.Add(job);
        await db.SaveChangesAsync();
        return job;
    }

    public static async Task<Bid> SeedBidAsync(IServiceProvider sp, Guid workerId, Guid jobId)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HandyLinkDbContext>();
        var bid = new Bid { Id = Guid.NewGuid(), WorkerId = workerId, JobId = jobId,
            PriceEstimate = 200, Message = "Test bid", Status = BidStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        db.Bids.Add(bid);
        await db.SaveChangesAsync();
        return bid;
    }
}
