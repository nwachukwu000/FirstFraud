using FDMA.Application.Interfaces;
using FDMA.Domain.Entities;
using FDMA.Infrastructure.Persistence;
using FDMA.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;
using NLog.Web;
using FDMA.WebApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

// NLog: configure logging
builder.Logging.ClearProviders();
builder.Host.UseNLog();

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// PostgreSQL
var conn = builder.Configuration.GetConnectionString("DefaultConnection") 
           ?? Environment.GetEnvironmentVariable("FDMA__CONNSTR");
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(conn));

// Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    
    // User settings
    options.User.RequireUniqueEmail = true;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? "YourSuperSecretKeyForJWTTokenGenerationThatShouldBeAtLeast32CharactersLong!";
var issuer = jwtSettings["Issuer"] ?? "FDMA";
var audience = jwtSettings["Audience"] ?? "FDMA";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false; // Set to true in production
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    // Role-based authorization policies
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("AdminOrAnalyst", policy => policy.RequireRole("Admin", "Analyst"));
});

// DI
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8080", 
                "https://localhost:8080",
                "http://localhost:5173", 
                "https://localhost:5173",
                "http://localhost:3000",
                "https://localhost:3000"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// Global error handling
app.UseMiddleware<ErrorHandlingMiddleware>();

// Ensure database exists and auto-migrate
using (var scope = app.Services.CreateScope())
{
    // First, ensure the database exists
    if (!string.IsNullOrEmpty(conn))
    {
        var connBuilder = new NpgsqlConnectionStringBuilder(conn);
        var dbName = connBuilder.Database;
        
        // Connect to postgres database to check/create the target database
        connBuilder.Database = "postgres";
        var masterConnString = connBuilder.ConnectionString;
        
        try
        {
            await using var masterConn = new NpgsqlConnection(masterConnString);
            await masterConn.OpenAsync();
            
            // Check if database exists
            var checkDbCommand = new NpgsqlCommand(
                $"SELECT 1 FROM pg_database WHERE datname = '{dbName}'",
                masterConn
            );
            var exists = await checkDbCommand.ExecuteScalarAsync();
            
            if (exists == null)
            {
                Console.WriteLine($"Database '{dbName}' does not exist. Creating it...");
                var createDbCommand = new NpgsqlCommand($"CREATE DATABASE {dbName};", masterConn);
                await createDbCommand.ExecuteNonQueryAsync();
                Console.WriteLine($"Database '{dbName}' created successfully.");
                
                // Enable UUID extension in the new database
                connBuilder.Database = dbName;
                await using var newDbConn = new NpgsqlConnection(connBuilder.ConnectionString);
                await newDbConn.OpenAsync();
                var extensionCommand = new NpgsqlCommand("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";", newDbConn);
                await extensionCommand.ExecuteNonQueryAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not automatically create database. Error: {ex.Message}");
            Console.WriteLine("Please ensure the database exists or create it manually using the scripts in the scripts folder.");
        }
    }
    
    // Now run migrations
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    db.Database.Migrate();
    await FDMA.Infrastructure.Persistence.DbSeeder.SeedAsync(db, userManager, roleManager, builder.Configuration);
}

app.UseSwagger();
app.UseSwaggerUI();

// CORS must be before HTTPS redirection to handle preflight requests
app.UseCors("AllowFrontend");

// Only redirect to HTTPS in production, allow HTTP in development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();