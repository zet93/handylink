using HandyLink.Core.Entities.Enums;

namespace HandyLink.Core.DTOs;

public record BidResponseDto(
    Guid Id,
    Guid JobId,
    Guid WorkerId,
    decimal PriceEstimate,
    string Message,
    BidStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
