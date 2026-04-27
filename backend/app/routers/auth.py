from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..auth import (
    GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI,
    create_access_token,
    decode_token,
    exchange_github_code,
)
from ..limiter import limiter
from ..schemas import TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# HTTPBearer with auto_error=False so we can raise 403 (not 401) when the
# Authorization header is absent — matching the OpenAPI security convention.
_bearer = HTTPBearer(auto_error=False)


async def _get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated",
        )
    return decode_token(credentials.credentials)


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
async def get_me(current_user: dict = Depends(_get_current_user)) -> UserResponse:
    return UserResponse(
        id=int(current_user["sub"]),
        login=current_user["login"],
        email=current_user.get("email"),
        avatar_url=current_user.get("avatar_url"),
    )
