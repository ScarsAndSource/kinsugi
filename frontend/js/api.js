// api.js — Kintsugi API client
// All calls go to the FastAPI backend. Auto-detects if served from same host.

const API_BASE = (() => {
  // If page is served by uvicorn on port 8000, stay on same origin
  if (location.port === '8000') return location.protocol + '//' + location.host;
  return 'http://localhost:8000';
})();

async function apiFetch(method, path, body = null) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const API = {
  health:        ()             => apiFetch('GET',  '/api/health'),
  heuristics:    ()             => apiFetch('GET',  '/api/heuristics'),
  newGame:       (p)            => apiFetch('POST', '/api/new', p),
  analyze:       (state)        => apiFetch('POST', '/api/analyze', { state }),
  move:          (state, to)    => apiFetch('POST', '/api/move', { state, to }),
  ai:            (p)            => apiFetch('POST', '/api/ai', p),
  labCompare:    (p)            => apiFetch('POST', '/api/lab/compare', p),
  labTournament: (p)            => apiFetch('POST', '/api/lab/tournament', p),
  labDuel:       (p)            => apiFetch('POST', '/api/lab/duel', p),
};
