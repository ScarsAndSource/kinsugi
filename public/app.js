"use strict";
/* Kintsugi — game UI. Talks to the FastAPI engine with same-origin /api calls. */

/* ------------------------------------------------------------ helpers */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = n => Number(n).toLocaleString("en-US");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SVGNS = "http://www.w3.org/2000/svg";

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(SVGNS, name);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText || "request failed";
    try {
      const j = await res.json();
      msg = Array.isArray(j.detail) ? j.detail.map(d => d.msg).join("; ") : (j.detail || msg);
    } catch (_) { /* keep status text */ }
    throw new Error(msg);
  }
  return res.json();
}

/* plain-language names for the five ways of judging a position */
const HEUR = {
  mobility:   { name: "Balanced",   desc: "Counts its own jumps minus yours." },
  aggressive: { name: "Aggressive", desc: "Counts its jumps minus twice yours, so it hunts you." },
  defensive:  { name: "Defensive",  desc: "Counts twice its jumps minus yours, so it guards its space." },
  lookahead:  { name: "Look-ahead", desc: "Counts its jumps now plus the jumps those jumps open up." },
  territory:  { name: "Territory",  desc: "Counts the tiles it can reach before you can. Usually the strongest." },
};
const PRESETS = {
  easy:   { heuristic: "mobility",   depth: 1, time: 1000 },
  medium: { heuristic: "aggressive", depth: 4, time: 2000 },
  hard:   { heuristic: "territory",  depth: 6, time: 3000 },
};

/* ------------------------------------------------------------ state */
const G = {
  cfg: null,
  view: null,            // latest position from the server
  views: [],             // views[0] = start, views[k+1] = position after history[k]
  history: [],           // [{player, from, to, ai?}]
  busy: false,           // true while a request or animation owns the turn
  over: false,
  hintBusy: false,
  hintSq: null,
  token: 0,              // bumped on new game / undo / resign so stale replies are ignored
  prevBlocked: new Set(),
  terr: false,
  tilt: false,
  resignArm: 0,
  els: null,
};

/* ------------------------------------------------------------ tabs */
function showTab(name) {
  $$(".tab").forEach(b => b.setAttribute("aria-current", b.dataset.tab === name ? "page" : "false"));
  $("#view-play").hidden = name !== "play";
  $("#view-lab").hidden = name !== "lab";
  try { history.replaceState(null, "", "#" + name); } catch (_) { /* file:// etc. */ }
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------ setup screen */
function renderKnightDemo() {
  const el = $("#knightDemo");
  el.innerHTML = "";
  const hops = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const d = document.createElement("div");
      d.className = "kcell" + ((r + c) % 2 ? " alt" : "");
      if (r === 2 && c === 2) d.classList.add("me");
      else if (hops.some(([dr, dc]) => r === 2 + dr && c === 2 + dc)) d.classList.add("hop");
      el.appendChild(d);
    }
  }
}

function applyPreset(name) {
  const p = PRESETS[name];
  $("#advHeur").value = p.heuristic;
  $("#advDepth").value = p.depth;
  $("#advTime").value = p.time;
  $("#advAlgo").value = "alphabeta";
  $("#advOrder").checked = true;
  syncAdvanced();
}

function syncAdvanced() {
  const algo = $("#advAlgo").value;
  const d = $("#advDepth");
  d.max = algo === "minimax" ? 7 : 10;          // the server caps minimax at 7 too
  if (+d.value > +d.max) d.value = d.max;
  $("#advDepthOut").textContent = d.value;
  $("#advNote").textContent = algo === "minimax"
    ? "Minimax stops at 7 moves ahead. It checks every future, so it slows down fast."
    : "";
  const h = HEUR[$("#advHeur").value];
  $("#heurDesc").textContent = h ? h.name + ": " + h.desc : "";
}

function readConfig() {
  return {
    n: +$("input[name=size]:checked").value,
    holes: +$("#advHoles").value,
    first: +$("#advFirst").value,
    algorithm: $("#advAlgo").value,
    heuristic: $("#advHeur").value,
    depth: +$("#advDepth").value,
    time: +$("#advTime").value,
    ordering: $("#advOrder").checked,
  };
}

