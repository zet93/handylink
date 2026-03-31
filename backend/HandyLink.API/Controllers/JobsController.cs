using HandyLink.API.Features.Jobs.CreateJob;
using HandyLink.API.Features.Jobs.GetJobById;
using HandyLink.API.Features.Jobs.GetJobs;
using HandyLink.API.Features.Jobs.UpdateJobStatus;
using HandyLink.Core.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/jobs")]
[Authorize]
public class JobsController(IMediator mediator) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetJobs([FromQuery] JobFilter filter, CancellationToken ct)
        => Ok(await mediator.Send(new GetJobsQuery(filter.Category, filter.Status, filter.Page, filter.PageSize), ct));

    [HttpPost]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobDto dto, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateJobCommand(
            GetUserId(), dto.Title, dto.Description, dto.Category, dto.City, dto.Country, dto.Photos, dto.BudgetMin, dto.BudgetMax), ct);
        return CreatedAtAction(nameof(GetJobById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJobById(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetJobByIdQuery(id), ct));

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateJobStatus(Guid id, [FromBody] UpdateJobStatusDto dto, CancellationToken ct)
        => Ok(await mediator.Send(new UpdateJobStatusCommand(GetUserId(), id, dto.Status), ct));
}
