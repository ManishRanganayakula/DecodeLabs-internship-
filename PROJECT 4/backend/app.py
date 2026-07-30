"""
app.py
======
DecodeLabs Project 4 (Full Stack) -- Backend: The Cognitive Vault.

A REST API for an Intern Management System. Deliberately built on raw
Flask (no flask-cors, no ORM) so every mechanism the brief covers --
CORS headers, HTTP status code semantics, idempotency, JSON
serialization -- is visible in the code rather than hidden behind a
library.

Endpoints
---------
GET    /api/interns            list all interns
GET    /api/interns/<id>       fetch one intern
POST   /api/interns            create an intern                (201)
PUT    /api/interns/<id>       replace an intern (full update)  (200)
PATCH  /api/interns/<id>       partial update                   (200)
DELETE /api/interns/<id>       remove an intern                 (204)
GET    /api/stats              aggregate dashboard stats
GET    /api/flaky              intentionally unreliable endpoint,
                                used by the frontend to demonstrate
                                defensive programming (try/catch/finally,
                                graceful degradation) against a real
                                failure rather than a mocked one.

Run
---
    python app.py
    # serves the API on http://localhost:5000
    # and the frontend/ static files on http://localhost:5000/
"""

from __future__ import annotations

import random
import time
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")

VALID_STATUSES = {"Active", "On Leave", "Completed"}
VALID_ROLES = {"Frontend", "Backend", "Full Stack", "AI/ML", "Data"}


# --------------------------------------------------------------------------- #
# In-memory data store (stands in for a database -- swappable later without
# touching the route handlers, since all access goes through the helpers
# below).
# --------------------------------------------------------------------------- #

def _seed() -> list[dict]:
    return [
        {"id": str(uuid.uuid4()), "name": "Vishal Kumar", "role": "Full Stack",
         "batch": 2026, "status": "Active"},
        {"id": str(uuid.uuid4()), "name": "Ananya Rao", "role": "AI/ML",
         "batch": 2026, "status": "Active"},
        {"id": str(uuid.uuid4()), "name": "Rohan Mehta", "role": "Backend",
         "batch": 2026, "status": "On Leave"},
        {"id": str(uuid.uuid4()), "name": "Priya Nair", "role": "Frontend",
         "batch": 2025, "status": "Completed"},
    ]


INTERNS: list[dict] = _seed()


def find_intern(intern_id: str) -> dict | None:
    return next((i for i in INTERNS if i["id"] == intern_id), None)


# --------------------------------------------------------------------------- #
# Error helpers -- consistent JSON error shape across every failure mode,
# so the frontend can rely on a single `error.message` field everywhere.
# --------------------------------------------------------------------------- #

class ApiError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@app.errorhandler(ApiError)
def handle_api_error(err: ApiError):
    response = jsonify({"error": {"message": err.message, "status": err.status_code}})
    response.status_code = err.status_code
    return response


@app.errorhandler(404)
def handle_404(_err):
    response = jsonify({"error": {"message": "Resource not found.", "status": 404}})
    response.status_code = 404
    return response


@app.errorhandler(500)
def handle_500(_err):
    response = jsonify({"error": {"message": "Internal server error.", "status": 500}})
    response.status_code = 500
    return response


def validate_payload(data: dict, *, partial: bool = False) -> None:
    """
    Raises ApiError(422) on semantic validation failures -- distinct from
    400 (malformed request body), matching the brief's status-code table:
    400 = "invalid format", 422 = "semantic error".
    """
    if not partial:
        for field in ("name", "role", "batch", "status"):
            if field not in data:
                raise ApiError(f"Missing required field: '{field}'.", 422)

    if "role" in data and data["role"] not in VALID_ROLES:
        raise ApiError(f"'role' must be one of {sorted(VALID_ROLES)}.", 422)
    if "status" in data and data["status"] not in VALID_STATUSES:
        raise ApiError(f"'status' must be one of {sorted(VALID_STATUSES)}.", 422)
    if "name" in data and not str(data["name"]).strip():
        raise ApiError("'name' cannot be empty.", 422)


