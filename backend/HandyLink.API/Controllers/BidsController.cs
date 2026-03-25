using HandyLink.API.Features.Bids.AcceptBid;
using HandyLink.API.Features.Bids.SubmitBid;
using HandyLink.Core.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api")]
[Authorize]
public class BidsController(IMediator mediator) : BaseController
{
    [HttpPost("jobs/{jobId:guid}/bids")]
    public async Task<IActionResult> SubmitBid(Guid jobId, [FromBody] SubmitBidDto dto, CancellationToken ct)
    {
        var result = await mediator.Send(new SubmitBidCommand(GetUserId(), jobId, dto.PriceEstimate, dto.Message), ct);
        return CreatedAtAction(nameof(SubmitBid), new { jobId }, result);
    }

    [HttpPatch("bids/{bidId:guid}/accept")]
    public async Task<IActionResult> AcceptBid(Guid bidId, CancellationToken ct)
        => Ok(await mediator.Send(new AcceptBidCommand(GetUserId(), bidId), ct));
}
