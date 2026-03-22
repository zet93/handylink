using FluentValidation;

namespace HandyLink.API.Features.Jobs.GetJobs;

public class GetJobsValidator : AbstractValidator<GetJobsQuery>
{
    public GetJobsValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
