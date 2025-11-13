# FraudGuard - Fraud Detection & Management System

A comprehensive fraud detection and management system built with ASP.NET Core Web API backend and React TypeScript frontend. The system provides real-time transaction monitoring, automated fraud detection using configurable rules, case management, and comprehensive analytics.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Backend Features](#backend-features)
- [Authentication & Authorization](#authentication--authorization)
- [Rule Engine](#rule-engine)
- [Email Notifications](#email-notifications)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
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
- **React Router**: Client-side routing
- **TanStack Query (React Query)**: Data fetching and caching
- **Axios**: HTTP client
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Framer Motion**: Animation library
- **React CountUp**: Animated number counters
- **Recharts**: Chart library
- **Lucide React**: Icon library
- **date-fns**: Date utility library

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
- **Visual Studio 2022** or **VS Code** (recommended)
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

#### Create Database

The application will automatically create the database on first run. Alternatively, you can use the provided scripts:

**PowerShell Script:**
```powershell
.\scripts\CreateDatabase.ps1
```

**SQL Script:**
```bash
psql -U postgres -f scripts\CreateDatabase.sql
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

#### Configure API URL

Create a `.env` file in the Frontend directory (optional, defaults to `http://localhost:5000/api`):

```env
VITE_API_URL=http://localhost:5000/api
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

### Email Configuration

For Gmail, you'll need to:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `SmtpPassword`

### JWT Configuration

- **SecretKey**: Must be at least 32 characters long
- **ExpirationMinutes**: Token expiration time (1440 = 24 hours)

## Database Setup

### Database Schema

The system uses the following main entities:

- **Users**: System users with roles (Admin, Analyst, Investigator, Viewer)
- **Transactions**: Financial transactions being monitored
- **Alerts**: Flagged transactions with risk scores
- **Cases**: Investigation cases created from alerts
- **Rules**: Fraud detection rules
- **Comments**: Comments on cases
- **Notifications**: System notifications
- **AuditLogs**: Audit trail of system changes

### Initial Data Seeding

The application automatically seeds:
- Default admin user (if not exists)
- Default fraud detection rules (if not exists)
- Sample transactions (if `Seed:SampleTransactions` is `true`)

**Default Admin Credentials:**
- Email: `admin@fraudguard.com`
- Password: `Admin123!`

**⚠️ Important**: Change the default admin password in production!

## Running the Application

### Backend

```bash
cd Backend/src/WebApi
dotnet run
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `https://localhost:5001/swagger`

### Frontend

```bash
cd Frontend
npm run dev
```

The frontend will be available at:
- `http://localhost:8080`

### Transaction Simulator (Optional)

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

### Transaction Endpoints

#### Get Transactions (Paginated)
```
GET /api/transactions?page=1&pageSize=20&status=Flagged&minRisk=50
Authorization: Bearer {token}
```

#### Get Transaction Details
```
GET /api/transactions/{id}
Authorization: Bearer {token}
```

#### Create Transaction
```
POST /api/transactions
Content-Type: application/json
Authorization: Bearer {token}

{
  "senderAccountNumber": "1234567890",
  "receiverAccountNumber": "0987654321",
  "amount": 50000,
  "transactionType": "Transfer",
  "location": "Lagos, Nigeria",
  "device": "Mobile",
  "ipAddress": "192.168.1.1"
}
```

### Alert Endpoints

#### Get Alerts
```
GET /api/alerts?page=1&pageSize=20&severity=2&status=0
Authorization: Bearer {token}
```

#### Resolve Alert
```
POST /api/alerts/{id}/resolve
Authorization: Bearer {token}
```

### Case Endpoints

#### Get Cases
```
GET /api/cases?page=1&pageSize=20
Authorization: Bearer {token}
```

#### Create Case
```
POST /api/cases
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Suspicious Transaction Case",
  "description": "Large transfer to unknown account",
  "transactionId": "...",
  "investigatorId": "..."
}
```

### Rules Endpoints

#### Get Rules
```
GET /api/rules
Authorization: Bearer {token}
```

#### Create Rule
```
POST /api/rules
Content-Type: application/json
Authorization: Bearer {token} (Admin only)

{
  "name": "High Amount Transaction",
  "field": "Amount",
  "condition": "GreaterThan",
  "value": "200000",
  "isEnabled": true,
  "severity": 2,
  "severityWeight": 40
}
```

## Frontend Features

### Dashboard

The dashboard provides a comprehensive overview:
- **Total Transactions**: Animated counter showing total transaction volume
- **Flagged Alerts**: Count of transactions flagged as suspicious
- **Resolved Cases**: Number of cases successfully resolved
- **Pending Cases**: Cases currently under investigation
- **Recent Transactions Table**: Latest transactions with severity indicators
- **Time Range Filter**: View data for last 24 hours, 7 days, or 30 days

### Transaction Monitoring

- View all transactions with pagination
- Filter by status (All, Flagged, Resolved)
- Search by transaction ID or account number
- View detailed transaction information
- See triggered rules and risk scores
- View customer information

### Alerts Management

- View all flagged transactions
- Filter by severity (Low, Medium, High, Critical)
- Filter by status (Pending, Under Review, Escalated, Resolved)
- Create cases from alerts
- Export alerts to CSV

### Case Management

- Create cases from flagged transactions
- Assign cases to investigators
- Add comments (internal and external)
- Track case status (New, Investigating, Resolved)
- View case history and audit logs
- Filter and search cases

### Reports & Analytics

- **Total Alerts**: Count of alerts in selected time period
- **Resolution Rate**: Percentage of cases resolved
- **Average Resolution Time**: Average days to resolve cases
- **High-Risk Accounts**: Accounts with multiple flagged transactions
- **Monthly Trends Chart**: Visual representation of alerts over time
- **Severity Distribution**: Pie chart showing alert distribution by severity

### Rules Engine

- Create custom fraud detection rules
- Configure rule conditions (GreaterThan, Equals, In, NotIn)
- Set severity levels (Low, Medium, High, Critical)
- Set severity weights (0-100%) for risk score calculation
- Enable/disable rules (only affects future transactions)
- View rule details and usage

### User Management

- View all system users
- Create new users with roles
- Edit user information
- Manage user roles (Admin, Analyst, Investigator, Viewer)
- View user activity

## Backend Features

### Rule Engine

The rule engine evaluates transactions against configured rules:

1. **Rule Evaluation**: Each enabled rule is checked against the transaction
2. **Risk Score Calculation**: Risk score is calculated by summing severity weights of matched rules
3. **Normalization**: If total exceeds 100, scores are normalized proportionally
4. **Alert Creation**: Alerts are created for transactions with risk score > 0
5. **Email Notification**: Administrators receive email notifications for flagged transactions

**Rule Conditions:**
- `GreaterThan`: Numeric comparison (e.g., Amount > 200000)
- `Equals`: Exact match (e.g., Device = "NewDevice")
- `In`: Value in comma-separated list (e.g., Location in "Lagos,Abuja")
- `NotIn`: Value not in comma-separated list

**Severity Levels:**
- `Low` (0): Risk score 0-39
- `Medium` (1): Risk score 40-69
- `High` (2): Risk score 70-89
- `Critical` (3): Risk score 90-100

### Email Notifications

When a transaction is flagged:
1. Alert is created with severity based on risk score
2. Email is sent to all admin users
3. Email includes:
   - Transaction details
   - Risk score
   - Severity level
   - Triggered rules
   - Direct link to transaction details

### Global Error Handling

The application uses `ErrorHandlingMiddleware` to:
- Catch all unhandled exceptions
- Log errors with NLog
- Return consistent JSON error responses
- Include correlation IDs for tracking

### Audit Logging

All system changes are logged:
- User actions (create, update, delete)
- Rule changes
- Case status changes
- User management actions

## Authentication & Authorization

### Authentication Flow

1. User submits credentials via `/api/auths/login`
2. Backend validates credentials
3. JWT token is generated and returned
4. Frontend stores token in localStorage
5. Token is included in all subsequent API requests
6. Backend validates token on each request

### Authorization Roles

- **Admin**: Full system access, can manage users and rules
- **Analyst**: Can view transactions, alerts, and cases; can create cases
- **Investigator**: Can view and manage assigned cases
- **Viewer**: Read-only access to transactions and alerts

### Protected Routes

All API endpoints except `/api/auths/login` and `/api/auths/register` require authentication. Admin-only endpoints are protected with `[Authorize(Roles = "Admin")]`.

## Rule Engine

### How Rules Work

1. **Transaction Creation**: When a transaction is created, all enabled rules are evaluated
2. **Rule Matching**: Each rule checks if the transaction matches its criteria
3. **Weight Calculation**: Matched rules contribute their severity weight to the risk score
4. **Score Normalization**: If total weight exceeds 100, scores are normalized
5. **Alert Generation**: Transactions with risk score > 0 are flagged
6. **Historical Immutability**: Rule changes only affect future transactions

### Example Rule

```json
{
  "name": "High Amount Transaction",
  "field": "Amount",
  "condition": "GreaterThan",
  "value": "200000",
  "isEnabled": true,
  "severity": 2,
  "severityWeight": 40
}
```

This rule flags transactions over ₦200,000 and adds 40 points to the risk score.

### Risk Score Calculation

```
Risk Score = Sum of all matched rule weights
If Risk Score > 100 and Max Possible Score > 100:
    Risk Score = (Risk Score / Max Possible Score) * 100
```

## Email Notifications

### Configuration

Email notifications are configured in `appsettings.json`:

```json
"EmailSettings": {
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": "587",
  "SmtpUsername": "your-email@gmail.com",
  "SmtpPassword": "your-app-password",
  "FromEmail": "your-email@gmail.com",
  "FromName": "Fraud Detection System"
}
```

### Email Content

Emails include:
- Transaction ID and details
- Risk score and severity
- Triggered rules
- Transaction amount and accounts
- Timestamp

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

### Frontend Tests

```bash
cd Frontend
npm test
```

### Manual Testing

1. Use the Transaction Simulator to create test transactions
2. Verify rules are triggered correctly
3. Check email notifications are sent
4. Test case creation and management
5. Verify user permissions

## Deployment

### Backend Deployment

1. Build the application:
```bash
dotnet publish -c Release -o ./publish
```

2. Configure production settings in `appsettings.Production.json`

3. Set environment variables:
- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `EmailSettings__SmtpPassword`

4. Deploy to your hosting platform (Azure, AWS, etc.)

### Frontend Deployment

1. Build for production:
```bash
npm run build
```

2. The `dist` folder contains the production build

3. Deploy to a static hosting service (Vercel, Netlify, etc.)

4. Configure environment variables for API URL

### Database Migration in Production

```bash
dotnet ef database update --project ../Infrastructure/Infrastructure.csproj --startup-project WebApi.csproj --context FDMA.Infrastructure.Persistence.AppDbContext
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

**Note**: This is a comprehensive fraud detection system. Ensure proper security measures are in place before deploying to production, including:
- Strong JWT secret keys
- Secure database credentials
- HTTPS/TLS encryption
- Regular security audits
- Backup and disaster recovery plans

