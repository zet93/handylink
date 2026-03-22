using HandyLink.API.Features.Reviews.CreateReview;
using HandyLink.Core.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/reviews")]
[Authorize]
public class ReviewsController(IMediator mediator) : BaseController
{
    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateReviewCommand(GetUserId(), dto.JobId, dto.WorkerId, dto.Rating, dto.Comment), ct);
        return Created($"/api/reviews/{result.Id}", result);
    }
}
