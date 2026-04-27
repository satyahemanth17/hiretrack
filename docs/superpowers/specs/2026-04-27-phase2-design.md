# HireTrack Phase 2 — Full Stack Design Spec

**Date:** 2026-04-27  
**Status:** Approved  
**Scope:** Alembic migration, BFF, Frontend, Docker Compose, CI/CD, README, release merge

---

## Overview

Phase 2 completes HireTrack from a backend-only API into a fully deployable full-stack application. It delivers:

1. The initial Alembic migration (verified against real PostgreSQL 16 via Docker)
2. A Node.js/Express TypeScript BFF on port 4000
3. A Next.js 14 frontend on port 3000 (Linear design system, Kanban + analytics + matcher)
4. Docker Compose orchestrating all 4 services
5. GitHub Actions CI across all three layers
6. README.md with architecture diagram
7. Release merge to main

---

## Section 1: Alembic Migration

**Goal:** Generate and verify the initial database migration so the `applications` table is created correctly in PostgreSQL.

**Approach:**
1. Start PostgreSQL 16 via Docker: `docker run --rm -d --name hiretrack-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=hiretrack -p 5432:5432 postgres:16-alpine`
2. Wait for PostgreSQL to be ready (poll `pg_isready` or sleep 5s)
3. From `backend/`: `DATABASE_URL=postgresql://postgres:password@localhost:5432/hiretrack venv/bin/alembic revision --autogenerate -m "initial"`
4. Inspect the generated migration for correctness (all 16 columns present, status as VARCHAR via `native_enum=False`)
5. `DATABASE_URL=postgresql://postgres:password@localhost:5432/hiretrack venv/bin/alembic upgrade head`
6. `DATABASE_URL=postgresql://postgres:password@localhost:5432/hiretrack venv/bin/alembic current` → confirms at head
7. `docker stop hiretrack-pg`
8. Commit: `git add backend/alembic/ && git commit -m "feat(api): Alembic migrations and REST endpoints"`

**Expected migration:** Creates `applications` table with all 16 columns including the 5 approved nullable additions (location, job_url, salary_min, salary_max, follow_up_date). Status column uses VARCHAR (not native ENUM) for cross-database compatibility.

---

## Section 2: BFF

**Goal:** Express TypeScript proxy layer on port 4000. All frontend API calls go through the BFF, which proxies to FastAPI on port 8000 and enforces rate limits.

### File Structure

```
bff/
├── src/
│   └── server.ts       — full application (single file)
├── package.json
├── tsconfig.json
└── Dockerfile
```

### server.ts Responsibilities

- CORS: allow `http://localhost:3000`
- JSON body parsing
- Rate limits (express-rate-limit):
  - Global: 200 req / 15 min
  - `/api/auth/*`: 10 req / 15 min
  - `/api/matcher/*`: 20 req / min
- Proxy: all `/api/*` → `http://localhost:8000/*` (strips `/api` prefix) via `http-proxy-middleware`
- `GET /health` → `{"status":"ok"}` (no proxy, direct response)

### Dependencies

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.3",
    "express-rate-limit": "^7.2.0",
    "http-proxy-middleware": "^3.0.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.7",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

### tsconfig.json

Strict mode, `"target": "ES2020"`, `"module": "commonjs"`, `"moduleResolution": "node"`, `"outDir": "dist"`, `"rootDir": "src"`, `"esModuleInterop": true`.

### Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npx", "ts-node-dev", "--respawn", "src/server.ts"]
```

### Validation

- `cd bff && npx tsc --noEmit` → zero errors
- `npx ts-node-dev src/server.ts` starts on port 4000
- `curl http://localhost:4000/health` → `{"status":"ok"}`

---

## Section 3: Frontend

**Goal:** Next.js 14 + TypeScript + Tailwind single-page-app-style multi-route frontend. Communicates exclusively with BFF at port 4000.

### Bootstrap

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --no-git
```

Then install additional dependencies:
```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable recharts
npm install -D @types/recharts
```

### Design System (Linear-inspired)

| Token | Value |
|-------|-------|
| Primary | `#5E6AD2` (Linear violet) |
| Primary hover | `#4F5BBF` |
| Surface | `#F7F8FA` |
| Card background | `#FFFFFF` |
| Text primary | `#1A1A1A` |
| Text secondary | `#6B7280` |
| Border | `#E5E7EB` |
| Font | Inter (Google Fonts) |
| Base font size | 14px |
| Border radius | 6px (cards), 4px (buttons), 9999px (pills) |
| Card shadow | `0 1px 3px rgba(0,0,0,0.06)` |

Status badge colors:
| Status | Background | Text |
|--------|-----------|------|
| applied | `#EFF6FF` | `#2563EB` |
| phone_screen | `#F5F3FF` | `#7C3AED` |
| interview | `#FFF7ED` | `#C2410C` |
| offer | `#F0FDF4` | `#15803D` |
| rejected | `#FEF2F2` | `#DC2626` |
| withdrawn | `#F9FAFB` | `#6B7280` |

### Pages

**`app/page.tsx`** — Login landing
- Centered layout, HireTrack logo/wordmark in Linear violet
- Tagline: "Track your job search, effortlessly."
- Single CTA button: "Continue with GitHub" → calls `GET /api/auth/github` (redirects to GitHub OAuth)
- If JWT token exists in localStorage → redirect to `/dashboard`

