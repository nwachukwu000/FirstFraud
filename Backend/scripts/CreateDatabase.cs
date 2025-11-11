// .NET script to create a new PostgreSQL database for FDT2
// This script uses Npgsql to create the database programmatically
// Usage: dotnet script CreateDatabase.cs

using Npgsql;

var dbName = "fdt2_db";
var connectionString = "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=GODSLOVe_39";

Console.WriteLine($"Creating database '{dbName}'...");

try
{
    // Connect to the default 'postgres' database to create the new database
    await using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    // Check if database exists
    var checkDbCommand = new NpgsqlCommand(
        $"SELECT 1 FROM pg_database WHERE datname = '{dbName}'",
        connection
    );
    var exists = await checkDbCommand.ExecuteScalarAsync();

    if (exists != null)
    {
        Console.WriteLine($"Database '{dbName}' already exists.");
        Console.Write("Do you want to drop and recreate it? (y/N): ");
        var response = Console.ReadLine();
        
        if (response?.ToLower() == "y")
        {
            Console.WriteLine("Dropping existing database...");
            
            // Terminate all connections to the database first
            var terminateConnections = new NpgsqlCommand(
                $@"SELECT pg_terminate_backend(pg_stat_activity.pid)
                   FROM pg_stat_activity
                   WHERE pg_stat_activity.datname = '{dbName}'
                   AND pid <> pg_backend_pid();",
                connection
            );
            await terminateConnections.ExecuteNonQueryAsync();
            
            var dropCommand = new NpgsqlCommand($"DROP DATABASE IF EXISTS {dbName};", connection);
            await dropCommand.ExecuteNonQueryAsync();
            Console.WriteLine("Database dropped.");
        }
        else
        {
            Console.WriteLine("Database creation skipped.");
            return;
        }
    }

    // Create the database
    var createCommand = new NpgsqlCommand($"CREATE DATABASE {dbName};", connection);
    await createCommand.ExecuteNonQueryAsync();
    
    Console.WriteLine($"Database '{dbName}' created successfully!");
    
    // Connect to the new database and create UUID extension if needed
    var newDbConnectionString = connectionString.Replace("Database=postgres", $"Database={dbName}");
    await using var newDbConnection = new NpgsqlConnection(newDbConnectionString);
    await newDbConnection.OpenAsync();
    
    var extensionCommand = new NpgsqlCommand("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";", newDbConnection);
    await extensionCommand.ExecuteNonQueryAsync();
    
    Console.WriteLine("UUID extension enabled.");
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
    Console.WriteLine("Please check your PostgreSQL connection settings in the script.");
    Environment.Exit(1);
}

Console.WriteLine("");
Console.WriteLine("Next steps:");
Console.WriteLine("1. Run migrations: cd src/WebApi && dotnet ef database update --project ../Infrastructure/Infrastructure.csproj --startup-project WebApi.csproj");
Console.WriteLine("2. Or simply run the application - migrations will run automatically on startup");