# --------------------------------------------------------------------------- #
# CORS -- implemented by hand (not flask-cors) so the mechanism from the
# brief (slide 11) is explicit: every response gets the headers, and
# preflight OPTIONS requests are answered directly.
# --------------------------------------------------------------------------- #

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def preflight(_any):
    # Answers the browser's automatic preflight check before it will send
    # the real request (see brief slide 11: "The Preflight").
    return "", 204


# --------------------------------------------------------------------------- #
# Routes: interns collection
# --------------------------------------------------------------------------- #

@app.route("/api/interns", methods=["GET"], provide_automatic_options=False)
def list_interns():
    return jsonify({"data": INTERNS, "count": len(INTERNS)}), 200


@app.route("/api/interns", methods=["POST"], provide_automatic_options=False)
def create_intern():
    data = request.get_json(silent=True)
    if data is None:
        raise ApiError("Request body must be valid JSON.", 400)
    validate_payload(data)

    intern = {
        "id": str(uuid.uuid4()),
        "name": data["name"].strip(),
        "role": data["role"],
        "batch": data["batch"],
        "status": data["status"],
    }
    INTERNS.append(intern)
    return jsonify({"data": intern}), 201


@app.route("/api/interns/<intern_id>", methods=["GET"], provide_automatic_options=False)
def get_intern(intern_id: str):
    intern = find_intern(intern_id)
    if intern is None:
        raise ApiError(f"No intern found with id '{intern_id}'.", 404)
    return jsonify({"data": intern}), 200


@app.route("/api/interns/<intern_id>", methods=["PUT"], provide_automatic_options=False)
def replace_intern(intern_id: str):
    intern = find_intern(intern_id)
    if intern is None:
        raise ApiError(f"No intern found with id '{intern_id}'.", 404)
    data = request.get_json(silent=True)
    if data is None:
        raise ApiError("Request body must be valid JSON.", 400)
    validate_payload(data, partial=False)

    intern.update({
        "name": data["name"].strip(),
        "role": data["role"],
        "batch": data["batch"],
        "status": data["status"],
    })
    return jsonify({"data": intern}), 200


@app.route("/api/interns/<intern_id>", methods=["PATCH"], provide_automatic_options=False)
def patch_intern(intern_id: str):
    intern = find_intern(intern_id)
    if intern is None:
        raise ApiError(f"No intern found with id '{intern_id}'.", 404)
    data = request.get_json(silent=True)
    if data is None:
        raise ApiError("Request body must be valid JSON.", 400)
    validate_payload(data, partial=True)

    intern.update(data)
    return jsonify({"data": intern}), 200


@app.route("/api/interns/<intern_id>", methods=["DELETE"], provide_automatic_options=False)
def delete_intern(intern_id: str):
    intern = find_intern(intern_id)
    if intern is None:
        raise ApiError(f"No intern found with id '{intern_id}'.", 404)
    INTERNS.remove(intern)
    return "", 204


# --------------------------------------------------------------------------- #
# Routes: dashboard stats (fetched in parallel with the intern list on the
# frontend via Promise.all -- see frontend/app.js)
# --------------------------------------------------------------------------- #

@app.route("/api/stats", methods=["GET"])
def stats():
    total = len(INTERNS)
    by_status = {}
    for intern in INTERNS:
        by_status[intern["status"]] = by_status.get(intern["status"], 0) + 1
    return jsonify({"data": {"total": total, "by_status": by_status}}), 200


# --------------------------------------------------------------------------- #
# Intentionally unreliable endpoint -- used by the frontend's "Simulate
# Network Failure" button to exercise the try/catch/finally path against a
# genuine failure instead of a mocked one.
# --------------------------------------------------------------------------- #

@app.route("/api/flaky", methods=["GET"])
def flaky():
    time.sleep(0.6)  # simulated network latency
    roll = random.random()
    if roll < 0.5:
        raise ApiError("Simulated upstream failure (this is intentional).", 500)
    return jsonify({"data": {"message": "Got through this time.", "roll": round(roll, 3)}}), 200


# --------------------------------------------------------------------------- #
# Static frontend
# --------------------------------------------------------------------------- #

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
