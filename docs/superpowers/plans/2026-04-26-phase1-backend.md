# Phase 1 Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality FastAPI REST API for job application tracking with GitHub OAuth, JWT auth, PostgreSQL via SQLAlchemy, and a keyword matcher — validated by `uvicorn app.main:app` and a live `/docs` page.

**Architecture:** A single FastAPI app split into four router modules (`auth`, `applications`, `analytics`, `matcher`) that share a SQLAlchemy session dependency and a `get_current_user` JWT dependency. A `limiter.py` module holds the slowapi instance so all routers can import it without circular dependencies. Tests use SQLite in-memory via dependency override.

**Tech Stack:** Python 3.14, FastAPI, SQLAlchemy 2.0 (declarative mapped columns), Pydantic v2, Alembic, python-jose (JWT), httpx (GitHub OAuth), slowapi (rate limiting), pytest + TestClient (tests), psycopg2-binary (PostgreSQL driver), python-dotenv.

---

## File Map

| File | Responsibility |
|------|---------------|
| `backend/requirements.txt` | All dependencies pinned with minimum versions |
| `backend/.env.example` | All required env vars with placeholder values |
| `backend/Dockerfile` | Single-stage Python 3.14-slim image |
| `backend/app/__init__.py` | Empty package marker |
| `backend/app/database.py` | Engine, SessionLocal, Base, `get_db` dependency |
| `backend/app/models.py` | `Application` ORM model, `ApplicationStatus` enum |
| `backend/app/schemas.py` | All Pydantic v2 request/response models |
| `backend/app/auth.py` | JWT encode/decode, `get_current_user`, GitHub OAuth exchange |
| `backend/app/limiter.py` | slowapi `Limiter` singleton imported by main + routers |
| `backend/app/main.py` | App factory: middleware, rate limit handler, router registration, `/health` |
| `backend/app/routers/__init__.py` | Empty package marker |
| `backend/app/routers/auth.py` | `/auth/github`, `/auth/github/callback`, `/auth/me` |
| `backend/app/routers/applications.py` | Full CRUD for `/applications` and `/applications/{id}` |
| `backend/app/routers/analytics.py` | `/analytics/funnel`, `/analytics/timeline` |
| `backend/app/routers/matcher.py` | `/matcher/analyze` with 63-keyword regex engine |
| `backend/tests/__init__.py` | Empty package marker |
| `backend/tests/conftest.py` | SQLite test engine, session, TestClient, `auth_headers` fixture |
| `backend/tests/test_auth.py` | JWT encode/decode unit tests + `/auth/me` endpoint test |
| `backend/tests/test_health.py` | `/health` endpoint smoke test |
| `backend/tests/test_applications.py` | Full CRUD, pagination, status filter, cross-user isolation |
| `backend/tests/test_analytics.py` | Funnel counts, timeline grouping |
| `backend/tests/test_matcher.py` | Matched/missing/score correctness, edge cases |
| `backend/alembic.ini` | Alembic config pointing at `DATABASE_URL` |
| `backend/alembic/env.py` | Autogenerate-aware env using `Base.metadata` |

---

## Task 1: Project Scaffold and Requirements

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/tests/__init__.py`

- [ ] **Step 1: Create the directory tree**

```bash
cd /Users/satya/Projects/hiretrack
mkdir -p backend/app/routers backend/tests backend/alembic/versions
touch backend/app/__init__.py backend/app/routers/__init__.py backend/tests/__init__.py
```

- [ ] **Step 2: Write `backend/requirements.txt`**

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy>=2.0.30
alembic>=1.13.0
psycopg2-binary>=2.9.9
pydantic[email]>=2.7.0
python-jose[cryptography]>=3.3.0
httpx>=0.27.0
slowapi>=0.1.9
python-dotenv>=1.0.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/satya/Projects/hiretrack/backend
pip install -r requirements.txt
```

Expected: all packages install cleanly; no build errors.

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/app/__init__.py backend/app/routers/__init__.py backend/tests/__init__.py
git commit -m "chore(backend): project scaffold and requirements"
```

---

## Task 2: database.py

**Files:**
- Create: `backend/app/database.py`

- [ ] **Step 1: Write `backend/app/database.py`**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hiretrack.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/database.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/database.py
git commit -m "feat(backend): SQLAlchemy engine and session setup"
```

