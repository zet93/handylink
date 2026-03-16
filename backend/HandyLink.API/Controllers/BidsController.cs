using HandyLink.Core.DTOs;
using HandyLink.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api")]
[Authorize]
public class BidsController(BidService bidService) : BaseController
{
    [HttpPost("jobs/{jobId:guid}/bids")]
    public async Task<IActionResult> SubmitBid(Guid jobId, [FromBody] SubmitBidDto dto, CancellationToken ct)
    {
        var result = await bidService.SubmitBidAsync(GetUserId(), jobId, dto, ct);
        return CreatedAtAction(nameof(SubmitBid), new { jobId }, result);
    }

    [HttpPatch("bids/{bidId:guid}/accept")]
    public async Task<IActionResult> AcceptBid(Guid bidId, CancellationToken ct)
        => Ok(await bidService.AcceptBidAsync(GetUserId(), bidId, ct));

    [HttpPatch("bids/{bidId:guid}/reject")]
    public async Task<IActionResult> RejectBid(Guid bidId, CancellationToken ct)
        => Ok(await bidService.RejectBidAsync(GetUserId(), bidId, ct));
}
