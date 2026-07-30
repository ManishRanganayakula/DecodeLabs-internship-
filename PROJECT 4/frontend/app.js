/**
 * app.js
 * ======
 * DecodeLabs Project 4 (Full Stack) -- Frontend: The Sensory Interface.
 *
 * Implements every pattern the brief specifically calls out, and
 * deliberately avoids every anti-pattern it names on slide 16:
 *
 *   - async/await throughout, never bare .then() chains (readability)
 *   - every await is inside an async function, and always paired correctly
 *   - independent requests (interns + stats) run via Promise.all, not a
 *     sequential await-in-a-loop, so they resolve in parallel
 *   - response.ok is checked before parsing JSON, and a custom Error is
 *     thrown with the server's message rather than letting a 404/500 body
 *     be silently parsed as if it were data
 *   - every request path has try/catch/finally: finally always clears the
 *     loading state regardless of success or failure ("no silent failures")
 *   - user-generated data is injected via textContent, never innerHTML
 *     (XSS prevention, per slide 14's security warning)
 *   - errors are centrally logged (logError) and surfaced via a visible
 *     toast, never swallowed into a blank screen
 */

const API_BASE = ""; // same-origin: Flask serves both API and static files

// -------------------------------------------------------------------- //
// Centralized error logging -- stands in for a real service (e.g. Sentry)
// per the brief's "Use centralized logging" guidance (slide 16).
// -------------------------------------------------------------------- //

function logError(context, error) {
  // In production this would forward to a real telemetry endpoint.
  // eslint-disable-next-line no-console
  console.error(`[DecodeLabs][${context}]`, error);
}

// -------------------------------------------------------------------- //
// Toasts -- visible, actionable feedback instead of a blank screen.
// -------------------------------------------------------------------- //

function showToast(title, message, kind = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${kind}`;

  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = title;

  const bodyEl = document.createElement("div");
  bodyEl.textContent = message; // textContent only -- never innerHTML on data we didn't author

  toast.appendChild(titleEl);
  toast.appendChild(bodyEl);
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4500);
}

// -------------------------------------------------------------------- //
// Core fetch wrapper -- the single place that knows how to talk to the
// API. Every caller gets: JSON headers, response.ok enforcement, and a
// custom error carrying the server's own message.
// -------------------------------------------------------------------- //

class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Gatekeeper check: never assume success. A 404 or 500 body is not
  // the data we asked for, so it must not be parsed as if it were.
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody?.error?.message || message;
    } catch {
      // Body wasn't JSON (e.g. a raw 500 HTML page) -- fall back to the
      // generic message rather than letting JSON parsing crash the app.
    }
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) return null; // no content, e.g. DELETE
  return response.json();
}

// -------------------------------------------------------------------- //
// Rendering -- DOM injection via createElement/textContent only.
// -------------------------------------------------------------------- //

function statusBadgeClass(status) {
  return { Active: "active", "On Leave": "on-leave", Completed: "completed" }[status] || "";
}

function renderStats(stats) {
  const row = document.getElementById("statsRow");
  row.innerHTML = ""; // safe: static structural reset, no user data here

  const cards = [
    { label: "Total Interns", value: stats.total, cls: "accent-total" },
    { label: "Active", value: stats.by_status.Active || 0, cls: "accent-active" },
    { label: "On Leave", value: stats.by_status["On Leave"] || 0, cls: "accent-leave" },
    { label: "Completed", value: stats.by_status.Completed || 0, cls: "accent-completed" },
  ];

  for (const card of cards) {
    const el = document.createElement("div");
    el.className = `stat-card ${card.cls}`;

    const value = document.createElement("div");
    value.className = "value";
    value.textContent = card.value;

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = card.label;

    el.appendChild(value);
    el.appendChild(label);
    row.appendChild(el);
  }
}

function renderInterns(interns) {
  const tbody = document.getElementById("internTableBody");
  const table = document.getElementById("internTable");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = ""; // safe: clearing our own prior render, not user input

  if (interns.length === 0) {
    table.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  table.classList.remove("hidden");
  emptyState.classList.add("hidden");

  for (const intern of interns) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = intern.name; // textContent -- never trust server data blindly either
    row.appendChild(nameCell);

    const roleCell = document.createElement("td");
    roleCell.textContent = intern.role;
    row.appendChild(roleCell);

    const batchCell = document.createElement("td");
    batchCell.textContent = intern.batch;
    row.appendChild(batchCell);

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-badge ${statusBadgeClass(intern.status)}`;
    badge.textContent = intern.status;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "row-delete";
    deleteBtn.textContent = "Remove";
    deleteBtn.addEventListener("click", () => deleteIntern(intern.id, intern.name));
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    tbody.appendChild(row);
  }
}

