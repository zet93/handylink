using HandyLink.API.Features.Workers.UpdateWorkerLocation;
using HandyLink.Core.DTOs;
using HandyLink.Core.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/users")]
[Authorize]
public class UsersController(UserService userService, IMediator mediator) : BaseController
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
        => Ok(await userService.GetCurrentUserAsync(GetUserId(), ct));

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateUserDto dto, CancellationToken ct)
        => Ok(await userService.UpdateCurrentUserAsync(GetUserId(), dto, ct));

    [HttpPost("me/role")]
    public async Task<IActionResult> EnsureRole([FromBody] EnsureRoleDto dto, CancellationToken ct)
        => Ok(await userService.EnsureUserProfileAsync(GetUserId(), dto.Role, ct));

    [HttpPut("me/location")]
    public async Task<IActionResult> UpdateLocation([FromBody] UpdateWorkerLocationDto dto, CancellationToken ct)
        => Ok(await mediator.Send(new UpdateWorkerLocationCommand(
            GetUserId(), dto.Latitude, dto.Longitude, dto.ServiceRadiusKm), ct));
}

public record EnsureRoleDto(string Role);
public record UpdateWorkerLocationDto(decimal? Latitude, decimal? Longitude, int? ServiceRadiusKm);
