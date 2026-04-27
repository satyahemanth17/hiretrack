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
