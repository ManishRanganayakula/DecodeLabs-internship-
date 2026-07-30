# Technical Report — Project 4: Frontend & Backend Integration

**Author:** Vishal Kumar · **Program:** DecodeLabs Industrial Training Kit, Batch 2026
**Track:** Optional Mastery Phase — Full Stack · **Status:** Milestone Passed

---

## 1. Problem Statement

Projects 1–3 in this program each dealt with isolated pieces: UI design,
databases, standalone APIs. Project 4's objective is integration — proving
that a frontend and backend can be wired into one coherent system where
data flows from a server, across a network, into a browser's DOM, and
back again on user action.

## 2. The IPO Model, Applied to a Network

The brief frames the system as Input → Process → Output across two
machines connected by a network:

1. **Input (client):** the browser initiates an HTTP request — e.g.
   `fetch('/api/interns')` — carrying method, headers, and (for
   mutations) a JSON body.
2. **Process (server):** `app.py` routes the request, validates the
   payload against `VALID_ROLES` / `VALID_STATUSES`, mutates or reads the
   in-memory store, and serializes a response.
3. **Output (client):** the browser receives the response and
   `renderInterns()` / `renderStats()` translate it into DOM updates.

Both machines communicate over stateless request/reply cycles — no
session state is held server-side between calls, matching the brief's
"Core Rule" on statelessness.

## 3. REST Semantics and Idempotency

Every route in `app.py` follows the HTTP Method Diagnostic Matrix from the
brief:

| Method | Used for | Idempotent? | Implementation detail |
|---|---|---|---|
| GET | Read | Yes | No side effects, ever |
| POST | Create | No | Each call appends a new intern with a fresh UUID |
| PUT | Full replace | Yes | `replace_intern()` requires all four fields |
| PATCH | Partial update | No (by nature of partial merge) | `patch_intern()` merges only sent keys |
| DELETE | Remove | Yes (in effect) | Repeat calls return 404, not a second success — tested explicitly in `test_delete_then_404_on_second_delete` |

URIs use nouns (`/api/interns`), not verbs (`/api/getInterns`), per the
brief's REST rule.

## 4. Asynchronous Execution: Why `async/await`, Never Bare `.then()`

JavaScript is single-threaded — a blocking wait for a network response
would freeze the whole page. `app.js` uses `async/await` exclusively
(no `.then()` chains) for the readability reason the brief gives directly:
deep `.then()` nesting harms readability, while `await` inside an
`async function` reads top-to-bottom like synchronous code while still
yielding the main thread during the actual wait.

## 5. Named Anti-Patterns, and Their Fixes (Brief Slide 16)

This implementation was built specifically to avoid every mistake the
brief calls out:

| Anti-pattern | Where it would bite | Fix applied here |
|---|---|---|
| Forgetting `await` | UI renders `[object Promise]` | Every `fetch`/`.json()` call is awaited; verified functionally by the dashboard actually rendering real data, not a Promise object |
| `await` inside a `for` loop | Serializes independent requests (10 requests = 10x latency) | `loadDashboard()` fetches interns + stats via `Promise.all`, in parallel |
| Assuming a non-2xx response is safe to parse as data | App crashes trying to parse an HTML error page as JSON | `apiFetch()` checks `response.ok` **before** calling `.json()` on the success path, and separately guards the error-body parse in a nested `try/catch` |
| `console.log(error)` only, in production | Errors vanish without a trace | `logError()` is the single centralized log point (stand-in for a real service like Sentry); paired with a **visible** toast so the user isn't left with a blank screen |

## 6. Defensive Programming: `try / catch / finally`

Every network-triggering function (`loadDashboard`, `handleCreateIntern`,
`deleteIntern`, `handleFlakyDemo`) follows the same shield pattern from
the brief:

```
try {
    // the request that might fail
} catch (error) {
    logError(...);       // no silent failures
    showToast(...);      // actionable message, not a blank screen
} finally {
    // always runs: clear loading state / re-enable button
}
```

`finally` is what guarantees a loading spinner or disabled submit button
can never get stuck "on" — regardless of whether the request succeeded,
failed, or threw before even reaching the network.

## 7. JSON Serialization Boundary

Data only ever travels the wire as text. `app.py` uses Flask's `jsonify`
for outbound serialization and `request.get_json(silent=True)` for
inbound parsing — `silent=True` specifically so a malformed body produces
a controlled `400`, rather than an unhandled exception surfacing as a raw
500. On the frontend, `JSON.stringify(payload)` serializes outgoing
mutations, and `response.json()` deserializes responses only after the
`response.ok` gate has passed.

## 8. CORS, Implemented by Hand

`flask-cors` was deliberately **not** used, so the exact mechanism the
brief describes — the `Access-Control-Allow-*` headers, and the browser's
automatic `OPTIONS` preflight for state-changing requests — is visible in
`app.py`'s `add_cors_headers` hook and the explicit `preflight()` handler,
rather than hidden behind a library.

## 9. HTTP Status Code Discipline

`app.py`'s error handling distinguishes:

- **400** — the request body wasn't even valid JSON (a *format* problem)
- **422** — the JSON was valid but failed business rules, like an
  unrecognized `role` (a *semantic* problem)
- **404** — the referenced intern doesn't exist
- **500** — an unhandled server-side failure (exercised deliberately by
  `/api/flaky`)

This mirrors the brief's own distinction between 400 ("invalid format")
and 422 ("semantic error") rather than collapsing every client mistake
into a single generic 400.

## 10. Security Note: `textContent` Over `innerHTML`

Every place `app.js` injects data that originated from user input or the
server — intern names, roles, statuses — uses `textContent` (see
`renderInterns()`), never `innerHTML`. This follows the brief's XSS
warning directly: `innerHTML` would let a value like
`<img src=x onerror=alert(1)>` execute as markup; `textContent` renders
it as inert text, always.

## 11. Validation Summary

`tests/test_api.py` (13 tests, stdlib `unittest`, zero third-party
dependencies) covers: every CRUD path, both validation failure modes
(400 vs 422), 404 handling, PATCH-vs-PUT field-scoping behavior,
delete-then-404 idempotency, the CORS header, the preflight response, and
the shared error-body shape. All 13 pass.

## 12. Limitations and Future Work

- The data store is in-memory and resets on server restart — a real
  deployment would swap it for a database, which the code is already
  structured for (`find_intern` and friends are the only functions that
  would need to change).
- No authentication layer exists yet; the brief's HTTP status table
  includes `401`/`403`, which this project doesn't currently trigger —
  a natural next milestone would be adding token-based auth and wiring
  those codes in for real.
- The frontend polls nothing and has no websocket/real-time layer; stats
  update only on explicit refresh or after a mutation, which is
  appropriate for this scope but would be the next thing to add for a
  live multi-user dashboard.