function initSetup() {
  $("#advHeur").innerHTML = Object.entries(HEUR).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("");
  applyPreset("medium");
  $$("input[name=diff]").forEach(r => r.addEventListener("change", () => applyPreset(r.value)));
  ["#advAlgo", "#advHeur", "#advDepth"].forEach(s => $(s).addEventListener("input", syncAdvanced));
  $("#setupForm").addEventListener("submit", e => { e.preventDefault(); startGame(); });
  renderKnightDemo();
}

/* ------------------------------------------------------------ starting a game */
async function startGame() {
  const cfg = readConfig();
  const btn = $("#startBtn");
  btn.disabled = true;
  btn.textContent = "Setting the board…";
  $("#setupMsg").textContent = "";
  try {
    const v = await api("/api/new", { n: cfg.n, holes: cfg.holes, seed: null, first: cfg.first });
    G.token++;
    G.cfg = cfg; G.view = v; G.views = [v]; G.history = [];
    G.busy = false; G.over = false; G.hintSq = null; G.hintBusy = false;
    $("#setup").hidden = true;
    $("#game").hidden = false;
    $("#over").hidden = true;
    $("#retryBtn").hidden = true;
    buildBoard(cfg.n);
    render(v, false);
    resetMind("The machine's reasoning shows up here after its first move.");
    if (v.turn === 1) machineMove(0); else setTurnStatus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    $("#setupMsg").textContent = "Couldn't start: " + e.message + ". If the server was asleep, try again in a few seconds.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Start game";
  }
}

/* ------------------------------------------------------------ board construction */
function buildBoard(n) {
  const b = $("#board");
  b.innerHTML = "";
  b.className = "board";
  b.style.setProperty("--n", n);

  const cells = [];
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n), c = i % n;
    const cell = document.createElement("div");
    cell.className = "cell" + ((r + c) % 2 ? " alt" : "");
    cell.dataset.sq = i;
    cell.innerHTML = '<div class="tile"></div><div class="seam"></div><span class="ord"></span>';
    b.appendChild(cell);
    cells.push(cell);
  }

  const svg = svgEl("svg", { class: "overlay", viewBox: `0 0 ${n} ${n}`, preserveAspectRatio: "none" });
  const gTrail = svgEl("g"), gHover = svgEl("g"), gThread = svgEl("g");
  svg.append(gTrail, gHover, gThread);
  b.appendChild(svg);

  const me = document.createElement("div"); me.className = "piece me";
  const ai = document.createElement("div"); ai.className = "piece ai";
  [me, ai].forEach(p => p.addEventListener("animationend", () => p.classList.remove("hop")));
  b.append(me, ai);

  G.els = { n, cells, svg, gTrail, gHover, gThread, me, ai };
  G.prevBlocked = new Set();
  $("#boardWrap").classList.toggle("tilt", G.tilt);
  b.classList.toggle("terr", G.terr);
}

function initBoardEvents() {
  const b = $("#board");
  b.addEventListener("click", e => {
    const c = e.target.closest(".cell");
    if (c) humanMove(+c.dataset.sq);
  });
  b.addEventListener("mouseover", e => {
    const c = e.target.closest(".cell");
    if (c && c.classList.contains("legal")) drawHover(+c.dataset.sq); else clearHover();
  });
  b.addEventListener("mouseleave", clearHover);
}

/* ------------------------------------------------------------ geometry helpers */
const rcOf = sq => [Math.floor(sq / G.els.n), sq % G.els.n];
const labelOf = sq => { const [r, c] = rcOf(sq); return String.fromCharCode(97 + c) + (G.els.n - r); };

/* the L-shaped knight hop, as an svg path through the elbow */
function hopPath(a, b) {
  const [ra, ca] = rcOf(a), [rb, cb] = rcOf(b);
  const vertFirst = Math.abs(rb - ra) === 2;
  const ex = vertFirst ? ca + 0.5 : cb + 0.5;
  const ey = vertFirst ? rb + 0.5 : ra + 0.5;
  return `M${ca + 0.5} ${ra + 0.5} L${ex} ${ey} L${cb + 0.5} ${rb + 0.5}`;
}

/* smooth curve through a list of [x, y] points */
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
  }
  const L = pts[pts.length - 1];
  return d + ` L${L[0]} ${L[1]}`;
}