---

## Task 3: models.py

**Files:**
- Create: `backend/app/models.py`

- [ ] **Step 1: Write `backend/app/models.py`**

```python
import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum as SAEnum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    phone_screen = "phone_screen"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, native_enum=False),
        nullable=False,
        default=ApplicationStatus.applied,
    )
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    applied_date: Mapped[date] = mapped_column(Date, nullable=False)
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
```

Note: `native_enum=False` makes SQLAlchemy use VARCHAR for SQLite (tests) and a native enum for PostgreSQL (prod) without any extra config.

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/models.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/models.py
git commit -m "feat(backend): Application ORM model with status enum"
```

---

## Task 4: schemas.py

**Files:**
- Create: `backend/app/schemas.py`

- [ ] **Step 1: Write `backend/app/schemas.py`**

```python
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from .models import ApplicationStatus


class ApplicationCreate(BaseModel):
    company: str
    role: str
    status: ApplicationStatus = ApplicationStatus.applied
    job_description: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    applied_date: date
    follow_up_date: Optional[date] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    job_description: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None


class ApplicationResponse(BaseModel):
    id: str
    user_id: int
    company: str
    role: str
    status: ApplicationStatus
    job_description: Optional[str]
    notes: Optional[str]
    location: Optional[str]
    job_url: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    applied_date: date
    follow_up_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedApplications(BaseModel):
    items: list[ApplicationResponse]
    total: int
    skip: int
    limit: int


class UserResponse(BaseModel):
    id: int
    login: str
    email: Optional[str]
    avatar_url: Optional[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FunnelItem(BaseModel):
    status: ApplicationStatus
    count: int


class TimelineItem(BaseModel):
    date: date
    count: int


class MatcherRequest(BaseModel):
    resume: str
    job_description: str


class MatcherResponse(BaseModel):
    matched: list[str]
    missing: list[str]
    score: float
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/schemas.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas.py
git commit -m "feat(backend): Pydantic v2 request/response schemas"
```

---

## Task 5: auth.py

**Files:**
- Create: `backend/app/auth.py`

- [ ] **Step 1: Write `backend/app/auth.py`**

```python
import os
from datetime import datetime, timedelta, timezone

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI: str = os.getenv(
    "GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback"
)

_bearer = HTTPBearer()


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    return decode_token(credentials.credentials)


async def exchange_github_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )
        token_data = token_resp.json()
        gh_token = token_data.get("access_token")
        if not gh_token:
            raise HTTPException(
                status_code=400, detail="GitHub OAuth failed: no access token returned"
            )

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {gh_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=10,
        )
        user_resp.raise_for_status()
        return user_resp.json()
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/auth.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/auth.py
git commit -m "feat(backend): JWT auth and GitHub OAuth exchange"
```

---

## Task 6: limiter.py

**Files:**
- Create: `backend/app/limiter.py`

- [ ] **Step 1: Write `backend/app/limiter.py`**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/15minutes"],
)
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/limiter.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/limiter.py
git commit -m "feat(backend): slowapi limiter singleton"
```

---

## Task 7: Test Infrastructure (conftest.py)

**Files:**
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Write `backend/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import create_access_token
from app.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_hiretrack.db"

test_engine = create_engine(
    TEST_DB_URL, connect_args={"check_same_thread": False}
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture()
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db):
    from app.main import app

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers() -> dict:
    token = create_access_token(
        {
            "sub": "12345",
            "login": "testuser",
            "email": "testuser@example.com",
            "avatar_url": "https://avatars.githubusercontent.com/u/12345",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def other_auth_headers() -> dict:
    token = create_access_token(
        {
            "sub": "99999",
            "login": "otheruser",
            "email": "other@example.com",
            "avatar_url": None,
        }
    )
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile tests/conftest.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/conftest.py
git commit -m "test(backend): SQLite test fixtures and TestClient setup"
```

---

## Task 8: main.py (skeleton for tests to import)

**Files:**
- Create: `backend/app/main.py`

The routers will be empty stubs for now; this task creates the importable app so that conftest.py works. Routers will be filled in Tasks 9–12.

