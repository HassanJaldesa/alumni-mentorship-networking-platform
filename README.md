# Alumni Mentorship and Networking Platform

A web-based mentorship and networking platform for Strathmore University that connects students with alumni mentors using a two-layer recommendation engine (structured filtering + SBERT semantic similarity).

## Structure
- `frontend/` — Next.js application (user interface and API routes)
- `ml-service/` — FastAPI recommendation service (SBERT embeddings and ranking)
- `database/` — PostgreSQL migrations and seed data

## Requirements
- Node.js 22, Python 3.13, PostgreSQL 18 with pgvector 0.8.7

Setup instructions will be added as each component is built.

## Database setup
1. Create the application user and database (as the `postgres` admin):
   ```sql
   CREATE USER alumni_app1 WITH PASSWORD '<your-password>';
   CREATE DATABASE alumni_mentorship OWNER alumni_app1;
   \c alumni_mentorship
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Apply the migrations in order (PowerShell, from the repo root):
   ```powershell
   $env:PGPASSWORD = Read-Host "alumni_app1 password"
   Get-ChildItem database\migrations\*.sql | Sort-Object Name | ForEach-Object { psql -U alumni_app1 -d alumni_mentorship -v ON_ERROR_STOP=1 -q -f $_.FullName }
   Remove-Item Env:PGPASSWORD
   ```
   ## Recommendation service setup (ml-service)
```powershell
cd ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env   # then fill in the real values
python -m pytest -v           # 3 tests should pass
uvicorn app.main:app --reload
```
Check http://localhost:8000/health, http://localhost:8000/health/db and http://localhost:8000/docs.

## Web app setup (frontend)
```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # then fill in the real values
npm run dev
```
With the recommendation service also running, http://localhost:3000/api/health should return `"status":"ok"`.

### Authentication

- Students and alumni mentors register on the `/login` page (Register form). Administrator accounts are created directly in the database.
- Passwords are hashed with bcrypt (cost 12) before they are stored.
- A signed session token (JWT, HS256) is kept in an HTTP-only cookie and expires after 12 hours. `JWT_SECRET` in `frontend/.env.local` must be at least 32 characters.
- `frontend/middleware.ts` limits `/student`, `/mentor` and `/admin` (and `/api/student`, `/api/mentor`, `/api/admin`) to the matching role. Logged-out visitors are sent to `/login`.

### Onboarding and profile vectors

- Apply `database/migrations/010_add_profile_text_fields.sql` after migrations 001 to 009.
- New students and mentors are sent to the onboarding questionnaire (`/student/onboarding`, `/mentor/onboarding`) until it is complete. The same page is used to edit the profile.
- Saving the questionnaire stores the answers and calls `POST /profiles/{user_id}/vectors` on the recommendation service, which stores a 384-dimension SBERT embedding, a 44-dimension multi-hot vector and a 428-dimension unified vector in `profile_vectors`.
- Requests to the recommendation service carry a 60-second HS256 JWT signed with a shared secret: `SERVICE_TOKEN` in `ml-service/.env` and `ML_SERVICE_TOKEN` in `frontend/.env.local` must be identical.
- The fixed answer lists are kept in `ml-service/app/vocabulary.py` and `frontend/lib/vocabulary.ts`. `tests/test_vocabulary.py` fails if they differ.
See docs/TESTING.md for how to run, load data into and test the platform.