/* ------------------------------------------------------------ rendering */
function place(el, sq, animate) {
  const n = G.els.n;
  const r = Math.floor(sq / n), c = sq % n;
  const left = ((c + 0.5) / n * 100) + "%", top = ((r + 0.5) / n * 100) + "%";
  const moved = el.style.left !== left || el.style.top !== top;
  el.style.width = (100 / n * 0.56) + "%";
  el.style.left = left;
  el.style.top = top;
  if (animate && moved) { el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop"); }
}

function humanCanMove() {
  return !!G.view && G.view.turn === 0 && !G.view.game_over && !G.busy && !G.over;
}

/* only the glowing "you can land here" and hint highlights */
function refreshHighlights() {
  if (!G.els) return;
  const legal = new Set(humanCanMove() ? G.view.legal_moves : []);
  G.els.cells.forEach((cell, i) => {
    cell.classList.toggle("legal", legal.has(i));
    cell.classList.toggle("hint", G.hintSq === i && humanCanMove());
  });
  $("#hintBtn").disabled = !humanCanMove() || G.hintBusy;
  $("#undoBtn").disabled = G.busy;
}

function render(view, animate) {
  const { cells, me, ai } = G.els;
  const blocked = new Set(view.state.blocked);
  const owner = view.territory.owner;

  cells.forEach((cell, i) => {
    const was = G.prevBlocked.has(i), is = blocked.has(i);
    const o = owner[i];
    if (o === 0 || o === 1) cell.dataset.o = o; else delete cell.dataset.o;

    if (is && !was && animate) {
      cell.classList.remove("hole");
      cell.classList.add("breaking");
      setTimeout(() => {
        if (!G.prevBlocked.has(i)) return;     // undone in the meantime
        cell.classList.remove("breaking");
        cell.classList.add("hole");
      }, 1450);
    } else if (is) {
      if (!animate || !cell.classList.contains("breaking")) {
        cell.classList.remove("breaking");
        cell.classList.add("hole");
      }
    } else {
      cell.classList.remove("hole", "breaking");
    }
  });
  G.prevBlocked = blocked;

  place(me, view.state.pos[0], animate);
  place(ai, view.state.pos[1], animate);

  $("#mMe").textContent = view.mobility[0];
  $("#mAi").textContent = view.mobility[1];
  $("#mFree").textContent = view.free_squares;
  refreshHighlights();
}

function setStatus(title, sub = "") {
  $("#statusTitle").textContent = title;
  $("#statusSub").textContent = sub;
}

function setTurnStatus() {
  const v = G.view;
  let sub = "Tap a glowing tile to jump there.";
  if (v.mobility[0] === 1) sub = "Only one jump is open to you.";
  else if (G.terr) sub = "Tinted tiles show who can reach them first.";
  setStatus("Your turn.", sub);
}

function setThinking(on) {
  $("#board").classList.toggle("thinking", on);
}

/* ------------------------------------------------------------ hover preview and thought threads */
function clearHover() { if (G.els) G.els.gHover.innerHTML = ""; }

function drawHover(sq) {
  clearHover();
  if (!humanCanMove()) return;
  G.els.gHover.appendChild(svgEl("path", { d: hopPath(G.view.state.pos[0], sq), class: "hoverpath" }));
}

function showThreads(res) {
  const g = G.els.gThread;
  g.classList.remove("fadeout");
  g.style.opacity = "";
  g.innerHTML = "";
  const list = [...res.root_moves].sort((a, b) => b.score - a.score);
  list.forEach((m, i) => {
    const rank = list.length > 1 ? 1 - i / (list.length - 1) : 1;   // 1 = best, 0 = worst
    const chosen = m.move === res.move.to;
    const p = svgEl("path", {
      d: hopPath(res.move.from, m.move),
      class: "thread" + (chosen ? " pick" : ""),
      "stroke-width": (1 + 2.8 * rank).toFixed(2),
    });
    p.style.opacity = chosen ? 1 : (0.25 + 0.5 * rank).toFixed(2);
    g.appendChild(p);
  });
}

function clearThreads() {
  if (!G.els) return;
  G.els.gThread.innerHTML = "";
  G.els.gThread.classList.remove("fadeout");
  G.els.gThread.style.opacity = "";
}

/* ------------------------------------------------------------ the human's move */
async function humanMove(sq) {
  const v = G.view;
  if (!humanCanMove() || !v.legal_moves.includes(sq)) return;
  const token = G.token;
  G.busy = true; G.hintSq = null;
  clearHover(); clearThreads(); refreshHighlights();

  let res;
  try {
    res = await api("/api/move", { state: v.state, to: sq });
  } catch (e) {
    if (token !== G.token) return;
    G.busy = false;
    refreshHighlights();
    setStatus("That jump didn't go through.", e.message + ". Try again.");
    return;
  }
  if (token !== G.token) return;

  G.history.push({ player: 0, from: res.move.from, to: res.move.to });
  G.view = res;
  G.views.push(res);
  render(res, true);
  if (res.game_over) { finish(res.winner); return; }
  machineMove(0);
}

/* ------------------------------------------------------------ the machine's move */
async function machineMove(attempt) {
  const token = G.token;
  G.busy = true;
  $("#retryBtn").hidden = true;
  setThinking(true);
  refreshHighlights();
  setStatus("The machine is thinking…", `Looking up to ${G.cfg.depth} jumps ahead.`);

  let res;
  try {
    res = await api("/api/ai", {
      state: G.view.state,
      algorithm: G.cfg.algorithm,
      heuristic: G.cfg.heuristic,
      depth: G.cfg.depth,
      ordering: G.cfg.ordering ? "heuristic" : "none",
      iterative: true,
      time_limit_ms: G.cfg.time,
      trace_depth: 0,
    });
  } catch (e) {
    if (token !== G.token) return;
    if (attempt < 2) {                      // cold start or a network blip: quietly try again
      await sleep(1500 * (attempt + 1));
      if (token !== G.token) return;
      return machineMove(attempt + 1);
    }
    setThinking(false);
    G.busy = false;
    refreshHighlights();
    setStatus("The machine tripped over something.", e.message);
    $("#retryBtn").hidden = false;
    return;
  }
  if (token !== G.token) return;

  // let the player see what the machine was weighing, then move
  showThreads(res);
  updateMind(res);
  await sleep(1100);
  if (token !== G.token) return;
  G.els.gThread.classList.add("fadeout");
  setTimeout(() => { if (token === G.token) clearThreads(); }, 600);
  setThinking(false);

  G.history.push({
    player: 1, from: res.move.from, to: res.move.to,
    ai: { nodes: res.stats.nodes, depth: res.depth_completed },
  });
  G.view = res.view;
  G.views.push(res.view);
  G.busy = false;
  render(res.view, true);
  if (res.view.game_over) { finish(res.view.winner); return; }
  setTurnStatus();
}

/* ------------------------------------------------------------ hint, undo, resign, toggles */
async function hint() {
  if (!humanCanMove() || G.hintBusy) return;
  const v = G.view, token = G.token;
  G.hintBusy = true;
  $("#hintBtn").textContent = "Thinking…";
  refreshHighlights();
  try {
    const r = await api("/api/ai", {
      state: v.state, algorithm: "alphabeta", heuristic: "territory", depth: 6,
      ordering: "heuristic", iterative: true, time_limit_ms: 1500, trace_depth: 0,
    });
    if (token === G.token && G.view === v && humanCanMove()) {
      G.hintSq = r.move.to;
      setStatus("Your turn.", "The pulsing tile is a strong jump.");
    }
  } catch (e) {
    if (token === G.token) setStatus("Your turn.", "Couldn't fetch a hint: " + e.message);
  } finally {
    G.hintBusy = false;
    $("#hintBtn").textContent = "Hint";
    refreshHighlights();
  }
}

function undo() {
  if (G.busy || !G.view) return;
  let j = -1;
  for (let k = G.views.length - 2; k >= 0; k--) {
    if (G.views[k].turn === 0) { j = k; break; }
  }
  if (j < 0) { setStatus(G.over ? $("#statusTitle").textContent : "Your turn.", "Nothing to undo yet."); return; }

  G.token++;
  G.views = G.views.slice(0, j + 1);
  G.history = G.history.slice(0, j);
  G.view = G.views[j];
  G.over = false; G.hintSq = null; G.hintBusy = false;
  $("#over").hidden = true;
  $("#retryBtn").hidden = true;
  $("#board").classList.remove("over");
  G.els.cells.forEach(c => { c.querySelector(".ord").textContent = ""; });
  G.els.gTrail.innerHTML = "";
  clearThreads(); clearHover(); setThinking(false);
  render(G.view, false);
  resetMind("Undone. The machine's reasoning updates after its next move.");
  setTurnStatus();
}

function resign() {
  if (G.over || !G.view) return;
  const b = $("#resignBtn");
  if (!G.resignArm) {
    G.resignArm = 1;
    b.textContent = "Sure? Click again";
    setTimeout(() => { G.resignArm = 0; b.textContent = "Give up"; }, 3000);
    return;
  }
  G.resignArm = 0;
  b.textContent = "Give up";
  G.token++;
  clearThreads();
  finish(1, true);
}

function toggleTilt() {
  G.tilt = !G.tilt;
  $("#boardWrap").classList.toggle("tilt", G.tilt);
  $("#tiltBtn").setAttribute("aria-pressed", G.tilt);
}

function toggleTerr() {
  G.terr = !G.terr;
  if (G.els) $("#board").classList.toggle("terr", G.terr);
  $("#terrBtn").setAttribute("aria-pressed", G.terr);
  $("#terrKey").hidden = !G.terr;
  if (G.view && !G.over && humanCanMove()) setTurnStatus();
}

function newGame() {
  G.token++;
  G.busy = false;
  setThinking(false);
  $("#game").hidden = true;
  $("#setup").hidden = false;
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------ game over */
function aiTotals() {
  const ai = G.history.filter(h => h.ai);
  const nodes = ai.reduce((s, h) => s + h.ai.nodes, 0);
  const depth = ai.length ? ai.reduce((s, h) => s + h.ai.depth, 0) / ai.length : 0;
  return { nodes, depth, moves: ai.length };
}

function drawTrails() {
  const { n, gTrail } = G.els;
  gTrail.innerHTML = "";
  const start = G.views[0].state.pos;
  const mine = [start[0]], its = [start[1]];
  G.history.forEach(h => (h.player === 0 ? mine : its).push(h.to));
  [[mine, "me"], [its, "ai"]].forEach(([path, cls]) => {
    const pts = path.map(s => [(s % n) + 0.5, Math.floor(s / n) + 0.5]);
    if (pts.length > 1) gTrail.appendChild(svgEl("path", { d: smoothPath(pts), class: "trail " + cls }));
  });
}

function finish(winner, resigned = false) {
  G.over = true;
  G.busy = false;
  G.hintSq = null;
  setThinking(false);
  refreshHighlights();
  clearHover();

  $("#board").classList.add("over");
  G.history.forEach((h, i) => { G.els.cells[h.from].querySelector(".ord").textContent = i + 1; });
  drawTrails();

  const won = winner === 0;
  const title = resigned ? "You gave up." : won ? "You outlasted it." : "It outlasted you.";
  const text = resigned ? "Every tile you left is still broken. Start fresh whenever you like."
    : won ? "The machine had no jump left."
    : "You had no jump left.";
  setStatus(title, text);

  const t = aiTotals();
  $("#overTitle").textContent = title;
  $("#overText").textContent = text;
  $("#fMoves").textContent = G.history.length;
  $("#fTiles").textContent = G.view.state.blocked.length;
  $("#fNodes").textContent = t.moves ? fmt(t.nodes) : "0";
  $("#over").hidden = false;
  $("#over").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ------------------------------------------------------------ "under the hood" panel */
function scoreText(s) {
  if (Math.abs(s) >= 9000) return s > 0 ? "win" : "loss";
  return (s > 0 ? "+" : "") + s.toFixed(1);
}

function resetMind(msg) {
  $("#mindBody").innerHTML = `<p class="note">${esc(msg)}</p>`;
}

function updateMind(res) {
  const algo = res.algorithm === "alphabeta" ? "Alpha-beta" : "Minimax";
  const ord = res.algorithm === "alphabeta" && res.ordering === "heuristic" ? ", promising moves first" : "";
  const done = res.depth_completed, asked = res.depth_used;
  const ahead = done + (done === 1 ? " jump" : " jumps") + (done < asked ? ` (asked for ${asked}, ran out of time)` : "");
  const h = HEUR[res.heuristic] ? HEUR[res.heuristic].name : res.heuristic;

  const rows = [...res.root_moves].sort((a, b) => b.score - a.score);
  const rowHtml = rows.map((m, i) => {
    const pct = rows.length > 1 ? Math.max(8, Math.round(100 * (1 - i / (rows.length - 1)))) : 100;
    const pick = m.move === res.move.to;
    const txt = (m.exact ? "" : "≤ ") + scoreText(m.score);
    return `<div class="mrow${pick ? " pick" : ""}"><span>${labelOf(m.move)}</span><span class="bar1"><i style="width:${pct}%"></i></span><span>${txt}</span></div>`;
  }).join("");

  const iters = res.iterations.filter(i => i.completed);
  const maxN = Math.max(1, ...iters.map(i => i.nodes));
  const iterHtml = iters.map(i => {
    const pct = Math.max(4, Math.round(100 * Math.log10(i.nodes + 1) / Math.log10(maxN + 1)));
    return `<div class="mrow"><span>d${i.depth}</span><span class="bar1"><i style="width:${pct}%"></i></span><span>${fmt(i.nodes)}</span></div>`;
  }).join("");

  $("#mindBody").innerHTML = `
    <p class="note">The machine tries each jump, then each of your replies, a few jumps deep, and scores where that leaves everyone.${res.algorithm === "alphabeta" ? " Alpha-beta skips lines that can't beat what it already found." : ""}</p>
    <dl class="kv">
      <dt>Search</dt><dd>${algo}${ord}</dd>
      <dt>Judges by</dt><dd>${esc(h)}</dd>
      <dt>Looked ahead</dt><dd>${esc(ahead)}</dd>
      <dt>Positions checked</dt><dd>${fmt(res.stats.nodes)}</dd>
      <dt title="Each cut-off is a moment alpha-beta proved the rest of a branch pointless.">Cut-offs</dt><dd>${fmt(res.stats.cutoffs)}</dd>
      <dt>Thinking time</dt><dd>${fmt(Math.round(res.stats.time_ms))} ms</dd>
      <dt>Its score</dt><dd>${scoreText(res.score)}</dd>
    </dl>
    <h4>Jumps it considered</h4>
    ${rowHtml}
    <p class="note">A "≤" means alpha-beta only proved the score is at most that, which is enough to rule the jump out.</p>
    <h4>Positions checked at each depth</h4>
    ${iterHtml}`;
}

/* ------------------------------------------------------------ save a picture (PNG) */
function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
}

async function savePoster() {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) { /* fine */ } }
  const n = G.els.n, W = 1080, M = 96, OY = 150, grid = W - 2 * M, cs = grid / n, H = OY + grid + 250;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  const sx = i => M + (i % n) * cs, sy = i => OY + Math.floor(i / n) * cs;
  const cx = i => sx(i) + cs / 2, cy = i => sy(i) + cs / 2;

  x.fillStyle = "#0E0D0C"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#E8E1D4"; x.font = '300 58px Fraunces, Georgia, serif'; x.textBaseline = "alphabetic";
  x.fillText("Kintsugi", M, 104);

  const blocked = new Set(G.view.state.blocked);
  const order = {};
  G.history.forEach((h, i) => { order[h.from] = i + 1; });

  for (let i = 0; i < n * n; i++) {
    const X = sx(i) + cs * 0.035, Y = sy(i) + cs * 0.035, S = cs * 0.93;
    if (blocked.has(i)) {
      roundRect(x, X, Y, S, S, 6); x.fillStyle = "rgba(0,0,0,.55)"; x.fill();
      // deterministic gold seam, different on every tile
      const rnd = k => { const t = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return t - Math.floor(t); };
      x.save();
      x.strokeStyle = "rgba(201,162,75,.8)"; x.lineWidth = 2.4; x.lineCap = "round"; x.lineJoin = "round";
      x.beginPath(); x.moveTo(X + S * (0.1 + 0.2 * rnd(1)), Y + S * 0.06);
      for (let k = 0; k < 5; k++) x.lineTo(X + S * (0.15 + 0.7 * rnd(k * 2 + 2)), Y + S * (0.2 + 0.15 * k + 0.05 * rnd(k * 2 + 3)));
      x.stroke();
      x.restore();
      if (order[i]) {
        x.fillStyle = "rgba(232,225,212,.85)"; x.font = '500 20px "IBM Plex Mono", monospace'; x.textAlign = "center";
        x.fillText(String(order[i]), X + S / 2, Y + S * 0.9);
        x.textAlign = "left";
      }
    } else {
      const g = x.createLinearGradient(X, Y, X + S, Y + S);
      const alt = (Math.floor(i / n) + (i % n)) % 2;
      g.addColorStop(0, alt ? "#35312f" : "#2c2928"); g.addColorStop(1, alt ? "#242120" : "#1d1b1a");
      roundRect(x, X, Y, S, S, 6); x.fillStyle = g; x.fill();
    }
  }

  // the two paths walked
  const start = G.views[0].state.pos;
  const mine = [start[0]], its = [start[1]];
  G.history.forEach(h => (h.player === 0 ? mine : its).push(h.to));
  [[mine, "#E4572E"], [its, "#9AD1BE"]].forEach(([p, color]) => {
    if (p.length < 2) return;
    x.save();
    x.strokeStyle = color; x.lineWidth = 7; x.lineCap = "round"; x.lineJoin = "round"; x.globalAlpha = 0.85;
    x.shadowColor = color; x.shadowBlur = 14;
    x.beginPath(); x.moveTo(cx(p[0]), cy(p[0]));
    for (let k = 1; k < p.length - 1; k++) x.quadraticCurveTo(cx(p[k]), cy(p[k]), (cx(p[k]) + cx(p[k + 1])) / 2, (cy(p[k]) + cy(p[k + 1])) / 2);
    x.lineTo(cx(p[p.length - 1]), cy(p[p.length - 1]));
    x.stroke();
    x.restore();
  });

  // pieces where the game ended
  [[G.view.state.pos[0], "#ffc2a6", "#E4572E"], [G.view.state.pos[1], "#effff8", "#9AD1BE"]].forEach(([sq, c1, c2]) => {
    const g = x.createRadialGradient(cx(sq) - cs * 0.08, cy(sq) - cs * 0.1, 2, cx(sq), cy(sq), cs * 0.28);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.beginPath(); x.arc(cx(sq), cy(sq), cs * 0.27, 0, Math.PI * 2); x.fill();
  });

  const t = aiTotals();
  const headline = $("#overTitle").textContent || "Kintsugi";
  x.fillStyle = "#E8E1D4"; x.font = '300 64px Fraunces, Georgia, serif';
  x.fillText(headline, M, OY + grid + 100);
  x.fillStyle = "rgba(232,225,212,.65)"; x.font = '400 24px "IBM Plex Mono", monospace';
  x.fillText(`${G.history.length} moves · ${G.view.state.blocked.length} tiles broken · machine checked ${fmt(t.nodes)} positions`, M, OY + grid + 154);
  x.fillText("Numbers show the order the tiles fell.", M, OY + grid + 194);

  cv.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kintsugi-" + Date.now() + ".png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }, "image/png");
}

