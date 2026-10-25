// api.js — Kintsugi API client
// Same-origin by default (FastAPI serves the frontend). Falls back to localhost:8000
// only when opened as a file or from a dev server on another port.

const API_BASE = (() => {
  if (location.protocol === 'file:') return 'http://localhost:8000';
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (local && location.port && location.port !== '8000') return 'http://localhost:8000';
  return '';
})();

async function apiFetch(method, path, body = null) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const d = err.detail;
    const msg = Array.isArray(d) ? d.map(x => x.msg).join('; ') : d;
    throw new Error(msg || `HTTP ${res.status}`);
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
