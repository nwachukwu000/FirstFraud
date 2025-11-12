using FDMA.Application.Interfaces;
using FDMA.Domain.Entities;
using FDMA.Domain.Enums;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FDMA.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IConfiguration configuration,
        UserManager<User> userManager,
        ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task SendTransactionFlaggedEmailAsync(Transaction transaction, Alert alert)
    {
        try
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["EmailSettings:SmtpUsername"] ?? "";
            // Remove spaces from app password if present (Gmail app passwords may have spaces for readability)
            var smtpPassword = (_configuration["EmailSettings:SmtpPassword"] ?? "").Replace(" ", "");
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? smtpUsername;
            var fromName = _configuration["EmailSettings:FromName"] ?? "Fraud Detection System";

            if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
            {
                _logger.LogWarning("Email settings not configured. Skipping email notification.");
                return;
            }

            // Get all admin users
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            if (!adminUsers.Any())
            {
                _logger.LogWarning("No admin users found. Skipping email notification.");
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            
            // Add all admin users as recipients
            foreach (var admin in adminUsers)
            {
                if (!string.IsNullOrEmpty(admin.Email))
                {
                    message.To.Add(new MailboxAddress(admin.FullName ?? admin.UserName ?? "Admin", admin.Email));
                }
            }

            message.Subject = $"Fraud Alert: Transaction Flagged - Risk Score: {transaction.RiskScore}";

            var severityText = alert.Severity switch
            {
                AlertSeverity.Critical => "CRITICAL",
                AlertSeverity.High => "HIGH",
                AlertSeverity.Medium => "MEDIUM",
                AlertSeverity.Low => "LOW",
                _ => "UNKNOWN"
            };

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #0a164d; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f8fbf4; padding: 20px; }}
        .alert-box {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .critical-severity {{ background-color: #721c24; border-left-color: #721c24; color: white; }}
        .high-severity {{ background-color: #f8d7da; border-left-color: #dc3545; }}
        .medium-severity {{ background-color: #fff3cd; border-left-color: #ffc107; }}
        .low-severity {{ background-color: #d1ecf1; border-left-color: #17a2b8; }}
        .detail-row {{ margin: 10px 0; padding: 8px; background-color: white; border-radius: 4px; }}
        .label {{ font-weight: bold; color: #0a164d; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Fraud Detection Alert</h1>
        </div>
        <div class=""content"">
            <div class=""alert-box {(alert.Severity == AlertSeverity.Critical ? "critical-severity" : alert.Severity == AlertSeverity.High ? "high-severity" : alert.Severity == AlertSeverity.Medium ? "medium-severity" : "low-severity")}"">
                <h2 style=""margin-top: 0;"">Transaction Flagged - {severityText} Severity</h2>
                <p>A transaction has been flagged by the fraud detection system and requires your attention.</p>
            </div>

            <h3>Transaction Details</h3>
            <div class=""detail-row"">
                <span class=""label"">Transaction ID:</span> {transaction.Id}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Risk Score:</span> {transaction.RiskScore}/100
            </div>
            <div class=""detail-row"">
                <span class=""label"">Severity:</span> {severityText}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Amount:</span> ₦{transaction.Amount:N2}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Transaction Type:</span> {transaction.TransactionType}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Sender Account:</span> {transaction.SenderAccountNumber}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Receiver Account:</span> {transaction.ReceiverAccountNumber}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Location:</span> {transaction.Location ?? "N/A"}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Device:</span> {transaction.Device ?? "N/A"}
            </div>
            <div class=""detail-row"">
                <span class=""label"">IP Address:</span> {transaction.IpAddress ?? "N/A"}
            </div>
            <div class=""detail-row"">
                <span class=""label"">Date & Time:</span> {transaction.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC
            </div>
            <div class=""detail-row"">
                <span class=""label"">Triggered Rule:</span> {alert.RuleName}
            </div>

            <p style=""margin-top: 30px;"">
                <strong>Action Required:</strong> Please review this transaction in the Fraud Detection Management Application.
            </p>
        </div>
        <div class=""footer"">
            <p>This is an automated message from the Fraud Detection System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUsername, smtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Transaction flagged email sent successfully to admin users for transaction {TransactionId}", transaction.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send transaction flagged email for transaction {TransactionId}", transaction.Id);
            // Don't throw - we don't want email failures to break the transaction processing
        }
    }

    public async Task SendCaseAssignmentEmailAsync(Case caseEntity, User analyst, Transaction transaction, User? assignedBy)
    {
        try
        {
            if (string.IsNullOrEmpty(analyst.Email))
            {
                _logger.LogWarning("Analyst {AnalystId} does not have an email address configured. Skipping case assignment notification.", analyst.Id);
                return;
            }

            var smtpHost = _configuration["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var smtpUsername = _configuration["EmailSettings:SmtpUsername"] ?? "";
            var smtpPassword = (_configuration["EmailSettings:SmtpPassword"] ?? "").Replace(" ", "");
            var fromEmail = _configuration["EmailSettings:FromEmail"] ?? smtpUsername;
            var fromName = _configuration["EmailSettings:FromName"] ?? "Fraud Detection System";

            if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
            {
                _logger.LogWarning("Email settings not configured. Skipping case assignment notification.");
                return;
            }

            // Verify the assigned user is an analyst
            if (!await _userManager.IsInRoleAsync(analyst, "Analyst"))
            {
                _logger.LogWarning("Assigned user {AnalystId} is not in the Analyst role. Skipping case assignment notification.", analyst.Id);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(analyst.FullName ?? analyst.UserName ?? "Analyst", analyst.Email));
            message.Subject = $"New Case Assigned: {caseEntity.Title}";

            var assignedByDisplayName = assignedBy?.FullName ?? assignedBy?.UserName ?? "System Administrator";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <style>
        body {{ font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8fbf4; margin: 0; padding: 0; }}
        .container {{ max-width: 640px; margin: 0 auto; padding: 24px; }}
        .card {{ background-color: #ffffff; border-radius: 12px; box-shadow: 0 16px 48px rgba(10, 22, 77, 0.08); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #0a164d 0%, #212f74 100%); color: #ffffff; padding: 24px; }}
        .title {{ margin: 0; font-size: 20px; font-weight: 600; }}
        .content {{ padding: 24px; background-color: #f8fbf4; }}
        .detail-row {{ background-color: #ffffff; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; border: 1px solid rgba(10, 22, 77, 0.08); }}
        .label {{ font-weight: 600; color: #0a164d; display: block; margin-bottom: 4px; }}
        .footer {{ text-align: center; padding: 16px; font-size: 12px; color: #6b7280; }}
        .cta {{ display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #0a164d; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""card"">
            <div class=""header"">
                <p class=""title"">New Case Assigned</p>
                <p style=""margin: 8px 0 0;"">{assignedByDisplayName} assigned a new case to you.</p>
            </div>
            <div class=""content"">
                <div class=""detail-row"">
                    <span class=""label"">Case Title</span>
                    <span>{caseEntity.Title}</span>
                </div>
                {(string.IsNullOrWhiteSpace(caseEntity.Description) ? "" : $@"<div class=""detail-row""><span class=""label"">Description</span><span>{caseEntity.Description}</span></div>")}
                <div class=""detail-row"">
                    <span class=""label"">Transaction ID</span>
                    <span>{transaction.Id}</span>
                </div>
                <div class=""detail-row"">
                    <span class=""label"">Transaction Amount</span>
                    <span>₦{transaction.Amount:N2}</span>
                </div>
                <div class=""detail-row"">
                    <span class=""label"">Risk Score</span>
                    <span>{transaction.RiskScore}/100</span>
                </div>
                <div class=""detail-row"">
                    <span class=""label"">Assigned On</span>
                    <span>{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</span>
                </div>
                <a class=""cta"" href=""{_configuration["AppSettings:CaseDetailUrl"] ?? "#"}"">Review Case</a>
            </div>
            <div class=""footer"">
                <p>You are receiving this email because you are listed as an analyst in the Fraud Detection Management Application.</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUsername, smtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Case assignment email sent to analyst {AnalystId} for case {CaseId}", analyst.Id, caseEntity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send case assignment email for case {CaseId}", caseEntity.Id);
        }
    }
}

