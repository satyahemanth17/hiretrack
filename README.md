# HireTrack

[![CI](https://github.com/satyahemanth17/hiretrack/actions/workflows/ci.yml/badge.svg)](https://github.com/satyahemanth17/hiretrack/actions/workflows/ci.yml)

A full-stack job application tracker built as a portfolio project.

## Architecture

```
Browser → Next.js (3000) → BFF (4000) → FastAPI (8000) → PostgreSQL (5432)
                                       └─ Rate Limiting
                                       └─ CORS
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| BFF | Node.js + Express + TypeScript |
| Backend | FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | GitHub OAuth + JWT |
| Infra | Docker Compose |

## Quick Start

1. Clone the repo
   ```bash
   git clone https://github.com/satyahemanth17/hiretrack.git
   cd hiretrack
   ```

2. Create a `.env` file at the project root (optional — defaults work for local dev):
   ```
   SECRET_KEY=your-secret-key
   GITHUB_CLIENT_ID=your-github-oauth-client-id
   GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
   POSTGRES_PASSWORD=password
   ```

3. Start all services:
   ```bash
   docker compose up --build
   ```

4. Set up GitHub OAuth (optional for auth):
   - Create an OAuth App at https://github.com/settings/developers
   - Set the callback URL to `http://localhost:8000/auth/github/callback`
   - Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to your `.env`

5. Open `http://localhost:3000` in your browser.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/auth/github` | Initiate GitHub OAuth |
| GET | `/auth/github/callback` | OAuth callback |
| GET | `/applications` | List applications |
| POST | `/applications` | Create application |
| PATCH | `/applications/{id}` | Update application |
| DELETE | `/applications/{id}` | Delete application |
| GET | `/analytics/funnel` | Application funnel counts |
| GET | `/analytics/timeline` | Applications over time |
| POST | `/matcher/analyze` | Keyword match score |

## Development

**Backend (FastAPI):**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql://postgres:password@localhost:5432/hiretrack uvicorn app.main:app --reload
```

**BFF (Express):**
```bash
cd bff
npm install
npm run dev
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
```
