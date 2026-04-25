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

    public async Task<UserResponseDto> EnsureUserProfileAsync(Guid userId, string role, CancellationToken ct = default)
    {
        var existing = await profiles.GetByIdTrackedAsync(userId, ct);
        if (existing is not null)
            return ToDto(existing);

        var profile = new Profile
        {
            Id = userId,
            FullName = string.Empty,
            Role = role,
            Country = "RO",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        await profiles.AddAsync(profile, ct);

        if (role is "worker" or "both")
        {
            await profiles.AddWorkerProfileAsync(
                new Entities.WorkerProfile { Id = userId, CreatedAt = DateTimeOffset.UtcNow }, ct);
        }

        await profiles.SaveChangesAsync(ct);
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
        if (dto.County is not null) profile.County = dto.County;
        if (dto.Country is not null) profile.Country = dto.Country;
        if (dto.Bio is not null) profile.Bio = dto.Bio;
        if (dto.ExpoPushToken is not null) profile.ExpoPushToken = dto.ExpoPushToken;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await profiles.SaveChangesAsync(ct);
        return ToDto(profile);
    }

    private static UserResponseDto ToDto(Profile p) => new(
        p.Id, p.FullName, p.AvatarUrl, p.Phone, p.City, p.Country, p.Bio, p.Role, p.CreatedAt);
}
