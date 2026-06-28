# HRForz API

FastAPI-based HRMS (Human Resource Management System) backend for HRForz Technologies.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 + Python 3.12 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + ARQ |
| Auth | RSA-signed JWT (RS256) |
| Migrations | Alembic |
| Containerisation | Docker + Docker Compose |

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop installed and running
- Ports `8000`, `5433`, `6379` free on your machine

### 1. Clone and configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box with Docker)
```

### 2. Generate RSA keys (first time only)

```bash
python scripts/generate_rsa_keys.py
```

This creates `private.pem` and `public.pem` in the project root.

### 3. Start all services

```bash
docker-compose up -d
```

Or using Make:

```bash
make docker-up
```

Services started:
- **API** → http://localhost:8000
- **PostgreSQL** → localhost:5433
- **Redis** → localhost:6379

### 4. Run migrations

```bash
docker-compose exec api alembic upgrade head
```

### 5. Create superadmin + seed data

```bash
# Create superadmin account
docker-compose exec api python scripts/create_superadmin.py

# Seed demo data for all tables
docker-compose exec api python scripts/seed_dev.py
```

### 6. Stop services

```bash
docker-compose down

# Stop and remove volumes (wipes database)
docker-compose down -v
```

---

## Local Development (without Docker)

### 1. Create virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -e ".[dev]"
# or
make install
```

### 3. Start PostgreSQL and Redis

Make sure PostgreSQL is running on port `5433` and Redis on port `6379`.  
The easiest way is to start only the infra containers:

```bash
docker-compose up -d postgres redis
```

### 4. Configure environment

```bash
cp .env.example .env
```

Key variables in `.env`:

```env
DATABASE_URL=postgresql://hrms_user:hrms_pass@localhost:5433/hrms_db
REDIS_URL=redis://localhost:6379/0
```

### 5. Generate RSA keys

```bash
python scripts/generate_rsa_keys.py
# or
make keys
```

### 6. Run migrations

```bash
alembic upgrade head
# or
make migrate
```

### 7. Create superadmin

```bash
python scripts/create_superadmin.py
# or
make superadmin
```

### 8. Seed demo data

```bash
python scripts/seed_dev.py          # seed if empty
python scripts/seed_dev.py --force  # truncate and reseed
# or
make seed
```

### 9. Start API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# or
make dev
```

API available at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs  
Health check: http://localhost:8000/health

### 10. Start background worker (optional)

```bash
python -m arq app.core.tasks.worker.WorkerSettings
# or
make worker
```

---

## Database

| Parameter | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `hrms_db` |
| Username | `hrms_user` |
| Password | `hrms_pass` |
| Connection string | `postgresql://hrms_user:hrms_pass@localhost:5433/hrms_db` |

### Connect with psql

```bash
psql -h localhost -p 5433 -U hrms_user -d hrms_db
```

### Connect with a GUI tool (pgAdmin / DBeaver)

Use the parameters from the table above. Port is **5433** (not the default 5432).

---

## Login Credentials

### API endpoint

```
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@hrforz.com",
  "password": "Admin@1234"
}
```

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| super_admin | admin@hrforz.com | Admin@1234 |
| manager | priya.sharma@hrforz.com | Employee@1234 |
| hr_admin | kavita.rao@hrforz.com | Employee@1234 |
| finance_admin | anil.gupta@hrforz.com | Employee@1234 |
| manager | deepa.nair@hrforz.com | Employee@1234 |
| employee | arjun.mehta@hrforz.com | Employee@1234 |
| employee | sneha.patel@hrforz.com | Employee@1234 |
| employee | rajesh.kumar@hrforz.com | Employee@1234 |
| employee | vikram.singh@hrforz.com | Employee@1234 |

---

## Make Commands

| Command | Description |
|---|---|
| `make dev` | Start API with hot-reload |
| `make run` | Start API (production mode) |
| `make worker` | Start ARQ background worker |
| `make migrate` | Apply all pending migrations |
| `make migration MSG="description"` | Generate new migration |
| `make downgrade` | Rollback one migration |
| `make seed` | Seed demo data |
| `make superadmin` | Create superadmin user |
| `make keys` | Generate RSA key pair |
| `make test` | Run full test suite with coverage |
| `make test-fast` | Run tests, stop on first failure |
| `make lint` | Run ruff linter |
| `make format` | Auto-format with ruff |
| `make typecheck` | Run mypy type checks |
| `make docker-up` | Start all Docker services |
| `make docker-down` | Stop all Docker services |

---

## Project Structure

```
hrforz-api/
├── app/
│   ├── core/
│   │   ├── cache/          # Redis client
│   │   ├── db/             # SQLAlchemy engine, session, mixins
│   │   ├── exceptions/     # Custom exceptions and handlers
│   │   ├── logging/        # Structlog setup
│   │   ├── middleware/      # Request ID, timing, rate limit
│   │   ├── security/       # JWT, password hashing
│   │   ├── storage/        # S3 file storage
│   │   └── tasks/          # ARQ workers
│   ├── models/             # SQLAlchemy ORM models
│   ├── modules/            # Feature modules (router + service + repository + schemas)
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── leaves/
│   │   ├── payroll/
│   │   ├── helpdesk/
│   │   └── ...
│   ├── shared/
│   │   ├── dependencies/   # FastAPI dependencies (auth, db)
│   │   ├── enums/          # Shared enumerations
│   │   ├── schemas/        # Shared Pydantic schemas
│   │   └── utils/          # Filter builder, helpers
│   ├── config.py           # Settings (pydantic-settings)
│   └── main.py             # FastAPI app entry point
├── alembic/                # Database migrations
├── scripts/
│   ├── create_superadmin.py
│   ├── generate_rsa_keys.py
│   └── seed_dev.py
├── tests/
│   ├── integration/
│   └── unit/
├── docker-compose.yml
├── Dockerfile
├── Makefile
└── pyproject.toml
```

---

## API Documentation

Once the server is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/health

---

## Notes

- RSA private key (`private.pem`) is excluded from git via `.gitignore`. Never commit it.
- The `.env` file is also excluded from git. Use `.env.example` as a template.
- Re-seed at any time with `python scripts/seed_dev.py --force` (truncates all tables and reseeds).
