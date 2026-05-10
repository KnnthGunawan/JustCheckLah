# JustCheckLah!

A production-ready web app where Singapore residents answer a guided questionnaire and see indicative eligibility for six government benefit schemes.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) · TypeScript · Tailwind CSS
- **Backend**: FastAPI · SQLAlchemy · rule-based eligibility engine
- **Database**: PostgreSQL

## Schemes Covered
| Scheme | Agency |
|---|---|
| 2026 Assurance Package (AP) Cash | Ministry of Finance |
| 2025 GST Voucher (GSTV) Cash / MediSave | Ministry of Finance |
| Workfare Income Supplement (WIS) | Ministry of Manpower |
| Silver Support Scheme (SSS) | CPF Board |
| Majulah Package - 2026 Earn and Save Bonus | Ministry of Finance |
| 2025 MediSave Bonus | Ministry of Finance |

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
```

Set `backend/.env`:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sg_benefits
FRONTEND_URL=http://localhost:3000
```

Run:

```bash
uvicorn app.main:app --reload --port 8000
```

Health checks:
- `GET http://localhost:8000/`
- `GET http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`

Tables are created on startup and the six schemes are seeded idempotently.

### Frontend

```bash
cd frontend
npm install
[ -f .env.local ] || cp .env.example .env.local
```

Set `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run:

```bash
npm run dev
```

App: `http://localhost:3000`

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/health` | Deployment health check |
| GET | `/schemes/` | List active schemes |
| GET | `/schemes/{id}` | Get scheme by ID |
| POST | `/evaluate/` | Evaluate eligibility |

### POST /evaluate/ Example

```json
{
  "citizenship": "Singapore Citizen",
  "residency_in_sg": true,
  "birth_year": 1990,
  "employment_status": "Employed",
  "employment_type": "Full-time",
  "income": {
    "monthly_current": 2500,
    "average_monthly_12m": 2400,
    "assessable_income_YA2024": 28000,
    "assessable_income_YA2025": 30000
  },
  "housing": {
    "hdb_type": "3-Room HDB",
    "annual_value": 12000
  },
  "assets": {
    "property_count": 1,
    "owns_private_property": false
  },
  "household": {
    "size": 3,
    "total_monthly_income": 4500,
    "spouse_income": 2000
  },
  "special_status": {
    "is_government_pensioner": false,
    "has_disability": false
  }
}
```

## Deployment

### 1. Provision PostgreSQL

Create a PostgreSQL database with a managed provider such as Render PostgreSQL, Railway PostgreSQL, Neon, Supabase, or Fly Postgres.

Save the provider's external connection string as:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
```

### 2. Deploy Backend to Render, Railway, or Fly.io

Use the `backend` directory as the service root.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

Health-check path:

```text
/health
```

On startup the backend creates SQLAlchemy tables if needed and upserts the six scheme/rule records without duplicating them.

### 3. Deploy Frontend to Vercel

Use the `frontend` directory as the Vercel project root.

Install command:

```bash
npm install
```

Build command:

```bash
npm run build
```

Output:

```text
.next
```

Environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.example.com
```

After deployment, update the backend `FRONTEND_URL` to the final Vercel URL so CORS allows browser requests.

## Notes
- No authentication required.
- User answers are stored only in browser `sessionStorage`; they are not persisted by the app.
- Keep frontend `UserResponse` types aligned with backend Pydantic schemas.
- Do not use deprecated flat fields such as `monthly_income`, `housing_type`, or `household_size`.
