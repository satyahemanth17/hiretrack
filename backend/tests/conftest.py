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