- [ ] **Step 1: Write `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .limiter import limiter

app = FastAPI(
    title="HireTrack API",
    description="Job application tracker REST API",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
```

Routers will be registered in Task 12 after all router files exist.

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/main.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Write `backend/tests/test_health.py`**

```python
def test_health_returns_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 4: Run the health test**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_health.py -v
```

Expected:
```
tests/test_health.py::test_health_returns_ok PASSED
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/tests/test_health.py
git commit -m "feat(backend): FastAPI app skeleton with /health endpoint"
```

---

## Task 9: JWT Unit Tests + auth router

**Files:**
- Create: `backend/tests/test_auth.py`
- Create: `backend/app/routers/auth.py`

- [ ] **Step 1: Write `backend/tests/test_auth.py`**

```python
import pytest
from fastapi import HTTPException

from app.auth import create_access_token, decode_token


def test_create_and_decode_token():
    data = {"sub": "42", "login": "alice", "email": "alice@example.com", "avatar_url": None}
    token = create_access_token(data)
    decoded = decode_token(token)
    assert decoded["sub"] == "42"
    assert decoded["login"] == "alice"


def test_invalid_token_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        decode_token("not.a.valid.token")
    assert exc_info.value.status_code == 401


def test_get_me_returns_user_profile(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 12345
    assert data["login"] == "testuser"
    assert data["email"] == "testuser@example.com"


def test_get_me_without_token_returns_403(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 403
```

- [ ] **Step 2: Run test — expect failure (router not registered yet)**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_auth.py::test_get_me_returns_user_profile -v
```

Expected: FAILED (404 because router isn't registered yet — confirms test is real)

- [ ] **Step 3: Write `backend/app/routers/auth.py`**

```python
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse

from ..auth import (
    GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI,
    create_access_token,
    exchange_github_code,
    get_current_user,
)
from ..limiter import limiter
from ..schemas import TokenResponse, UserResponse
from fastapi import Request

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/github", include_in_schema=True)
@limiter.limit("10/15minutes")
async def github_login(request: Request) -> RedirectResponse:
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        "&scope=read:user,user:email"
    )
    return RedirectResponse(url=url)


@router.get("/github/callback", response_model=TokenResponse)
@limiter.limit("10/15minutes")
async def github_callback(request: Request, code: str) -> TokenResponse:
    github_user = await exchange_github_code(code)
    token = create_access_token(
        {
            "sub": str(github_user["id"]),
            "login": github_user["login"],
            "email": github_user.get("email"),
            "avatar_url": github_user.get("avatar_url"),
        }
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=int(current_user["sub"]),
        login=current_user["login"],
        email=current_user.get("email"),
        avatar_url=current_user.get("avatar_url"),
    )
```

- [ ] **Step 4: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/routers/auth.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: Register the router in main.py**

Add these two lines to `backend/app/main.py` after the existing imports and before the `@app.get("/health")` line:

```python
from .routers import auth as auth_router
app.include_router(auth_router.router)
```

The full `main.py` after this step:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .limiter import limiter
from .routers import auth as auth_router

app = FastAPI(
    title="HireTrack API",
    description="Job application tracker REST API",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 6: Run auth tests**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_auth.py -v
```

Expected:
```
tests/test_auth.py::test_create_and_decode_token PASSED
tests/test_auth.py::test_invalid_token_raises_401 PASSED
tests/test_auth.py::test_get_me_returns_user_profile PASSED
tests/test_auth.py::test_get_me_without_token_returns_403 PASSED
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/auth.py backend/app/main.py backend/tests/test_auth.py
git commit -m "feat(backend): /auth router with GitHub OAuth and JWT"
```

---

## Task 10: Applications Router

**Files:**
- Create: `backend/app/routers/applications.py`
- Create: `backend/tests/test_applications.py`

- [ ] **Step 1: Write `backend/tests/test_applications.py`**

