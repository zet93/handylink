namespace HandyLink.Core.DTOs;

public record WorkerResponseDto(
    Guid Id,
    string FullName,
    string? AvatarUrl,
    string? Bio,
    string? City,
    string Country,
    string[] Categories,
    int YearsExperience,
    decimal AverageRating,
    int TotalReviews,
    bool IsVerified);
