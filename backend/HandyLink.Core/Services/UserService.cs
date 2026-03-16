using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;

namespace HandyLink.Core.Services;

public class UserService(IProfileRepository profiles)
{
    public async Task<UserResponseDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await profiles.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException($"User {userId} not found");
        return ToDto(profile);
    }

    public async Task<UserResponseDto> UpdateCurrentUserAsync(Guid userId, UpdateUserDto dto, CancellationToken ct = default)
    {
        var profile = await profiles.GetByIdTrackedAsync(userId, ct)
            ?? throw new NotFoundException($"User {userId} not found");
        if (dto.FullName is not null) profile.FullName = dto.FullName;
        if (dto.AvatarUrl is not null) profile.AvatarUrl = dto.AvatarUrl;
        if (dto.Phone is not null) profile.Phone = dto.Phone;
        if (dto.City is not null) profile.City = dto.City;
        if (dto.Country is not null) profile.Country = dto.Country;
        if (dto.Bio is not null) profile.Bio = dto.Bio;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await profiles.SaveChangesAsync(ct);
        return ToDto(profile);
    }

    private static UserResponseDto ToDto(Profile p) => new(
        p.Id, p.FullName, p.AvatarUrl, p.Phone, p.City, p.Country, p.Bio, p.Role, p.CreatedAt);
}
