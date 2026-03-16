using HandyLink.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/workers")]
[Authorize]
public class WorkersController(WorkerService workerService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetWorkers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
        => Ok(await workerService.GetWorkersAsync(page, pageSize, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWorker(Guid id, CancellationToken ct)
        => Ok(await workerService.GetWorkerByIdAsync(id, ct));
}
