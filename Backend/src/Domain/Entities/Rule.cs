using FDMA.Domain.Enums;

namespace FDMA.Domain.Entities;

public class Rule
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!; // e.g., High Value Transaction
    public string Field { get; set; } = default!; // Amount, Device, Location
    public string Condition { get; set; } = default!; // GreaterThan, Equals, In, NotIn
    public string Value { get; set; } = default!; // "500000", "NG-LAGOS"
    public bool IsEnabled { get; set; } = true;
    public AlertSeverity Severity { get; set; } = AlertSeverity.Medium; // Low, Medium, High, Critical
    public int SeverityWeight { get; set; } = 25; // Weight in percentage (0-100), contributes to risk score
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}