```python
import pytest

SAMPLE = {
    "company": "Acme Corp",
    "role": "Software Engineer",
    "applied_date": "2026-04-26",
    "status": "applied",
}


def test_create_application(client, auth_headers):
    resp = client.post("/applications", json=SAMPLE, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["company"] == "Acme Corp"
    assert data["role"] == "Software Engineer"
    assert data["user_id"] == 12345
    assert data["status"] == "applied"
    assert "id" in data


def test_list_applications_returns_paginated(client, auth_headers):
    client.post("/applications", json=SAMPLE, headers=auth_headers)
    resp = client.get("/applications", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "skip" in data
    assert "limit" in data
    assert data["total"] >= 1


def test_get_application_by_id(client, auth_headers):
    create = client.post("/applications", json=SAMPLE, headers=auth_headers)
    app_id = create.json()["id"]
    resp = client.get(f"/applications/{app_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == app_id


def test_update_application_status(client, auth_headers):
    create = client.post("/applications", json=SAMPLE, headers=auth_headers)
    app_id = create.json()["id"]
    resp = client.patch(
        f"/applications/{app_id}", json={"status": "interview"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "interview"


def test_delete_application(client, auth_headers):
    create = client.post("/applications", json=SAMPLE, headers=auth_headers)
    app_id = create.json()["id"]
    del_resp = client.delete(f"/applications/{app_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = client.get(f"/applications/{app_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_filter_by_status(client, auth_headers):
    client.post("/applications", json={**SAMPLE, "status": "applied"}, headers=auth_headers)
    client.post("/applications", json={**SAMPLE, "status": "interview"}, headers=auth_headers)
    resp = client.get("/applications?status=interview", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    assert all(i["status"] == "interview" for i in items)


def test_unauthenticated_returns_403(client):
    resp = client.get("/applications")
    assert resp.status_code == 403


def test_cross_user_isolation(client, auth_headers, other_auth_headers):
    create = client.post("/applications", json=SAMPLE, headers=auth_headers)
    app_id = create.json()["id"]
    resp = client.get(f"/applications/{app_id}", headers=other_auth_headers)
    assert resp.status_code == 404


def test_optional_fields(client, auth_headers):
    payload = {
        **SAMPLE,
        "location": "San Francisco, CA",
        "job_url": "https://example.com/jobs/1",
        "salary_min": 120000,
        "salary_max": 160000,
        "follow_up_date": "2026-05-10",
        "notes": "Referral from Alice",
    }
    resp = client.post("/applications", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["location"] == "San Francisco, CA"
    assert data["salary_min"] == 120000
    assert data["follow_up_date"] == "2026-05-10"
```

- [ ] **Step 2: Run tests — expect ImportError / 404 (router not created yet)**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_applications.py::test_create_application -v
```

Expected: FAILED (confirms tests are real before implementation)

- [ ] **Step 3: Write `backend/app/routers/applications.py`**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Application, ApplicationStatus
from ..schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    PaginatedApplications,
)

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=PaginatedApplications)
def list_applications(
    status: ApplicationStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> PaginatedApplications:
    user_id = int(current_user["sub"])
    q = db.query(Application).filter(Application.user_id == user_id)
    if status is not None:
        q = q.filter(Application.status == status)
    total = q.count()
    items = q.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    return PaginatedApplications(items=items, total=total, skip=skip, limit=limit)


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ApplicationResponse:
    app_obj = Application(
        id=str(uuid.uuid4()),
        user_id=int(current_user["sub"]),
        **payload.model_dump(),
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ApplicationResponse:
    app_obj = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == int(current_user["sub"]),
        )
        .first()
    )
    if app_obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj


@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: str,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ApplicationResponse:
    app_obj = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == int(current_user["sub"]),
        )
        .first()
    )
    if app_obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(app_obj, field, value)
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.delete("/{app_id}", status_code=204)
def delete_application(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    app_obj = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == int(current_user["sub"]),
        )
        .first()
    )
    if app_obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_obj)
    db.commit()
```

- [ ] **Step 4: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/routers/applications.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: Register router in main.py**

Add to `backend/app/main.py` (after the auth_router import):

```python
from .routers import applications as applications_router
```

And after `app.include_router(auth_router.router)`:

```python
app.include_router(applications_router.router)
```

- [ ] **Step 6: Run applications tests**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_applications.py -v
```

Expected: all 9 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/applications.py backend/app/main.py backend/tests/test_applications.py
git commit -m "feat(backend): /applications CRUD router with user scoping"
```

