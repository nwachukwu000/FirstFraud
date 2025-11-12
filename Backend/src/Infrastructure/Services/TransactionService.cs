using FDMA.Application.DTOs;
using FDMA.Application.Interfaces;
using FDMA.Application.Services;
using FDMA.Domain.Entities;
using FDMA.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FDMA.Infrastructure.Services;

public class TransactionService : ITransactionService
{
	private readonly AppDbContext _db;
	private readonly IEmailService _emailService;

	public TransactionService(AppDbContext db, IEmailService emailService)
	{
		_db = db;
		_emailService = emailService;
	}

	private static void ApplyRiskScores(IEnumerable<Transaction> transactions, IReadOnlyCollection<Rule> rules)
	{
		foreach (var tx in transactions)
		{
			var risk = RuleEngine.ComputeRiskScore(tx, rules);
			tx.RiskScore = risk;
			tx.IsFlagged = risk > 0;
			// Update status based on flagged status
			tx.Status = tx.IsFlagged ? "Flagged" : "Normal";
		}
	}

	private static bool RuleMatches(Rule rule, Transaction tx)
	{
		var fieldValue = rule.Field.ToLowerInvariant() switch
		{
			"amount" => tx.Amount.ToString(),
			"device" => tx.Device ?? string.Empty,
			"location" => tx.Location ?? string.Empty,
			"transactiontype" => tx.TransactionType,
			_ => string.Empty
		};
		return rule.Condition.ToLowerInvariant() switch
		{
			"greaterthan" when decimal.TryParse(fieldValue, out var v) && decimal.TryParse(rule.Value, out var th) => v > th,
			"lessthan" when decimal.TryParse(fieldValue, out var vv) && decimal.TryParse(rule.Value, out var th2) => vv < th2,
			"equals" => string.Equals(fieldValue, rule.Value, StringComparison.OrdinalIgnoreCase),
			"notequals" => !string.Equals(fieldValue, rule.Value, StringComparison.OrdinalIgnoreCase),
			"contains" => fieldValue.Contains(rule.Value, StringComparison.OrdinalIgnoreCase),
			"in" => rule.Value.Split(',').Select(s => s.Trim()).Contains(fieldValue, StringComparer.OrdinalIgnoreCase),
			"notin" => !rule.Value.Split(',').Select(s => s.Trim()).Contains(fieldValue, StringComparer.OrdinalIgnoreCase),
			_ => false
		};
	}

	public async Task<Transaction> CreateAsync(Transaction tx)
	{
		// Compute risk score based on active rules (affects only this new transaction)
		var rules = await _db.Rules.Where(r => r.IsEnabled).ToListAsync();
		ApplyRiskScores(new[] { tx }, rules);
		_db.Transactions.Add(tx);
		await _db.SaveChangesAsync();
		if (tx.IsFlagged)
		{
			// Create alerts for each matched rule so details show the exact rule names
			var matchedRules = rules.Where(r => RuleMatches(r, tx)).ToList();
			if (matchedRules.Count == 0)
			{
				// Fallback: create a generic alert if no specific rule could be identified
				_db.Alerts.Add(new Alert
				{
					Id = Guid.NewGuid(),
					TransactionId = tx.Id,
					Severity = tx.RiskScore >= 90 ? FDMA.Domain.Enums.AlertSeverity.Critical :
								  tx.RiskScore >= 70 ? FDMA.Domain.Enums.AlertSeverity.High :
								  tx.RiskScore >= 40 ? FDMA.Domain.Enums.AlertSeverity.Medium :
								  FDMA.Domain.Enums.AlertSeverity.Low,
					Status = FDMA.Domain.Enums.AlertStatus.Pending,
					RuleName = "RuleEngine:AutoFlag",
					CreatedAt = DateTime.UtcNow
				});
			}
			else
			{
				foreach (var rule in matchedRules)
				{
					_db.Alerts.Add(new Alert
					{
						Id = Guid.NewGuid(),
						TransactionId = tx.Id,
						Severity = rule.Severity, // reflect the rule's configured severity
						Status = FDMA.Domain.Enums.AlertStatus.Pending,
						RuleName = rule.Name,
						CreatedAt = DateTime.UtcNow
					});
				}
			}
			await _db.SaveChangesAsync();
			
			// Send email notification to admin users (send once per transaction)
			var firstAlert = await _db.Alerts.AsNoTracking().FirstOrDefaultAsync(a => a.TransactionId == tx.Id);
			if (firstAlert != null)
			{
				await _emailService.SendTransactionFlaggedEmailAsync(tx, firstAlert);
			}
		}
		return tx;
	}

	public async Task FlagAsync(Guid id, bool isFlagged)
	{
		var t = await _db.Transactions.FindAsync(id);
		if (t is null) return;
		t.IsFlagged = isFlagged;
		t.Status = isFlagged ? "Flagged" : "Normal";
		await _db.SaveChangesAsync();
	}

	public async Task<Transaction?> GetByIdAsync(Guid id)
	{
		// Do not recompute risk for historical data
		var tx = await _db.Transactions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
		return tx;
	}

