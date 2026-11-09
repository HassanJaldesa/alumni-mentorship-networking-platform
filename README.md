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