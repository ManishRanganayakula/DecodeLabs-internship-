"""
test_api.py
===========
Automated test suite for the Project 4 backend, built entirely on the
standard library's `unittest` + Flask's built-in test client -- no
extra dependencies to install. Run with:

    cd tests && python3 test_api.py -v
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from app import app as flask_app  # noqa: E402


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        flask_app.config.update(TESTING=True)
        self.client = flask_app.test_client()

    # -- Read endpoints -------------------------------------------------

    def test_list_interns_returns_seed_data(self):
        r = self.client.get("/api/interns")
        self.assertEqual(r.status_code, 200)
        body = r.get_json()
        self.assertEqual(body["count"], len(body["data"]))
        self.assertGreaterEqual(body["count"], 1)

    def test_stats_totals_match_list(self):
        interns = self.client.get("/api/interns").get_json()["data"]
        stats = self.client.get("/api/stats").get_json()["data"]
        self.assertEqual(stats["total"], len(interns))
        self.assertEqual(sum(stats["by_status"].values()), len(interns))

    def test_get_unknown_intern_returns_404(self):
        r = self.client.get("/api/interns/does-not-exist")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.get_json()["error"]["status"], 404)

    # -- Create -----------------------------------------------------------

    def test_create_intern_returns_201_and_persists(self):
        r = self.client.post(
            "/api/interns",
            json={"name": "Test Intern", "role": "Backend", "batch": 2026, "status": "Active"},
        )
        self.assertEqual(r.status_code, 201)
        created = r.get_json()["data"]
        self.assertEqual(created["name"], "Test Intern")

        fetched = self.client.get(f"/api/interns/{created['id']}")
        self.assertEqual(fetched.status_code, 200)

    def test_create_intern_missing_field_returns_422(self):
        r = self.client.post("/api/interns", json={"name": "Incomplete"})
        self.assertEqual(r.status_code, 422)
        self.assertIn("error", r.get_json())

    def test_create_intern_invalid_role_returns_422(self):
        r = self.client.post(
            "/api/interns",
            json={"name": "X", "role": "Astronaut", "batch": 2026, "status": "Active"},
        )
        self.assertEqual(r.status_code, 422)

    def test_create_intern_malformed_json_returns_400(self):
        r = self.client.post("/api/interns", data="not-json", content_type="application/json")
        self.assertEqual(r.status_code, 400)

    # -- Update -----------------------------------------------------------

    def test_patch_updates_single_field_without_touching_others(self):
        created = self.client.post(
            "/api/interns",
            json={"name": "Patch Me", "role": "Frontend", "batch": 2025, "status": "Active"},
        ).get_json()["data"]

        r = self.client.patch(f"/api/interns/{created['id']}", json={"status": "Completed"})
        self.assertEqual(r.status_code, 200)
        updated = r.get_json()["data"]
        self.assertEqual(updated["status"], "Completed")
        self.assertEqual(updated["name"], "Patch Me")  # untouched field survives PATCH

    def test_put_replaces_all_fields(self):
        created = self.client.post(
            "/api/interns",
            json={"name": "Put Me", "role": "Frontend", "batch": 2025, "status": "Active"},
        ).get_json()["data"]

        r = self.client.put(
            f"/api/interns/{created['id']}",
            json={"name": "Replaced", "role": "Data", "batch": 2027, "status": "Completed"},
        )
        self.assertEqual(r.status_code, 200)
        replaced = r.get_json()["data"]
        self.assertEqual(
            replaced,
            {"id": created["id"], "name": "Replaced", "role": "Data",
             "batch": 2027, "status": "Completed"},
        )

    # -- Delete -------------------------------------------------------------

    def test_delete_then_404_on_second_delete(self):
        created = self.client.post(
            "/api/interns",
            json={"name": "Delete Me", "role": "Frontend", "batch": 2025, "status": "Active"},
        ).get_json()["data"]

        first = self.client.delete(f"/api/interns/{created['id']}")
        self.assertEqual(first.status_code, 204)

        second = self.client.delete(f"/api/interns/{created['id']}")
        self.assertEqual(second.status_code, 404)  # already gone

    # -- Cross-cutting concerns ----------------------------------------

    def test_cors_header_present_on_every_response(self):
        r = self.client.get("/api/interns")
        self.assertEqual(r.headers.get("Access-Control-Allow-Origin"), "*")

    def test_preflight_options_request_returns_204(self):
        r = self.client.options("/api/interns")
        self.assertEqual(r.status_code, 204)

    def test_error_responses_share_consistent_shape(self):
        r = self.client.get("/api/interns/missing")
        body = r.get_json()
        self.assertEqual(set(body.keys()), {"error"})
        self.assertEqual(set(body["error"].keys()), {"message", "status"})


if __name__ == "__main__":
    unittest.main(verbosity=2)
