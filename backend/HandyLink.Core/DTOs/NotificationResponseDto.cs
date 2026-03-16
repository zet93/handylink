namespace HandyLink.Core.DTOs;

public record NotificationResponseDto(
    Guid Id,
    string Title,
    string Body,
    string Type,
    Guid? ReferenceId,
    bool IsRead,
    DateTimeOffset CreatedAt);
