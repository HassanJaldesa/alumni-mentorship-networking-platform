# Alumni Mentorship and Networking Platform

A web-based platform that automates student–alumni mentor matching at Strathmore University. Students and alumni mentors complete an onboarding questionnaire, and a two-layer recommendation engine suggests the five most suitable mentors for each student:

1. **Binary gate (rule-based filtering):** a mentor is kept only if they share the student's industry, share at least one mentoring interest, have compatible availability and still have mentee places.
2. **Semantic ranking:** the remaining mentors are ranked by cosine similarity of a 428-dimension profile vector that combines a Sentence-BERT (`all-MiniLM-L6-v2`) embedding of the user's own text with a 44-position encoding of their questionnaire answers.

The platform also manages mentorship requests, sessions, progress notes and feedback, and gives administrators user management and reports.

This is a final-year capstone project for the BSc in Informatics and Computer Science, Strathmore University (2026).

## Repository structure

| Folder | Contents |
|---|---|
| `frontend/` | Next.js 15 application: all pages, API route handlers, role-based middleware, and `scripts/create-admin.mjs` |
| `ml-service/` | FastAPI recommendation service: profile vector pipeline, recommendation engine, tests (`tests/`) and the synthetic dataset, evaluation, test-case, load and fault-injection scripts (`synthetic/`) |
| `database/migrations/` | PostgreSQL migrations `001` to `010`, applied in order |
| `docs/` | `TESTING.md`: how to run, load data into and test the platform |

## Requirements

- Node.js 22 and npm 10
- Python 3.13
- PostgreSQL 18 with the pgvector 0.8.7 extension
- About 1 GB of free memory for the recommendation service (the model is loaded once at start-up)

All software used is open source. No paid service or API key is needed.

## 1. Database setup

Create the application user and database as the `postgres` admin:

```sql
CREATE USER alumni_app1 WITH PASSWORD '<your-password>';
CREATE DATABASE alumni_mentorship OWNER alumni_app1;
\c alumni_mentorship
CREATE EXTENSION IF NOT EXISTS vector;
```

Apply the migrations in order (PowerShell, from the repository root):

```powershell
$env:PGPASSWORD = Read-Host "alumni_app1 password"
Get-ChildItem database\migrations\*.sql | Sort-Object Name | ForEach-Object { psql -U alumni_app1 -d alumni_mentorship -v ON_ERROR_STOP=1 -q -f $_.FullName }
Remove-Item Env:PGPASSWORD
```

## 2. Recommendation service (`ml-service`)

```powershell
cd ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env   # then fill in the real values
uvicorn app.main:app --port 8000
```

Check http://localhost:8000/health (model loaded), http://localhost:8000/health/db (pgvector version) and http://localhost:8000/docs (OpenAPI documentation).

## 3. Web application (`frontend`)

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # then fill in the real values
npm run dev                         # or: npm run build, then npm start
```

Open http://localhost:3000. With the recommendation service running, http://localhost:3000/api/health returns `"status":"ok"`.

## Configuration

Real values are kept in `ml-service/.env` and `frontend/.env.local`, which are excluded from Git. The `.env.example` files list every variable without its value.

| Variable | File | Purpose |
|---|---|---|
| `DATABASE_URL` | both | PostgreSQL connection string |
| `SBERT_MODEL` | `ml-service/.env` | Sentence-BERT model name (`all-MiniLM-L6-v2`) |
| `SERVICE_TOKEN` / `ML_SERVICE_TOKEN` | `ml-service/.env` / `frontend/.env.local` | Shared secret for the 60-second service token; the two values must be identical |
| `ML_SERVICE_URL` | `frontend/.env.local` | Address of the recommendation service |
| `JWT_SECRET` | `frontend/.env.local` | Signs the 12-hour session cookie; at least 32 characters |

## Accounts and data

| Task | Command |
|---|---|
| Create the first administrator (from `frontend`) | `node --env-file=.env.local scripts/create-admin.mjs First Last email@example.com` |
| Load the synthetic dataset: 30 students and 70 mentors (from `ml-service`) | `python -m synthetic.load` |
| Remove the synthetic dataset before any real use | `python -m synthetic.load --remove` |

Students and alumni mentors register on the `/login` page. Further administrators are created from **Users → Create administrator**. Synthetic accounts use `@synthetic.test` emails and are excluded from reports by default.

## Tests

Run from `ml-service` with the virtual environment active. Full instructions, including the manual browser checklist, are in [docs/TESTING.md](docs/TESTING.md).

| What | Command |
|---|---|
| 32 unit and integration tests | `python -m pytest -v` |
| Engine evaluation on 20 synthetic scenarios | `python -m synthetic.evaluate` |
| System test cases TC-01 to TC-13 and TC-15 | `python -m synthetic.test_cases --admin-email ... --admin-password ...` |
| Load test, 50 concurrent users (production build) | `python -m synthetic.load_test` |
| Fault injection (service stopped and restarted) | `python -m synthetic.fault_test` |

## Development workflow

Each module was planned as a GitHub issue, built on a branch named after the issue (for example `feature/13-recommendation-engine`), and merged into `main` through a pull request that closes the issue. Commit messages follow the `type(scope): summary` convention. The submitted version is tagged `v1.0`.

## Known limitations

- The platform runs as a local deployment over HTTP; production use requires HTTPS.
- The recommendation engine was evaluated on synthetic profiles only; no pilot with real users was carried out.
- Deactivating a user blocks new logins, but an open session stays valid until its 12-hour token expires.
- There is no "end mentorship" action, so accepted mentorships count against a mentor's capacity.

## Access and licence

Copyright © 2026 Jaldesa Hassan Galm. All rights reserved.

This repository is public so that it can be assessed as part of a Strathmore University capstone project. No licence is granted to copy, modify or redistribute the code without the author's written permission.
