namespace HandyLink.Core.DTOs;

public record UserResponseDto(
    Guid Id,
    string FullName,
    string? AvatarUrl,
    string? Phone,
    string? City,
    string? County,
    string Country,
    string? Bio,
    string Role,
    DateTimeOffset CreatedAt);
