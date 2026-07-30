# Project 4 — Frontend & Backend Integration

**DecodeLabs Industrial Training Kit — Batch 2026**
Track: Optional Mastery Phase — Full Stack Development

## Overview

A working Intern Management dashboard that satisfies every requirement in
the Project 4 brief:

| Requirement (from brief) | Where it's implemented |
|---|---|
| Send requests from frontend to backend | `frontend/app.js` → `apiFetch()`, used by every dashboard action |
| Display dynamic data on UI | `renderInterns()` / `renderStats()` — DOM built from live API responses |
| Handle basic errors and responses | `apiFetch()` enforces `response.ok`; every caller wraps in try/catch/finally |

Beyond the minimum, it also demonstrates every specific pattern the
accompanying slide deck calls out — REST semantics, async/await, CORS,
JSON serialization, HTTP status-code discipline, and the "junior → senior"
fixes on slide 16 — described in detail in `docs/technical_report.md`.

## Architecture

```
┌─────────────────────┐        HTTP / JSON        ┌──────────────────────┐
│   Frontend (browser) │ ─────────────────────────▶ │   Backend (Flask)    │
│   index.html          │ ◀───────────────────────── │   app.py              │
│   style.css            │      fetch() + async/await │   in-memory data store │
│   app.js                │                          │   /api/interns (CRUD)  │
└─────────────────────┘                            │   /api/stats            │
                                                     │   /api/flaky (demo)     │
                                                     └──────────────────────┘
```

The Flask app serves the static frontend AND the JSON API from the same
origin (`http://localhost:5000`), so there's zero CORS friction to run it
locally — but the API layer still implements CORS headers by hand
(`add_cors_headers` in `app.py`) so the mechanism is visible and the API
could serve a separately-hosted frontend without changes.

## Project Structure

```
fullstack_project4/
├── README.md
├── backend/
│   ├── app.py              # Flask REST API (the "Cognitive Vault")
│   └── requirements.txt
├── frontend/
│   ├── index.html          # dashboard shell (the "Sensory Interface")
│   ├── style.css
│   └── app.js               # fetch-based API integration + rendering
├── tests/
│   └── test_api.py         # 13 automated tests, stdlib unittest only
└── docs/
    └── technical_report.md # design rationale, mapped to the brief's own concepts
```

## Setup & Run

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000** — the dashboard, API, and static
assets are all served from that one address.

### Run the tests

```bash
cd tests
python3 test_api.py -v
```

No `pytest` or other third-party test runner required — everything here
runs on Flask + the Python standard library.

## API Reference

| Method | Path | Purpose | Success | Notes |
|---|---|---|---|---|
| GET | `/api/interns` | List all interns | 200 | |
| GET | `/api/interns/<id>` | Fetch one intern | 200 | 404 if missing |
| POST | `/api/interns` | Create an intern | 201 | 422 on validation failure, 400 on malformed JSON |
| PUT | `/api/interns/<id>` | Replace an intern (all fields required) | 200 | Idempotent |
| PATCH | `/api/interns/<id>` | Partially update an intern | 200 | Only sent fields change |
| DELETE | `/api/interns/<id>` | Remove an intern | 204 | Idempotent in effect; 404 on a repeat call |
| GET | `/api/stats` | Aggregate counts by status | 200 | Fetched in parallel with `/api/interns` on load |
| GET | `/api/flaky` | ~50% failure rate, on purpose | 200 or 500 | Used by the "Simulate Network Failure" button |

Every error response shares one shape: `{"error": {"message": "...", "status": <int>}}`,
so the frontend only needs one code path to read any failure.

## What the UI demonstrates

- **Live connection indicator** — pings the backend on load and reflects
  real connectivity, not a static label.
- **Parallel data loading** — the intern list and dashboard stats are
  fetched together via `Promise.all`, not one-after-another.
- **Optimistic-safe mutations** — the "Add Intern" button disables itself
  and shows a pending label while the request is in flight, so a slow
  network can't produce a duplicate submission.
- **Simulate Network Failure** button — deliberately calls an endpoint
  that fails about half the time, to prove the error path actually works
  end-to-end rather than only being exercised by an unplugged cable.
- **No blank-screen failures** — every failure path surfaces a toast with
  a specific, actionable message.
