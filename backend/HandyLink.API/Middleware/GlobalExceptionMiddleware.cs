using HandyLink.Core.Exceptions;

namespace HandyLink.API.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (status, message) = ex switch
            {
                NotFoundException  => (404, ex.Message),
                ForbiddenException => (403, ex.Message),
                ConflictException  => (409, ex.Message),
                Core.Exceptions.ValidationException => (400, ex.Message),
                _                  => (500, "An unexpected error occurred")
            };
            if (status == 500) logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { error = message, statusCode = status });
        }
    }
}
