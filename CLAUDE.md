<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **hiretrack** (1 symbols, 0 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/hiretrack/context` | Codebase overview, check index freshness |
| `gitnexus://repo/hiretrack/clusters` | All functional areas |
| `gitnexus://repo/hiretrack/processes` | All execution flows |
| `gitnexus://repo/hiretrack/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Environment
- Python: 3.14.3
- Node.js: 20.20.2
- Docker: 29.2.1 (running)
- OS: macOS Apple Silicon (M-series)

## Installed Claude Code Plugins
- Superpowers: active — follow its spec/plan/build workflow
- claude-mem: active — context is preserved across sessions
- UI UX Pro Max: active in ~/.claude/skills/ — use for all UI
- GitNexus MCP: active — use impact() before any refactor

## Design System
- DESIGN.md is in project root — read it before any frontend work
- Match Linear's design system exactly: colors, typography, spacing
- UI UX Pro Max will auto-activate for UI requests

## What This Project Is
Full-stack job application tracker. Portfolio project for MS Software
Engineering student applying for SWE jobs in USA.
Code must be production-quality and impressive to technical interviewers.

## Tech Stack — DO NOT deviate
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: FastAPI (Python 3.14), SQLAlchemy, Pydantic v2, Alembic
- BFF: Node.js + Express.js + TypeScript
- Database: PostgreSQL 16
- Auth: GitHub OAuth 2.0 + JWT
- Container: Docker + Docker Compose
- CI/CD: GitHub Actions

## File Structure to Create
hiretrack/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── applications.py
│   │       ├── analytics.py
│   │       └── matcher.py
│   ├── alembic/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── bff/
│   ├── src/server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── matcher/page.tsx
│   ├── components/
│   │   ├── KanbanBoard.tsx
│   │   ├── AddJobModal.tsx
│   │   ├── AnalyticsChart.tsx
│   │   └── KeywordMatcher.tsx
│   └── lib/api.ts
├── DESIGN.md
├── CLAUDE.md
├── docker-compose.yml
└── .github/workflows/deploy.yml

## Key Technical Decisions
- ApplicationStatus enum: applied, phone_screen, interview,
  offer, rejected, withdrawn
- Ports: BFF=4000, FastAPI=8000, Next.js=3000, PostgreSQL=5432
- Rate limits: 200/15min global, 10/15min auth, 20/min matcher
- All FastAPI routes user-scoped (filter by user_id)
- Keyword matcher: regex word-boundary, 60+ tech keywords
- JWT expiry: 60 minutes

## GitHub OAuth
- App name: HireTrack Dev
- Callback: http://localhost:8000/auth/github/callback

## GitHub Setup (run once before coding)
git init
git branch -M main
gh repo create hiretrack --public --source=. --remote=origin
git checkout -b dev
echo ".env\n__pycache__/\nnode_modules/\n.DS_Store\n*.pyc\n.next/\ndist/" > .gitignore
git add . && git commit -m "chore: initial repo setup"
git push -u origin dev

## Git Commits Per Phase
Phase 1 backend:
  git add backend/
  git commit -m "feat(backend): FastAPI with SQLAlchemy, Pydantic v2, JWT auth"

Phase 2 migrations + routes:
  git add backend/alembic/ backend/app/routers/
  git commit -m "feat(api): Alembic migrations and REST endpoints"

Phase 3 BFF:
  git add bff/
  git commit -m "feat(bff): Express TypeScript BFF with rate limiting and proxy"

Phase 4 frontend:
  git add frontend/
  git commit -m "feat(frontend): Next.js Kanban board, analytics, matcher UI"

Phase 5 docker + CI:
  git add docker-compose.yml .github/
  git commit -m "feat(infra): Docker Compose and GitHub Actions CI"

Phase 6 docs:
  git add README.md
  git commit -m "docs: README with architecture diagram"
  git checkout main && git merge dev --no-ff
  git push origin main && git push origin dev

## Build and Validation Commands

### Python backend
python -m py_compile app/main.py
uvicorn app.main:app --reload --port 8000
# http://localhost:8000/docs must load

### Alembic
alembic upgrade head
alembic current

### BFF TypeScript
cd bff && npx tsc --noEmit
# Zero errors required

### Frontend
cd frontend && npx tsc --noEmit
npm run build
# Both must pass

### Docker
docker-compose config
docker-compose up --build
curl http://localhost:8000/health
curl http://localhost:4000/health

## Done When
1. docker-compose up --build starts all 4 services
2. GitHub OAuth login works
3. Can add job application and see on Kanban board
4. Analytics shows funnel and timeline
5. Matcher returns matched and missing keywords
6. npx tsc --noEmit passes in bff/ and frontend/
7. GitHub Actions CI passes on push to main

## DO NOT
- Use Django or Flask (must be FastAPI)
- Use SQLite (must be PostgreSQL)
- Skip type hints on any Python function
- Skip TypeScript types on any .ts or .tsx file
- Add .env files to git
- Skip validation commands after each phase
- Edit any symbol without running gitnexus_impact first
