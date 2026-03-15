using HandyLink.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Data;

public class HandyLinkDbContext(DbContextOptions<HandyLinkDbContext> options) : DbContext(options)
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<WorkerProfile> WorkerProfiles => Set<WorkerProfile>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Bid> Bids => Set<Bid>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");

        modelBuilder.Entity<Profile>(e =>
        {
            e.ToTable("profiles");
            e.HasKey(p => p.Id);
            e.Property(p => p.FullName).HasColumnName("full_name");
            e.Property(p => p.AvatarUrl).HasColumnName("avatar_url");
            e.Property(p => p.ExpoPushToken).HasColumnName("expo_push_token");
            e.Property(p => p.CreatedAt).HasColumnName("created_at");
            e.Property(p => p.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<WorkerProfile>(e =>
        {
            e.ToTable("worker_profiles");
            e.HasKey(w => w.Id);
            e.Property(w => w.Categories).HasColumnName("categories").HasColumnType("text[]");
            e.Property(w => w.PortfolioUrls).HasColumnName("portfolio_urls").HasColumnType("text[]");
            e.Property(w => w.YearsExperience).HasColumnName("years_experience");
            e.Property(w => w.StripeAccountId).HasColumnName("stripe_account_id");
            e.Property(w => w.IsVerified).HasColumnName("is_verified");
            e.Property(w => w.AverageRating).HasColumnName("average_rating");
            e.Property(w => w.TotalReviews).HasColumnName("total_reviews");
            e.Property(w => w.CreatedAt).HasColumnName("created_at");
            e.HasOne(w => w.Profile).WithOne(p => p.WorkerProfile).HasForeignKey<WorkerProfile>(w => w.Id);
        });

        modelBuilder.Entity<Job>(e =>
        {
            e.ToTable("jobs");
            e.HasKey(j => j.Id);
            e.Property(j => j.ClientId).HasColumnName("client_id");
            e.Property(j => j.Photos).HasColumnName("photos").HasColumnType("text[]");
            e.Property(j => j.BudgetMin).HasColumnName("budget_min");
            e.Property(j => j.BudgetMax).HasColumnName("budget_max");
            e.Property(j => j.AcceptedBidId).HasColumnName("accepted_bid_id");
            e.Property(j => j.StripePaymentIntentId).HasColumnName("stripe_payment_intent_id");
            e.Property(j => j.CreatedAt).HasColumnName("created_at");
            e.Property(j => j.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(j => j.Client).WithMany(p => p.Jobs).HasForeignKey(j => j.ClientId);
            e.HasOne(j => j.AcceptedBid).WithMany().HasForeignKey(j => j.AcceptedBidId);
        });

        modelBuilder.Entity<Bid>(e =>
        {
            e.ToTable("bids");
            e.HasKey(b => b.Id);
            e.Property(b => b.JobId).HasColumnName("job_id");
            e.Property(b => b.WorkerId).HasColumnName("worker_id");
            e.Property(b => b.PriceEstimate).HasColumnName("price_estimate");
            e.Property(b => b.CreatedAt).HasColumnName("created_at");
            e.Property(b => b.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(b => b.Job).WithMany(j => j.Bids).HasForeignKey(b => b.JobId);
            e.HasOne(b => b.Worker).WithMany().HasForeignKey(b => b.WorkerId);
            e.HasIndex(b => new { b.JobId, b.WorkerId }).IsUnique();
        });

        modelBuilder.Entity<Review>(e =>
        {
            e.ToTable("reviews");
            e.HasKey(r => r.Id);
            e.Property(r => r.JobId).HasColumnName("job_id");
            e.Property(r => r.ReviewerId).HasColumnName("reviewer_id");
            e.Property(r => r.WorkerId).HasColumnName("worker_id");
            e.Property(r => r.CreatedAt).HasColumnName("created_at");
            e.HasIndex(r => new { r.JobId, r.ReviewerId }).IsUnique();
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(n => n.Id);
            e.Property(n => n.UserId).HasColumnName("user_id");
            e.Property(n => n.IsRead).HasColumnName("is_read");
            e.Property(n => n.ReferenceId).HasColumnName("reference_id");
            e.Property(n => n.CreatedAt).HasColumnName("created_at");
        });
    }
}
