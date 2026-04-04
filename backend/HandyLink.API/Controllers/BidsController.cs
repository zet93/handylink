using HandyLink.API.Features.Bids.AcceptBid;
using HandyLink.API.Features.Bids.GetBidsForJob;
using HandyLink.API.Features.Bids.RejectBid;
using HandyLink.API.Features.Bids.SubmitBid;
using HandyLink.Core.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HandyLink.API.Controllers;

[Route("api")]
[Authorize]
public class BidsController(IMediator mediator) : BaseController
{
    [HttpPost("jobs/{jobId:guid}/bids")]
    [EnableRateLimiting("api_write")]
    public async Task<IActionResult> SubmitBid(Guid jobId, [FromBody] SubmitBidDto dto, CancellationToken ct)
    {
        var result = await mediator.Send(new SubmitBidCommand(GetUserId(), jobId, dto.PriceEstimate, dto.Message), ct);
        return CreatedAtAction(nameof(SubmitBid), new { jobId }, result);
    }

    [HttpGet("jobs/{jobId:guid}/bids")]
    public async Task<IActionResult> GetBidsForJob(Guid jobId, CancellationToken ct)
        => Ok(await mediator.Send(new GetBidsForJobQuery(GetUserId(), jobId), ct));

    [HttpPatch("bids/{bidId:guid}/accept")]
    public async Task<IActionResult> AcceptBid(Guid bidId, CancellationToken ct)
        => Ok(await mediator.Send(new AcceptBidCommand(GetUserId(), bidId), ct));

    [HttpPatch("bids/{bidId:guid}/reject")]
    public async Task<IActionResult> RejectBid(Guid bidId, CancellationToken ct)
        => Ok(await mediator.Send(new RejectBidCommand(GetUserId(), bidId), ct));
}