/* ------------------------------------------------------------ wiring */
function init() {
  initSetup();
  initBoardEvents();

  $$("[data-tab]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); showTab(el.dataset.tab); }));
  if (location.hash === "#lab") showTab("lab");

  G.tilt = !!(window.matchMedia && window.matchMedia("(min-width: 900px)").matches);
  $("#tiltBtn").setAttribute("aria-pressed", G.tilt);

  $("#hintBtn").addEventListener("click", hint);
  $("#undoBtn").addEventListener("click", undo);
  $("#tiltBtn").addEventListener("click", toggleTilt);
  $("#terrBtn").addEventListener("click", toggleTerr);
  $("#resignBtn").addEventListener("click", resign);
  $("#newBtn").addEventListener("click", newGame);
  $("#retryBtn").addEventListener("click", () => machineMove(0));
  $("#againBtn").addEventListener("click", startGame);
  $("#saveBtn").addEventListener("click", savePoster);
  $("#labBtn").addEventListener("click", () => showTab("lab"));

  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if ($("#game").hidden || $("#view-play").hidden) return;
    const k = e.key.toLowerCase();
    if (k === "h") hint();
    else if (k === "u") undo();
    else if (k === "t") toggleTilt();
    else if (k === "k") toggleTerr();
  });
}

init();
