using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HandyLink.Infrastructure.Data;

/// <summary>
/// Dev-only seeder. Idempotent — safe to call on every startup.
/// BEFORE RUNNING: replace the placeholder UUIDs below with real UUIDs
/// from your Supabase Auth dashboard (Authentication → Users).
/// </summary>
public static class DataSeeder
{
    // TODO: replace with real UUIDs from Supabase Auth dashboard
    private static readonly Guid TestClientId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid TestWorkerId = Guid.Parse("00000000-0000-0000-0000-000000000002");

    public static async Task SeedAsync(IServiceProvider services)
    {
        await using var context = services.GetRequiredService<HandyLinkDbContext>();

        if (await context.Profiles.AnyAsync())
            return;

        var now = DateTimeOffset.UtcNow;

        context.Profiles.AddRange(
            new Profile
            {
                Id = TestClientId,
                FullName = "Test Client",
                Role = "client",
                City = "Bucharest",
                Country = "RO",
                CreatedAt = now,
                UpdatedAt = now
            },
            new Profile
            {
                Id = TestWorkerId,
                FullName = "Test Worker",
                Role = "worker",
                City = "Cluj-Napoca",
                Country = "RO",
                Bio = "Experienced electrician with 5 years in residential work.",
                CreatedAt = now,
                UpdatedAt = now
            }
        );
        await context.SaveChangesAsync();

        context.WorkerProfiles.Add(new WorkerProfile
        {
            Id = TestWorkerId,
            Categories = ["electrical", "general"],
            YearsExperience = 5,
            AverageRating = 0,
            TotalReviews = 0,
            CreatedAt = now
        });
        await context.SaveChangesAsync();

        var job1Id = Guid.NewGuid();

        context.Jobs.AddRange(
            new Job
            {
                Id = job1Id,
                ClientId = TestClientId,
                Title = "Fix electrical outlets in living room",
                Description = "Two outlets stopped working after a power surge. Need inspection and repair.",
                Category = JobCategory.Electrical,
                City = "Bucharest",
                Country = "RO",
                BudgetMin = 100,
                BudgetMax = 300,
                Status = JobStatus.Open,
                CreatedAt = now,
                UpdatedAt = now
            },
            new Job
            {
                Id = Guid.NewGuid(),
                ClientId = TestClientId,
                Title = "Kitchen sink leaking",
                Description = "Pipe under the kitchen sink has a slow drip. Needs a plumber ASAP.",
                Category = JobCategory.Plumbing,
                City = "Bucharest",
                Country = "RO",
                BudgetMax = 200,
                Status = JobStatus.Open,
                CreatedAt = now,
                UpdatedAt = now
            },
            new Job
            {
                Id = Guid.NewGuid(),
                ClientId = TestClientId,
                Title = "Paint bedroom walls",
                Description = "2 walls, roughly 20sqm total. Colour: white. Need prep + 2 coats.",
                Category = JobCategory.Painting,
                City = "Bucharest",
                Country = "RO",
                BudgetMin = 150,
                BudgetMax = 400,
                Status = JobStatus.Open,
                CreatedAt = now,
                UpdatedAt = now
            }
        );
        await context.SaveChangesAsync();

        context.Bids.Add(new Bid
        {
            Id = Guid.NewGuid(),
            JobId = job1Id,
            WorkerId = TestWorkerId,
            PriceEstimate = 180,
            Message = "I can be there tomorrow morning. I'll bring my own tools.",
            Status = BidStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        });
        await context.SaveChangesAsync();

        Console.WriteLine("[DataSeeder] Seed complete: 2 profiles, 1 worker profile, 3 jobs, 1 bid.");
    }
}
