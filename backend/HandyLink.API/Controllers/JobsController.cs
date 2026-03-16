using HandyLink.Core.DTOs;
using HandyLink.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/jobs")]
[Authorize]
public class JobsController(JobService jobService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetJobs([FromQuery] JobFilter filter, CancellationToken ct)
        => Ok(await jobService.GetJobsAsync(filter, ct));

    [HttpPost]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobDto dto, CancellationToken ct)
    {
        var result = await jobService.CreateJobAsync(GetUserId(), dto, ct);
        return CreatedAtAction(nameof(GetJobById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJobById(Guid id, CancellationToken ct)
        => Ok(await jobService.GetJobByIdAsync(id, ct));

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateJobStatusDto dto, CancellationToken ct)
        => Ok(await jobService.UpdateJobStatusAsync(GetUserId(), id, dto.Status, ct));
}
