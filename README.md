# Alumni Mentorship and Networking Platform

A web-based mentorship and networking platform for Strathmore University that connects students with alumni mentors using a two-layer recommendation engine (structured filtering + SBERT semantic similarity).

## Structure
- `frontend/` — Next.js application (user interface and API routes)
- `ml-service/` — FastAPI recommendation service (SBERT embeddings and ranking)
- `database/` — PostgreSQL migrations and seed data

## Requirements
- Node.js 22, Python 3.13, PostgreSQL 18 with pgvector 0.8.7

Setup instructions will be added as each component is built.