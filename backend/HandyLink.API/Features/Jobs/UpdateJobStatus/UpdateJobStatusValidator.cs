using FluentValidation;

namespace HandyLink.API.Features.Jobs.UpdateJobStatus;

public class UpdateJobStatusValidator : AbstractValidator<UpdateJobStatusCommand>
{
    public UpdateJobStatusValidator()
    {
        RuleFor(x => x.JobId).NotEmpty();
        RuleFor(x => x.Status).NotEmpty();
    }
}