---

## Task 11: Analytics Router

**Files:**
- Create: `backend/app/routers/analytics.py`
- Create: `backend/tests/test_analytics.py`

- [ ] **Step 1: Write `backend/tests/test_analytics.py`**

```python
SAMPLE = {
    "company": "Acme Corp",
    "role": "SWE",
    "applied_date": "2026-04-20",
    "status": "applied",
}


def test_funnel_groups_by_status(client, auth_headers):
    client.post("/applications", json=SAMPLE, headers=auth_headers)
    client.post(
        "/applications", json={**SAMPLE, "status": "interview"}, headers=auth_headers
    )
    resp = client.get("/analytics/funnel", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    statuses = {item["status"] for item in data}
    assert "applied" in statuses
    for item in data:
        assert "status" in item
        assert "count" in item
        assert item["count"] > 0


def test_timeline_groups_by_date(client, auth_headers):
    client.post("/applications", json=SAMPLE, headers=auth_headers)
    resp = client.get("/analytics/timeline", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:
        assert "date" in data[0]
        assert "count" in data[0]
        assert data[0]["count"] >= 1


def test_analytics_unauthenticated_returns_403(client):
    resp = client.get("/analytics/funnel")
    assert resp.status_code == 403


def test_funnel_only_shows_current_users_data(client, auth_headers, other_auth_headers):
    client.post(
        "/applications", json={**SAMPLE, "status": "offer"}, headers=other_auth_headers
    )
    resp = client.get("/analytics/funnel", headers=auth_headers)
    statuses = {item["status"] for item in resp.json()}
    assert "offer" not in statuses
```

