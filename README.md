# Single E-commerce Platform

A full-stack e-commerce application built with FastAPI (Backend), TanStack Start (Frontend), PostgreSQL, Redis, and Celery.

## Tech Stack

- **Backend**: FastAPI (Python 3.12+) + SQLModel + Alembic
- **Frontend**: TanStack Start (React 19) - **Requires Node 22+**
- **Database**: PostgreSQL 15
- **Cache & Message Broker**: Redis 7
- **Task Queue**: Celery 5
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Docker & Docker Compose
- Git
- `uv` (for local Python management)
- Node.js 22+ (for local frontend)

## Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd single-ecom
   ```

2. **Start all services**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Customer Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3001
   - Redis: localhost:6379

4. **Run Migrations & Seeds**
   ```bash
   # Run migrations
   docker-compose exec backend ./manage.py upgrade

   # Seed database
   docker-compose exec backend ./manage.py db:seed
   ```

### Production Environment

1. **Update environment variables**
   - Edit `.env.prod` with production values
   - **IMPORTANT**: Change `SECRET_KEY` to a secure random string

2. **Build and start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Project Structure

```
single-ecom/
├── backend/              # FastAPI application
│   ├── app/             # Application code
│   │   ├── api/         # API routers
│   │   ├── core/        # Core configuration
│   │   └── modules/     # Domain modules (auth, users, etc.)
│   ├── alembic/         # Database migrations
│   ├── tests/           # Tests
│   ├── pyproject.toml   # Python dependencies
│   └── manage.py        # Management CLI
├── frontend/            # Customer frontend (TanStack Start)
│   ├── src/             # Frontend source
│   ├── Dockerfile       # Frontend container
│   └── package.json     # Node dependencies
├── admin/               # Admin panel (TanStack Start)
│   ├── src/             # Admin source
│   ├── Dockerfile       # Admin container
│   └── package.json     # Node dependencies
├── docker-compose.yml   # Development setup
├── docker-compose.prod.yml # Production setup
├── .env.dev            # Development environment variables
└── .env.prod           # Production environment variables
```

## Environment Variables

See `backend/README.md` and `frontend/README.md` (if available) for detailed environment variable configuration.

## Development Workflow

### Running Tests

**Backend (pytest)**
```bash
docker-compose exec backend ./manage.py test
```

**Frontend (Vitest)**
```bash
docker-compose exec frontend npm run test
```

### Database Migrations

**Create migrations**
```bash
docker-compose exec backend alembic revision --autogenerate -m "migration message"
```

**Apply migrations**
```bash
docker-compose exec backend alembic upgrade head
```

## License

MIT
