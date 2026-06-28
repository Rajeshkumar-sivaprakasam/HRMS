# HRForz API - Node.js/TypeScript

A comprehensive Human Resource Management System (HRMS) API built with Node.js, TypeScript, Express, and TypeORM.

## Features

- **Authentication**: JWT-based authentication with RS256 algorithm, refresh tokens, account activation
- **Employee Management**: Full CRUD operations, document management, statutory details
- **Attendance**: Clock in/out, regularisation requests, shift management
- **Leave Management**: Multiple leave types, balance tracking, approval workflow
- **Permissions**: Short-duration permission requests with approval workflow
- **Payroll**: Salary structures, payroll runs, payslips, revisions, F&F settlements
- **Helpdesk**: Ticket management with categories and comments
- **Notifications**: In-app notifications for various HR events
- **Announcements**: Company-wide or department-specific announcements
- **Onboarding**: Multi-step employee onboarding workflow

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis with ioredis
- **Authentication**: JWT (RS256) with jose
- **Validation**: Zod
- **Storage**: AWS S3 / Cloudflare R2
- **Logging**: Pino

## Project Structure

```
src/
├── config.ts              # Environment configuration with Zod validation
├── constants.ts           # Business constants (PF/ESI rates, quotas, etc.)
├── main.ts                # Application entry point
├── core/                  # Infrastructure layer
│   ├── cache/             # Redis client & cache key management
│   ├── db/                # TypeORM data source & entities
│   ├── exceptions/        # Custom exception classes & error handler
│   ├── logging/           # Pino logger setup
│   ├── middleware/        # Auth, rate limiting, request ID
│   ├── security/          # JWT & password hashing
│   └── storage/           # S3 client for file uploads
├── models/                # TypeORM entity definitions
├── modules/               # Feature modules (auth, employees, etc.)
│   └── [module]/
│       ├── [module].router.ts
│       ├── [module].service.ts
│       ├── [module].repository.ts
│       └── [module].schemas.ts
└── shared/
    ├── enums/             # Shared enumerations
    └── schemas/           # Response wrappers, pagination types
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file and configure:
   ```bash
   cp .env.example .env
   ```

4. Generate RSA keys for JWT:
   ```bash
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem
   ```

5. Update `.env` with your database, Redis, and JWT keys

6. Run database migrations:
   ```bash
   npm run migration:run
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication (`/v1/auth`)
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout
- `POST /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /activate` - Activate new account

### Employees (`/v1/employees`)
- `POST /` - Create employee (HR only)
- `POST /list` - List employees with filtering/pagination
- `GET /me` - Get current user profile
- `GET /:id` - Get employee by ID
- `PUT /:id` - Update employee
- `PUT /:id/bank-details` - Update bank details
- `PUT /:id/statutory` - Update statutory details (HR only)
- `PATCH /:id/status` - Update status (HR only)
- `DELETE /:id` - Soft delete employee (HR only)

### Health Check
- `GET /health` - API health status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/staging/production) | development |
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection string | - |
| REDIS_URL | Redis connection string | - |
| JWT_PRIVATE_KEY | RSA private key for JWT signing | - |
| JWT_PUBLIC_KEY | RSA public key for JWT verification | - |
| CORS_ORIGINS | Allowed CORS origins (comma-separated) | - |
| AWS_ACCESS_KEY_ID | AWS access key for S3 | - |
| AWS_SECRET_ACCESS_KEY | AWS secret key for S3 | - |
| AWS_S3_BUCKET | S3 bucket name | - |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## License

ISC
