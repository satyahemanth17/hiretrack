# HireTrack Phase 1 — Backend Design Spec

**Date:** 2026-04-26  
**Status:** Approved  
**Scope:** FastAPI backend only (Phase 1 of 6)

---

## Overview

A production-quality REST API for tracking job applications. Built with FastAPI on Python 3.14, PostgreSQL 16 via SQLAlchemy ORM, Pydantic v2 for schema validation, and Alembic for migrations. Authentication uses GitHub OAuth 2.0 with JWT tokens. All data is user-scoped.

---

## Architecture

```
GitHub OAuth → /auth/github → /auth/github/callback
                                       │
                                  JWT (60 min)
                                       │
              FastAPI (port 8000)──────┘
                  │
          SQLAlchemy ORM
                  │
          PostgreSQL 16 (port 5432)
```

Single FastAPI application with four router modules. No BFF or frontend in this phase. The `/docs` Swagger UI must be reachable at `http://localhost:8000/docs` after startup.

---

## Data Model

### `applications` table

| Column         | Type      | Nullable | Notes                                                       |
|----------------|-----------|----------|-------------------------------------------------------------|
| id             | UUID      | No       | Primary key, server-default uuid4                           |
| user_id        | Integer   | No       | GitHub user ID, extracted from JWT                          |
| company        | String    | No       |                                                             |
| role           | String    | No       |                                                             |
| status         | Enum      | No       | applied / phone_screen / interview / offer / rejected / withdrawn |
| job_description| Text      | Yes      |                                                             |
| notes          | Text      | Yes      |                                                             |
| location       | String    | Yes      |                                                             |
| job_url        | String    | Yes      |                                                             |
| salary_min     | Integer   | Yes      |                                                             |
| salary_max     | Integer   | Yes      |                                                             |
| applied_date   | Date      | No       |                                                             |
| follow_up_date | Date      | Yes      |                                                             |
| created_at     | DateTime  | No       | server-default utcnow                                       |
| updated_at     | DateTime  | No       | onupdate utcnow                                             |

### `ApplicationStatus` enum

```
applied | phone_screen | interview | offer | rejected | withdrawn
```

---

## File Structure

```
backend/
├── app/
│   ├── main.py          — FastAPI app, middleware, rate limiting, router registration
│   ├── database.py      — SQLAlchemy engine, SessionLocal, Base, get_db dependency
│   ├── models.py        — ORM models (Application, ApplicationStatus enum)
│   ├── schemas.py       — Pydantic v2 schemas (Create, Update, Response, Auth)
│   ├── auth.py          — GitHub OAuth flow, JWT encode/decode, get_current_user
│   └── routers/
│       ├── auth.py          — /auth/github, /auth/github/callback, /auth/me
│       ├── applications.py  — CRUD for /applications and /applications/{id}
│       ├── analytics.py     — /analytics/funnel, /analytics/timeline
│       └── matcher.py       — /matcher/analyze
├── alembic/
│   ├── env.py           — configured for SQLAlchemy models
│   └── versions/        — migration scripts
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## API Endpoints

### Auth — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/github` | Redirect to GitHub OAuth |
| GET | `/auth/github/callback` | Exchange code → return JWT |
| GET | `/auth/me` | Return current user profile |

### Applications — `/applications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/applications` | List (paginated, optional `?status=` filter) |
| POST | `/applications` | Create new application |
| GET | `/applications/{id}` | Get single (user-scoped) |
| PATCH | `/applications/{id}` | Partial update |
| DELETE | `/applications/{id}` | Delete (user-scoped) |

### Analytics — `/analytics`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/funnel` | Count by status for current user |
| GET | `/analytics/timeline` | Applications grouped by applied_date |

### Matcher — `/matcher`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/matcher/analyze` | `{resume, job_description}` → `{matched: [...], missing: [...], score: float}` |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{"status": "ok"}` — no auth required |

---

## Auth Implementation

1. `GET /auth/github` — redirect to `https://github.com/login/oauth/authorize?client_id=...&scope=read:user,user:email`
2. `GET /auth/github/callback?code=...` — POST to `https://github.com/login/oauth/access_token`, GET `https://api.github.com/user`, issue JWT containing `{sub: github_id, login: username, email, avatar_url}`, return `{access_token, token_type: "bearer"}`
3. `get_current_user` FastAPI dependency — decode JWT, return user dict; all protected routes inject this
4. JWT: HS256, 60-minute expiry, secret from `SECRET_KEY` env var

---

## Keyword Matcher

- Input: `{resume: str, job_description: str}`
- Algorithm: regex `\b<keyword>\b` (case-insensitive) against 60+ tech keywords covering languages, frameworks, tools, cloud, databases
- Output: `{matched: [str], missing: [str], score: float}` where score = `len(matched) / len(job_description_keywords)`
- Rate limited: 20 requests/minute per IP

---

## Rate Limiting (slowapi)

| Scope | Limit |
|-------|-------|
| Global (all routes) | 200 / 15 minutes |
| Auth routes | 10 / 15 minutes |
| Matcher route | 20 / minute |

---

## Environment Variables (`.env.example`)

```
DATABASE_URL=postgresql://hiretrack:hiretrack@localhost:5432/hiretrack
SECRET_KEY=changeme
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

---

## Requirements (Python 3.14 compatible)

- fastapi
- uvicorn[standard]
- sqlalchemy
- alembic
- psycopg2-binary
- pydantic[email]
- python-jose[cryptography]
- httpx
- slowapi
- python-dotenv

---

## Dockerfile

Multi-stage not required at this phase. Single-stage Python 3.14-slim image, installs requirements, copies app, exposes 8000, runs uvicorn.

---

## Validation Checklist (per CLAUDE.md)

- [ ] `python -m py_compile` passes for every `.py` file
- [ ] `pip install -r requirements.txt` completes cleanly
- [ ] `uvicorn app.main:app --reload --port 8000` starts without errors
- [ ] `http://localhost:8000/docs` shows all endpoints
- [ ] `http://localhost:8000/health` returns `{"status": "ok"}`

---

## Out of Scope (Phase 1)

- BFF (Phase 3)
- Frontend (Phase 4)
- Docker Compose (Phase 5)
- Full PostgreSQL running locally — validation uses sqlite or mocked DB if Postgres unavailable