**`app/dashboard/page.tsx`** — Main application
- Protected: if no token → redirect to `/`
- Top nav: logo, "Dashboard" / "Matcher" links, user avatar + logout
- Tab switcher: "Board" (default) | "Analytics"
- Board tab: `<KanbanBoard>` + floating `+` button → opens `<AddJobModal>`
- Analytics tab: `<AnalyticsChart>`

**`app/matcher/page.tsx`** — Keyword matcher
- Protected: if no token → redirect to `/`
- Same nav as dashboard
- `<KeywordMatcher>` component

### Components

**`components/KanbanBoard.tsx`**
- 6 columns, one per `ApplicationStatus`, rendered horizontally with overflow-x scroll
- Each column header: status label + count badge
- Cards: `company` (bold), `role` (secondary), `applied_date` (muted), status pill
- Drag-and-drop via `@dnd-kit/core`: dragging a card calls `PATCH /api/applications/{id}` with new status
- "Add" button per column calls `AddJobModal` pre-filled with that column's status
- Data fetched on mount via `GET /api/applications?limit=100`

**`components/AddJobModal.tsx`**
- Modal overlay (backdrop blur, centered card)
- Fields: Company*, Role*, Status (select), Applied Date*, Location, Job URL, Salary Min, Salary Max, Follow-up Date, Notes (textarea)
- Submit → `POST /api/applications`, closes modal, refreshes board
- Cancel button, click-outside-to-close
- Validation: company + role + applied_date are required

**`components/AnalyticsChart.tsx`**
- Two charts stacked vertically, each in a card
- **Funnel:** Horizontal bar chart (recharts `BarChart`) — status on Y axis, count on X axis, bars in Linear violet with 80% opacity steps
- **Timeline:** Area line chart (recharts `AreaChart`) — applied_date on X axis, count on Y axis, violet area fill
- Data from `GET /api/analytics/funnel` and `GET /api/analytics/timeline`
- Empty state: "No applications yet" illustration (simple SVG)

**`components/KeywordMatcher.tsx`**
- Two `<textarea>` inputs side by side: "Your Resume" / "Job Description"
- "Analyze" button → `POST /api/matcher/analyze`
- Results section:
  - Score gauge: circular progress ring, percentage, color-coded (green ≥ 70%, amber 40–70%, red < 40%)
  - Matched chips: green pill per keyword
  - Missing chips: red pill per keyword
- Loading spinner during API call

**`lib/api.ts`**
- `BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:4000"`
- `getToken()` — reads JWT from localStorage
- `apiFetch(path, options)` — attaches `Authorization: Bearer <token>`, base URL = BFF_URL
- Named exports: `listApplications`, `createApplication`, `updateApplication`, `deleteApplication`, `getFunnel`, `getTimeline`, `analyzeKeywords`

### Validation

- `cd frontend && npx tsc --noEmit` → zero errors
- `npm run build` → passes
- Dev server starts: `npm run dev` at port 3000

---

## Section 4: Docker Compose

**File:** `docker-compose.yml` in project root.

**Services:**

| Service | Image | Port | Depends on |
|---------|-------|------|-----------|
| `db` | postgres:16-alpine | 5432 | — |
| `backend` | ./backend | 8000 | db (healthy) |
| `bff` | ./bff | 4000 | backend (healthy) |
| `frontend` | ./frontend | 3000 | bff |

**Health checks:**
- `db`: `pg_isready -U postgres`
- `backend`: `curl -f http://localhost:8000/health`
- `bff`: `curl -f http://localhost:4000/health`

**Network:** `hiretrack-network` (bridge driver)

**Environment (backend):**
```
DATABASE_URL=postgresql://postgres:password@db:5432/hiretrack
SECRET_KEY=${SECRET_KEY:-dev-secret-key}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:-}
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

**Environment (bff):**
```
FASTAPI_URL=http://backend:8000
PORT=4000
```

**Environment (frontend):**
```
NEXT_PUBLIC_BFF_URL=http://localhost:4000
```

**Validation:**
- `docker-compose config` → no errors
- `docker-compose up --build` → all 4 services healthy
- `curl http://localhost:8000/health` → `{"status":"ok"}`
- `curl http://localhost:4000/health` → `{"status":"ok"}`

---

## Section 5: CI/CD, README, Merge

### GitHub Actions

**File:** `.github/workflows/ci.yml`

Triggers: push to `main`, push to `dev`, pull requests to `main`.

**Jobs:**

```yaml
test-backend:
  - python 3.14
  - pip install -r backend/requirements.txt
  - cd backend && pytest -v

test-bff:
  - node 20
  - cd bff && npm ci && npx tsc --noEmit

test-frontend:
  - node 20
  - cd frontend && npm ci && npx tsc --noEmit && npm run build

lint-docker:
  - docker-compose config
```

### README.md

Structure:
1. Title + badges (CI status)
2. Architecture diagram (ASCII)
3. Tech stack table
4. Local setup (5 steps: clone → `.env` → `docker-compose up --build` → GitHub OAuth → open browser)
5. API reference (table of endpoints)
6. Development setup (per-service run commands)

ASCII architecture:
```
Browser → Next.js (3000) → BFF (4000) → FastAPI (8000) → PostgreSQL (5432)
                                      └─ Rate Limiting
                                      └─ CORS
```

### Merge

```bash
git checkout main
git merge dev --no-ff -m "release: HireTrack v1.0"
git push origin main && git push origin dev
```

---

## Execution Order

1. Alembic migration (sequential — needs Docker)
2. BFF + Frontend (parallel subagents)
3. Docker Compose (after BFF + frontend exist)
4. GitHub Actions + README (sequential, fast)
5. Merge to main
