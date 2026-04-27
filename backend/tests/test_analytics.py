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