- [ ] **Step 2: Run tests — expect 404 (router not registered yet)**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_analytics.py::test_funnel_groups_by_status -v
```

Expected: FAILED

- [ ] **Step 3: Write `backend/app/routers/analytics.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Application
from ..schemas import FunnelItem, TimelineItem

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/funnel", response_model=list[FunnelItem])
def get_funnel(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[FunnelItem]:
    user_id = int(current_user["sub"])
    rows = (
        db.query(Application.status, func.count(Application.id).label("count"))
        .filter(Application.user_id == user_id)
        .group_by(Application.status)
        .all()
    )
    return [FunnelItem(status=row.status, count=row.count) for row in rows]


@router.get("/timeline", response_model=list[TimelineItem])
def get_timeline(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[TimelineItem]:
    user_id = int(current_user["sub"])
    rows = (
        db.query(
            Application.applied_date,
            func.count(Application.id).label("count"),
        )
        .filter(Application.user_id == user_id)
        .group_by(Application.applied_date)
        .order_by(Application.applied_date)
        .all()
    )
    return [TimelineItem(date=row.applied_date, count=row.count) for row in rows]
```

- [ ] **Step 4: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/routers/analytics.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: Register router in main.py**

Add to `backend/app/main.py`:

```python
from .routers import analytics as analytics_router
```

And:

```python
app.include_router(analytics_router.router)
```

- [ ] **Step 6: Run analytics tests**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_analytics.py -v
```

Expected: all 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/analytics.py backend/app/main.py backend/tests/test_analytics.py
git commit -m "feat(backend): /analytics funnel and timeline endpoints"
```

---

## Task 12: Matcher Router

**Files:**
- Create: `backend/app/routers/matcher.py`
- Create: `backend/tests/test_matcher.py`

- [ ] **Step 1: Write `backend/tests/test_matcher.py`**

```python
def test_matched_and_missing_keywords(client, auth_headers):
    payload = {
        "resume": "I have experience with Python, React, and PostgreSQL.",
        "job_description": "We need Python, React, Docker, and Kubernetes expertise.",
    }
    resp = client.post("/matcher/analyze", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "matched" in data
    assert "missing" in data
    assert "score" in data
    assert "python" in data["matched"]
    assert "react" in data["matched"]
    assert "docker" in data["missing"]
    assert 0.0 <= data["score"] <= 1.0


def test_empty_resume_gives_zero_score(client, auth_headers):
    payload = {
        "resume": "",
        "job_description": "We need Python and Docker.",
    }
    resp = client.post("/matcher/analyze", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["score"] == 0.0
    assert len(data["missing"]) > 0
    assert data["matched"] == []


def test_all_keywords_matched_gives_score_one(client, auth_headers):
    payload = {
        "resume": "Experienced Python, Docker, and Kubernetes developer.",
        "job_description": "Python, Docker, and Kubernetes required.",
    }
    resp = client.post("/matcher/analyze", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["score"] == 1.0
    assert data["missing"] == []


def test_empty_job_description_gives_zero_score(client, auth_headers):
    payload = {
        "resume": "Python developer",
        "job_description": "No tech keywords here at all.",
    }
    resp = client.post("/matcher/analyze", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["score"] == 0.0


def test_matcher_unauthenticated_returns_403(client):
    resp = client.post(
        "/matcher/analyze",
        json={"resume": "python", "job_description": "python"},
    )
    assert resp.status_code == 403
```

- [ ] **Step 2: Run tests — expect 404 (router not registered)**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_matcher.py::test_matched_and_missing_keywords -v
```

Expected: FAILED

- [ ] **Step 3: Write `backend/app/routers/matcher.py`**

```python
import re

from fastapi import APIRouter, Depends, Request

from ..auth import get_current_user
from ..limiter import limiter
from ..schemas import MatcherRequest, MatcherResponse

router = APIRouter(prefix="/matcher", tags=["matcher"])

# 63 keywords covering languages, frameworks, databases, cloud, ML, and practices
KEYWORDS: list[str] = [
    # Languages
    "python", "javascript", "typescript", "java", "go", "rust",
    "c++", "c#", "ruby", "swift", "kotlin", "scala", "php", "bash",
    # Web frameworks
    "react", "vue", "angular", "svelte", "next.js", "fastapi", "django",
    "flask", "express", "spring", "rails", "laravel",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "sqlite", "neo4j", "clickhouse",
    # Cloud / Infra
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "ansible", "jenkins", "github actions", "circleci", "helm",
    # ML / Data
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "spark", "kafka", "airflow", "dbt", "tableau",
    # Practices / Tools
    "git", "graphql", "rest", "grpc", "microservices", "ci/cd",
    "agile", "tdd", "jwt", "oauth", "linux",
]


def _find_keywords(text: str, keywords: list[str]) -> set[str]:
    found: set[str] = set()
    text_lower = text.lower()
    for kw in keywords:
        escaped = re.escape(kw)
        # Word boundary before keyword; trailing boundary only if keyword ends with a word char
        if kw[-1].isalnum() or kw[-1] == "_":
            pattern = rf"\b{escaped}\b"
        else:
            pattern = rf"\b{escaped}"
        if re.search(pattern, text_lower):
            found.add(kw)
    return found


@router.post("/analyze", response_model=MatcherResponse)
@limiter.limit("20/minute")
def analyze(
    request: Request,
    payload: MatcherRequest,
    current_user: dict = Depends(get_current_user),
) -> MatcherResponse:
    jd_keywords = _find_keywords(payload.job_description, KEYWORDS)
    resume_keywords = _find_keywords(payload.resume, KEYWORDS)
    matched = sorted(jd_keywords & resume_keywords)
    missing = sorted(jd_keywords - resume_keywords)
    score = round(len(matched) / len(jd_keywords), 2) if jd_keywords else 0.0
    return MatcherResponse(matched=matched, missing=missing, score=score)
```

- [ ] **Step 4: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/routers/matcher.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 5: Register router in main.py**

Add to `backend/app/main.py`:

```python
from .routers import matcher as matcher_router
```

And:

```python
app.include_router(matcher_router.router)
```

- [ ] **Step 6: Run matcher tests**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest tests/test_matcher.py -v
```

Expected: all 5 tests PASS

- [ ] **Step 7: Run full test suite**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest -v
```

Expected: all tests PASS (health + auth + applications + analytics + matcher)

- [ ] **Step 8: Commit**

```bash
git add backend/app/routers/matcher.py backend/app/main.py backend/tests/test_matcher.py
git commit -m "feat(backend): /matcher/analyze endpoint with 63-keyword regex engine"
```

---

## Task 13: Final main.py

Verify `main.py` has all four routers registered. After Tasks 9–12 incrementally added each router, main.py should look exactly like this:

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Confirm final main.py content**

`backend/app/main.py` should read:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .limiter import limiter
from .routers import analytics as analytics_router
from .routers import applications as applications_router
from .routers import auth as auth_router
from .routers import matcher as matcher_router

app = FastAPI(
    title="HireTrack API",
    description="Job application tracker REST API",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(applications_router.router)
app.include_router(analytics_router.router)
app.include_router(matcher_router.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m py_compile app/main.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: py_compile every file in the app**

```bash
cd /Users/satya/Projects/hiretrack/backend
for f in app/*.py app/routers/*.py tests/*.py; do
  python -m py_compile "$f" && echo "OK: $f"
done
```

Expected: `OK: <every file>` with no failures.

---

## Task 14: Alembic Setup

**Files:**
- Create: `backend/alembic.ini` (via `alembic init`)
- Modify: `backend/alembic/env.py`

- [ ] **Step 1: Initialize Alembic**

```bash
cd /Users/satya/Projects/hiretrack/backend
alembic init alembic
```

Expected: creates `alembic.ini` and `alembic/` directory with `env.py`, `script.py.mako`, `versions/`.

- [ ] **Step 2: Leave `sqlalchemy.url` as-is in `alembic.ini`**

`env.py` (next step) overrides `sqlalchemy.url` at runtime using `os.environ["DATABASE_URL"]`, so the value in `alembic.ini` is never used. Leave it as the default placeholder generated by `alembic init`.

- [ ] **Step 3: Replace `backend/alembic/env.py` with the following**

```python
import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

load_dotenv()

config = context.config
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from app.models import Base  # noqa: E402 — must come after load_dotenv

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Verify Alembic can load the config**

```bash
cd /Users/satya/Projects/hiretrack/backend
DATABASE_URL=sqlite:///./hiretrack.db alembic current
```

Expected: no error (may show `<no current revision>` which is correct)

- [ ] **Step 5: Commit**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat(backend): Alembic migration setup with autogenerate support"
```

---

## Task 15: Dockerfile and .env.example

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.env.example`

- [ ] **Step 1: Write `backend/.env.example`**

```
DATABASE_URL=postgresql://hiretrack:hiretrack@localhost:5432/hiretrack
SECRET_KEY=changeme-use-a-long-random-string-in-production
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

- [ ] **Step 2: Write `backend/Dockerfile`**

```dockerfile
FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile backend/.env.example
git commit -m "feat(backend): Dockerfile and .env.example"
```

---

## Task 16: Final Validation and Phase 1 Commit

- [ ] **Step 1: py_compile every Python file**

```bash
cd /Users/satya/Projects/hiretrack/backend
for f in app/*.py app/routers/*.py tests/*.py alembic/env.py; do
  python -m py_compile "$f" && echo "OK: $f"
done
```

Expected: every file prints `OK: <path>`

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/satya/Projects/hiretrack/backend
python -m pytest -v --tb=short
```

Expected: all tests pass, no failures.

- [ ] **Step 3: Start the server**

```bash
cd /Users/satya/Projects/hiretrack/backend
uvicorn app.main:app --reload --port 8000
```

Expected: server starts; no import errors in console output.

- [ ] **Step 4: Verify /docs loads all endpoints**

Open `http://localhost:8000/docs` in a browser.

Expected sections visible:
- **health** — `GET /health`
- **auth** — `GET /auth/github`, `GET /auth/github/callback`, `GET /auth/me`
- **applications** — `GET /applications`, `POST /applications`, `GET /applications/{app_id}`, `PATCH /applications/{app_id}`, `DELETE /applications/{app_id}`
- **analytics** — `GET /analytics/funnel`, `GET /analytics/timeline`
- **matcher** — `POST /matcher/analyze`

- [ ] **Step 5: Verify /health**

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: Phase 1 commit**

```bash
cd /Users/satya/Projects/hiretrack
git add backend/
git commit -m "feat(backend): FastAPI with SQLAlchemy, Pydantic v2, JWT auth"
git push origin dev
```

- [ ] **Step 7: Report commit hash**

```bash
git log --oneline -1
```

Show the hash to the user and wait for confirmation before Phase 2.