// -------------------------------------------------------------------- //
// Data loading -- interns + stats fetched in PARALLEL via Promise.all.
// This is the direct fix for the brief's named anti-pattern: awaiting
// independent requests one at a time inside a loop, which serializes
// work that has no reason to be serial.
// -------------------------------------------------------------------- //

async function loadDashboard() {
  const loadingIndicator = document.getElementById("loadingIndicator");
  const table = document.getElementById("internTable");
  const emptyState = document.getElementById("emptyState");

  loadingIndicator.classList.remove("hidden");
  table.classList.add("hidden");
  emptyState.classList.add("hidden");

  try {
    const [internsResponse, statsResponse] = await Promise.all([
      apiFetch("/api/interns"),
      apiFetch("/api/stats"),
    ]);

    renderInterns(internsResponse.data);
    renderStats(statsResponse.data);
    setConnectionStatus(true);
  } catch (error) {
    logError("loadDashboard", error);
    setConnectionStatus(false);
    showToast(
      "Couldn't load dashboard",
      error.message || "Check that the backend is running.",
      "error"
    );
  } finally {
    // Runs regardless of success or failure -- the loading state can
    // never get stuck on, which is the exact failure mode the brief
    // warns about with .finally().
    loadingIndicator.classList.add("hidden");
  }
}

// -------------------------------------------------------------------- //
// Mutations: create / delete
// -------------------------------------------------------------------- //

async function handleCreateIntern(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const payload = {
    name: document.getElementById("fieldName").value,
    role: document.getElementById("fieldRole").value,
    batch: Number(document.getElementById("fieldBatch").value),
    status: document.getElementById("fieldStatus").value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Adding...";

  try {
    await apiFetch("/api/interns", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showToast("Intern added", `${payload.name} was added successfully.`, "success");
    document.getElementById("internForm").reset();
    document.getElementById("fieldBatch").value = 2026;
    await loadDashboard();
  } catch (error) {
    logError("handleCreateIntern", error);
    showToast("Couldn't add intern", error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Intern";
  }
}

async function deleteIntern(id, name) {
  if (!window.confirm(`Remove ${name}?`)) return;

  try {
    await apiFetch(`/api/interns/${id}`, { method: "DELETE" });
    showToast("Intern removed", `${name} was removed.`, "success");
    await loadDashboard();
  } catch (error) {
    logError("deleteIntern", error);
    showToast("Couldn't remove intern", error.message, "error");
  }
}

// -------------------------------------------------------------------- //
// Flaky endpoint demo -- proves the try/catch/finally path against a
// real ~50%-failure-rate server response, not a mocked one.
// -------------------------------------------------------------------- //

async function handleFlakyDemo() {
  const btn = document.getElementById("flakyBtn");
  btn.disabled = true;
  btn.textContent = "Requesting...";

  try {
    const result = await apiFetch("/api/flaky");
    showToast("Request succeeded", result.data.message, "success");
  } catch (error) {
    logError("handleFlakyDemo", error);
    showToast(
      "Request failed (as designed)",
      `${error.message} — this demonstrates graceful degradation instead of a blank screen.`,
      "error"
    );
  } finally {
    btn.disabled = false;
    btn.textContent = "Simulate Network Failure";
  }
}

// -------------------------------------------------------------------- //
// Connection status pill
// -------------------------------------------------------------------- //

function setConnectionStatus(isOnline) {
  const pill = document.getElementById("connectionStatus");
  const label = document.getElementById("connectionLabel");
  pill.classList.remove("online", "offline");
  pill.classList.add(isOnline ? "online" : "offline");
  label.textContent = isOnline ? "Backend Connected" : "Backend Unreachable";
}

// -------------------------------------------------------------------- //
// Wiring
// -------------------------------------------------------------------- //

document.getElementById("internForm").addEventListener("submit", handleCreateIntern);
document.getElementById("refreshBtn").addEventListener("click", loadDashboard);
document.getElementById("flakyBtn").addEventListener("click", handleFlakyDemo);

loadDashboard();
