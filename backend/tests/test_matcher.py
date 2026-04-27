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
