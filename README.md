# FraudGuard - Fraud Detection & Management System

A comprehensive fraud detection and management system built with ASP.NET Core Web API backend and React TypeScript frontend. The system provides near real-time transaction monitoring, automated fraud detection using configurable rules, case management, and comprehensive analytics.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Backend Features](#backend-features)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

FraudGuard is a full-stack fraud detection system designed to help financial institutions monitor transactions in real-time, detect suspicious activities using configurable rules, manage fraud cases, and generate comprehensive reports. The system uses a rule-based engine that evaluates transactions against customizable criteria and assigns risk scores.

### Key Capabilities

- **Real-time Transaction Monitoring**: Track and analyze transactions as they occur
- **Automated Fraud Detection**: Rule-based engine that flags suspicious transactions
- **Case Management**: Create, assign, and track fraud investigation cases
- **Risk Scoring**: Dynamic risk score calculation based on rule severity weights
- **Email Notifications**: Automated alerts sent to administrators when fraud is detected
- **Comprehensive Analytics**: Detailed reports and visualizations of fraud patterns
- **User Management**: Role-based access control with multiple user roles
- **Audit Logging**: Complete audit trail of all system activities

## Features

### Frontend Features

- **Dashboard**: Real-time overview of transactions, alerts, and cases with animated counters
- **Transaction Monitoring**: View, filter, and search all transactions with detailed information
- **Alerts Management**: Review flagged transactions and manage alert statuses
- **Case Management**: Create cases from alerts, assign investigators, add comments, and track resolution
- **Reports & Analytics**: Comprehensive reports with charts and visualizations
- **Rules Engine**: Create, edit, enable/disable fraud detection rules
- **User Management**: Manage users, roles, and permissions
- **Modern UI**: Responsive design with smooth animations and transitions
- **Active Tab Highlighting**: Visual indication of current page in sidebar

### Backend Features

- **RESTful API**: Clean, well-documented API endpoints
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Admin, Analyst, Investigator, and Viewer roles
- **Rule Engine**: Configurable fraud detection rules with severity weights
- **Email Service**: Automated email notifications for flagged transactions
- **Global Error Handling**: Centralized error handling with NLog logging
- **Database Migrations**: Entity Framework Core migrations for schema management
- **Audit Logging**: Track all system changes and user actions

## Tech Stack

### Backend

- **.NET 9.0**: Modern C# framework
- **ASP.NET Core Web API**: RESTful API framework
- **Entity Framework Core**: ORM for database operations
- **PostgreSQL**: Relational database
- **ASP.NET Core Identity**: Authentication and authorization
- **JWT Bearer Authentication**: Token-based security
- **MailKit**: Email service integration
- **NLog**: Logging framework
- **AutoMapper**: Object mapping

### Frontend

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server


## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Pages   │  │Components│  │   API    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┴──────────────────────────────────┐
│              Backend (ASP.NET Core)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Controllers  │  │  Services    │  │  Repositories│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Domain      │  │ Infrastructure│  │  Application │ │
│  │  Entities    │  │  Services    │  │  Services    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│              Database (PostgreSQL)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Transactions│ │  Alerts │  │  Cases   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Domain Layer**: Core business entities and enums
- **Application Layer**: Business logic, DTOs, and service interfaces
- **Infrastructure Layer**: Data access, external services (email, logging)
- **WebApi Layer**: Controllers, middleware, and API configuration

## Prerequisites

Before you begin, ensure you have the following installed:

- **.NET 9.0 SDK** or later
- **Node.js** 18.x or later
- **PostgreSQL** 12.x or later
- **Git** for version control
- **Visual Studio 2022** or **VS Code**
- **Postman** or similar API testing tool (optional)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Fraud-Detection
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd Backend/src/WebApi
```

#### Install Dependencies

The .NET SDK will automatically restore NuGet packages when you build the project. However, you can manually restore:

```bash
dotnet restore
```

#### Configure Database Connection

Edit `appsettings.json` and update the connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=fdt2_db;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

**C# Script:**
```bash
dotnet run --project scripts\CreateDatabase.cs
```

#### Run Migrations

Migrations are applied automatically on application startup. To manually apply:

```bash
dotnet ef database update --project ../Infrastructure/Infrastructure.csproj --startup-project WebApi.csproj --context FDMA.Infrastructure.Persistence.AppDbContext
```

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd Frontend
```

#### Install Dependencies

```bash
npm install
```

## Configuration

### Backend Configuration (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=fdt2_db;Username=postgres;Password=YOUR_PASSWORD"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGenerationThatShouldBeAtLeast32CharactersLong!",
    "Issuer": "FDMA",
    "Audience": "FDMA",
    "ExpirationMinutes": "1440"
  },
  "EmailSettings": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "your-email@gmail.com",
    "FromName": "Fraud Detection System"
  },
  "Seed": {
    "SampleTransactions": false
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Frontend

```bash
cd Frontend
npm run dev
```

The frontend will be available at:
- `http://localhost:8080`

### Transaction Simulator 

To simulate transactions for testing:

```bash
cd TransactionSimulator
dotnet run
```

## API Documentation

### Authentication Endpoints

#### Login
```
POST /api/auths/login
Content-Type: application/json

{
  "email": "admin@fraudguard.com",
  "password": "Admin123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@fraudguard.com",
    "fullName": "Admin User",
    "role": "Admin"
  }
}
```

#### Register
```
POST /api/auths/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "John Doe",
  "role": "Analyst"
}
```

## Project Structure

```
Fraud-Detection/
├── Backend/
│   ├── src/
│   │   ├── Application/          # Business logic layer
│   │   │   ├── DTOs/            # Data Transfer Objects
│   │   │   ├── Interfaces/      # Service interfaces
│   │   │   └── Services/        # Business logic services
│   │   ├── Domain/              # Domain layer
│   │   │   ├── Entities/        # Domain entities
│   │   │   └── Enums/           # Domain enums
│   │   ├── Infrastructure/      # Infrastructure layer
│   │   │   ├── Migrations/      # Database migrations
│   │   │   ├── Persistence/     # Database context
│   │   │   ├── Repositories/    # Data access
│   │   │   └── Services/        # Infrastructure services
│   │   └── WebApi/              # API layer
│   │       ├── Controllers/     # API controllers
│   │       ├── Middleware/      # Custom middleware
│   │       └── Program.cs       # Application entry point
│   └── scripts/                 # Utility scripts
├── Frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── AppLayout.tsx   # Main layout
│   │   │   └── AppSidebar.tsx  # Sidebar navigation
│   │   ├── pages/              # Page components
│   │   ├── lib/                # Utilities and API client
│   │   └── hooks/              # Custom React hooks
│   └── public/                 # Static assets
└── TransactionSimulator/        # Transaction simulation tool
```

## Testing

### Backend Tests

Run unit tests:

```bash
cd Backend/tests/UnitTests
dotnet test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow C# coding conventions for backend
- Use TypeScript best practices for frontend
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team or open an issue in the repository.

---


