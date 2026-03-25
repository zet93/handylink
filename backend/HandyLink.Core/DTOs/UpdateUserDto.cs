namespace HandyLink.Core.DTOs;

public record UpdateUserDto(
    string? FullName,
    string? AvatarUrl,
    string? Phone,
    string? City,
    string? Country,
    string? Bio,
    string? ExpoPushToken);
