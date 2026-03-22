namespace HandyLink.API.Features.Jobs.GetJobById;

public record GetJobByIdResponse(
    Guid Id,
    Guid ClientId,
    string Title,
    string Description,
    string Category,
    string City,
    string Country,
    string[] Photos,
    decimal? BudgetMin,
    decimal? BudgetMax,
    string Status,
    DateTimeOffset CreatedAt);
