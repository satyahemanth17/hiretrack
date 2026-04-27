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
