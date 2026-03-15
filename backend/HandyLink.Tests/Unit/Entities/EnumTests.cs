using HandyLink.Core.Entities.Enums;

namespace HandyLink.Tests.Unit.Entities;

public class EnumTests
{
    [Fact]
    public void JobCategory_HasExpectedValues()
    {
        var values = Enum.GetNames<JobCategory>();
        Assert.Contains("Electrical", values);
        Assert.Contains("Plumbing", values);
        Assert.Contains("Painting", values);
        Assert.Contains("Carpentry", values);
        Assert.Contains("FurnitureAssembly", values);
        Assert.Contains("Cleaning", values);
        Assert.Contains("General", values);
        Assert.Contains("Other", values);
    }

    [Fact]
    public void JobStatus_HasExpectedValues()
    {
        var values = Enum.GetNames<JobStatus>();
        Assert.Contains("Open", values);
        Assert.Contains("Bidding", values);
        Assert.Contains("Accepted", values);
        Assert.Contains("InProgress", values);
        Assert.Contains("Completed", values);
        Assert.Contains("Cancelled", values);
        Assert.Contains("Disputed", values);
    }
}
