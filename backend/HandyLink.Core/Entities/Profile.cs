namespace HandyLink.Core.Entities;

public class Profile
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string Country { get; set; } = "RO";
    public string? Bio { get; set; }
    public string Role { get; set; } = "client";
    public string? ExpoPushToken { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public WorkerProfile? WorkerProfile { get; set; }
    public ICollection<Job> Jobs { get; set; } = [];
}
