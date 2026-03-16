using HandyLink.Core.DTOs;
using HandyLink.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/reviews")]
[Authorize]
public class ReviewsController(ReviewService reviewService) : BaseController
{
    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto, CancellationToken ct)
    {
        var result = await reviewService.CreateReviewAsync(GetUserId(), dto, ct);
        return Created($"/api/reviews/{result.Id}", result);
    }
}
