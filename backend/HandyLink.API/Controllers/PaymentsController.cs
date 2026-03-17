using HandyLink.API.Features.Payments.CreatePaymentIntent;
using HandyLink.API.Features.Payments.HandleStripeWebhook;
using HandyLink.API.Features.Payments.WorkerConnectOnboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/payments")]
[Authorize]
public class PaymentsController(IMediator mediator) : BaseController
{
    [HttpPost("create-intent")]
    public async Task<IActionResult> CreateIntent([FromBody] CreateIntentRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreatePaymentIntentCommand(req.JobId, GetUserId()), ct);
        return Ok(result);
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        var body = await new StreamReader(Request.Body).ReadToEndAsync(ct);
        var sig = Request.Headers["Stripe-Signature"].ToString();
        await mediator.Send(new HandleStripeWebhookCommand(body, sig), ct);
        return Ok();
    }

    [HttpPost("connect-onboard")]
    public async Task<IActionResult> ConnectOnboard(CancellationToken ct)
    {
        var result = await mediator.Send(new WorkerConnectOnboardCommand(GetUserId()), ct);
        return Ok(result);
    }
}

public record CreateIntentRequest(Guid JobId);
