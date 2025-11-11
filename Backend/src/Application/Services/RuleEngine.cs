using FDMA.Domain.Entities;

namespace FDMA.Application.Services;

public static class RuleEngine
{
    // Evaluates rules and computes risk score based on severity weights
    // Total risk score is normalized to 100 percent if it exceeds 100
    public static int ComputeRiskScore(Transaction t, IEnumerable<Rule> rules)
    {
        var enabledRules = rules.Where(r => r.IsEnabled).ToList();
        
        // Calculate the maximum possible score (sum of all enabled rule weights)
        var maxPossibleScore = enabledRules.Sum(r => Math.Max(0, Math.Min(100, r.SeverityWeight)));
        
        int score = 0;
        foreach (var r in enabledRules)
        {
            var fieldValue = r.Field.ToLowerInvariant() switch
            {
                "amount" => t.Amount.ToString(),
                "device" => t.Device ?? "",
                "location" => t.Location ?? "",
                "transactiontype" => t.TransactionType,
                _ => ""
            };
            bool match = r.Condition.ToLowerInvariant() switch
            {
                "greaterthan" when decimal.TryParse(fieldValue, out var v) && decimal.TryParse(r.Value, out var th) => v > th,
                "equals" => string.Equals(fieldValue, r.Value, StringComparison.OrdinalIgnoreCase),
                "in" => r.Value.Split(',').Select(s => s.Trim()).Contains(fieldValue, StringComparer.OrdinalIgnoreCase),
                "notin" => !r.Value.Split(',').Select(s => s.Trim()).Contains(fieldValue, StringComparer.OrdinalIgnoreCase),
                _ => false
            };
            if (match)
            {
                // Ensure weight is within valid range (0-100)
                var weight = Math.Max(0, Math.Min(100, r.SeverityWeight));
                score += weight;
            }
        }
        
        // Normalize to 100 if the total exceeds 100
        if (score > 100 && maxPossibleScore > 100)
        {
            // Normalize: scale down proportionally based on maximum possible score
            // This preserves the relative weight distribution while ensuring the result fits within 100
            score = (int)Math.Round((double)score * 100.0 / maxPossibleScore);
        }
        
        return score;
    }
}