	public async Task<TransactionDetailsResponse?> GetDetailsByIdAsync(Guid id)
	{
		var tx = await _db.Transactions
			.Include(t => t.Alerts)
			.AsNoTracking()
			.FirstOrDefaultAsync(x => x.Id == id);
		
		if (tx is null) return null;

		// Triggered rules are sourced from stored alerts at processing time
		var triggeredRules = new List<TriggeredRule>();
		var alerts = await _db.Alerts
			.Where(a => a.TransactionId == id)
			.AsNoTracking()
			.ToListAsync();

		// Load rules (all, including disabled) to produce human-readable expressions
		var allRules = await _db.Rules.AsNoTracking().ToListAsync();

		foreach (var a in alerts)
		{
			var ruleName = string.IsNullOrWhiteSpace(a.RuleName) ? "Rule Triggered" : a.RuleName!;
			// Try to find matching rule by name to render full expression
			var rule = allRules.FirstOrDefault(r => string.Equals(r.Name, ruleName, StringComparison.OrdinalIgnoreCase));
			string description;
			if (rule is not null)
			{
				string fieldText = rule.Field switch
				{
					"Amount" => "Amount",
					"Device" => "Device",
					"Location" => "Location",
					"TransactionType" => "Transaction Type",
					_ => rule.Field
				};
				string conditionText = rule.Condition switch
				{
					"GreaterThan" => "greater than",
					"LessThan" => "less than",
					"Equals" => "equals",
					"NotEquals" => "not equals",
					"In" => "in",
					"NotIn" => "not in",
					"Contains" => "contains",
					_ => rule.Condition
				};
				var valueText = rule.Field.Equals("Amount", StringComparison.OrdinalIgnoreCase)
					&& decimal.TryParse(rule.Value, out var threshold)
					? $"₦{threshold:N2}"
					: rule.Value;
				description = $"{fieldText} {conditionText} {valueText}";
			}
			else
			{
				description = $"This rule was triggered when the transaction was processed (severity: {a.Severity}).";
			}
			triggeredRules.Add(new TriggeredRule(ruleName, description));
		}

		var senderInfo = await GetCustomerInfoAsync(tx.SenderAccountNumber);
		var receiverInfo = await GetCustomerInfoAsync(tx.ReceiverAccountNumber);

		return TransactionDetailsResponse.FromEntity(tx, triggeredRules, senderInfo, receiverInfo);
	}

	private async Task<CustomerInfo?> GetCustomerInfoAsync(string accountNumber)
	{
		// Get first transaction date for this account to determine customer since date
		var firstTransaction = await _db.Transactions
			.Where(t => t.SenderAccountNumber == accountNumber || t.ReceiverAccountNumber == accountNumber)
			.OrderBy(t => t.CreatedAt)
			.AsNoTracking()
			.FirstOrDefaultAsync();

		if (firstTransaction is null) return null;

		// Calculate average transaction value
		var avgValue = await _db.Transactions
			.Where(t => t.SenderAccountNumber == accountNumber || t.ReceiverAccountNumber == accountNumber)
			.AsNoTracking()
			.AverageAsync(t => (double)t.Amount);

		// Generate a mock name based on account number (in real app, this would come from customer service)
		var name = $"Customer {accountNumber.Substring(Math.Max(0, accountNumber.Length - 5))}";

		return new CustomerInfo(
			name,
			accountNumber,
			firstTransaction.CreatedAt,
			(decimal)avgValue
		);
	}

	public async Task<IEnumerable<Transaction>> GetByAccountAsync(string accountNumber)
	{
		var transactions = await _db.Transactions.AsNoTracking()
			.Where(t => t.SenderAccountNumber == accountNumber || t.ReceiverAccountNumber == accountNumber)
			.OrderByDescending(t => t.CreatedAt)
			.ToListAsync();
		return transactions; // Do not recompute risk for history
	}

	public async Task<(IEnumerable<Transaction> items, int total)> GetPagedAsync(int page, int pageSize, string? status, string? account, string? type, DateTime? from, DateTime? to, int? minRisk)
	{
		var q = _db.Transactions.AsNoTracking().AsQueryable();
		// Handle status filter using stored flags
		if (!string.IsNullOrWhiteSpace(status))
		{
			if (status.Equals("normal", StringComparison.OrdinalIgnoreCase))
			{
				q = q.Where(t => !t.IsFlagged);
			}
			else if (status.Equals("flagged", StringComparison.OrdinalIgnoreCase))
			{
				q = q.Where(t => t.IsFlagged);
			}
			else
			{
				q = q.Where(t => t.Status == status || (status == "Normal" && !t.IsFlagged) || (status == "Flagged" && t.IsFlagged));
			}
		}
		if (!string.IsNullOrWhiteSpace(account)) q = q.Where(t => t.SenderAccountNumber == account || t.ReceiverAccountNumber == account);
		if (!string.IsNullOrWhiteSpace(type)) q = q.Where(t => t.TransactionType == type);
		if (from.HasValue) q = q.Where(t => t.CreatedAt >= from.Value);
		if (to.HasValue) q = q.Where(t => t.CreatedAt <= to.Value);
		if (minRisk.HasValue) q = q.Where(t => t.RiskScore >= minRisk.Value);

		var total = await q.CountAsync();
		var items = await q.OrderByDescending(t => t.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
		return (items, total);
	}
}