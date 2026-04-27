from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .limiter import limiter
from .routers import analytics as analytics_router
from .routers import auth as auth_router
from .routers import applications as applications_router

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


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
