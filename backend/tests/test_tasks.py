def create_task(client, **overrides):
    payload = {
        "title": "Write project brief",
        "notes": "Capture the launch requirements",
        "priority": "high",
        "category": "Work",
        "due_date": "2026-10-10",
    }
    payload.update(overrides)
    return client.post("/api/tasks", json=payload)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_and_get_task_with_notes(client):
    response = create_task(client)
    assert response.status_code == 201
    task = response.json()
    assert task["title"] == "Write project brief"
    assert task["notes"] == "Capture the launch requirements"
    assert task["completed"] is False

    fetched = client.get(f"/api/tasks/{task['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["priority"] == "high"


def test_rejects_blank_title(client):
    response = create_task(client, title="   ")
    assert response.status_code == 422


def test_filter_update_and_delete_task(client):
    first = create_task(client).json()
    create_task(client, title="Buy groceries", priority="low", category="Personal")

    updated = client.patch(
        f"/api/tasks/{first['id']}",
        json={"completed": True, "notes": "Brief approved"},
    )
    assert updated.status_code == 200
    assert updated.json()["completed"] is True
    assert updated.json()["notes"] == "Brief approved"

    completed = client.get("/api/tasks", params={"state": "completed"})
    assert completed.status_code == 200
    assert [task["id"] for task in completed.json()] == [first["id"]]

    deleted = client.delete(f"/api/tasks/{first['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/tasks/{first['id']}").status_code == 404


def test_search_and_stats(client):
    task = create_task(client, due_date="2020-01-01").json()
    create_task(client, title="Plan holiday", notes="Book a quiet cabin")
    client.patch(f"/api/tasks/{task['id']}", json={"completed": True})

    results = client.get("/api/tasks", params={"search": "cabin"})
    assert results.status_code == 200
    assert [item["title"] for item in results.json()] == ["Plan holiday"]

    stats = client.get("/api/stats")
    assert stats.status_code == 200
    assert stats.json() == {
        "total": 2,
        "completed": 1,
        "active": 1,
        "overdue": 0,
        "completion_rate": 50,
    }


def test_missing_task_returns_404(client):
    assert client.patch("/api/tasks/999", json={"completed": True}).status_code == 404
    assert client.delete("/api/tasks/999").status_code == 404
