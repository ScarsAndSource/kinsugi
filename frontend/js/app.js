// app.js — global state, router, boot sequence

// ─── Global State ──────────────────────────────────────────────────────────
const K = {
  page: null,
  heuristics: [], // [{key, title, blurb, cost}] loaded from /api/heuristics

  // Settings carried from the Ritual page → into API calls
  config: {
    n: 7,
    holes: 2,
    seed: null,
    first: 0,           // 0 = human moves first, 1 = machine moves first
    algorithm: 'alphabeta',
    heuristic: 'territory',
    depth: 5,
    timeLimitMs: 3000,
    iterative: true,
    ordering: true,
    traceDepth: 2,
  },

  // Live game data
  game: {
    initialView: null,  // view snapshot right after /api/new (needed by posterity for paths)
    view: null,         // most recent view from API
    history: [],        // [{plyIndex, player, from, to, viewAfter, aiResult?}]
    isAiThinking: false,
    aiResult: null,     // last /api/ai result for display in "The Mind" panel
    cameraOblique: true,
    kingdomsVisible: true,
  },

  // Written at game-over; read by posterity page
  posterity: null,
};

// ─── Router ────────────────────────────────────────────────────────────────
function navigate(page) {
  if (page === 'the-board') page = 'board';
  K.page = page;
  _navUpdateActive(page);
  const main = document.getElementById('app');
  switch (page) {
    case 'ritual':    main.innerHTML = ritualRender();    ritualInit();    break;
    case 'board':     main.innerHTML = boardRender();     boardInit();     break;
    case 'workshop':  main.innerHTML = workshopRender();  workshopInit();  break;
    case 'posterity': main.innerHTML = posterityRender(); posterityInit(); break;
    default: main.innerHTML = `<div class="p-16 text-center font-data-mono text-on-surface-variant/30">NOT FOUND</div>`;
  }
  window.scrollTo(0, 0);
}

function _navUpdateActive(page) {
  document.querySelectorAll('nav a[data-path]').forEach(a => {
    const p = a.dataset.path === 'the-board' ? 'board' : a.dataset.path;
    const on = p === page;
    a.className = on
      ? 'tracking-widest transition-colors bg-primary-container text-on-primary-container font-label-caps text-label-caps px-space-sm py-1 rounded'
      : 'font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface tracking-widest transition-colors';
    on ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current');
  });
}

// ─── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Wire nav links
  document.querySelectorAll('nav a[data-path]').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.path); })
  );

  // Health probe — update SYNC pill
  try {
    await API.health();
  } catch {
    const dot = document.getElementById('sync-dot');
    const lbl = document.getElementById('sync-label');
    if (dot) { dot.classList.remove('bg-secondary'); dot.classList.add('bg-error'); dot.classList.remove('animate-pulse'); }
    if (lbl) lbl.textContent = 'OFFLINE';
  }

  // Heuristics — populate K.heuristics (fallback if backend down)
  try {
    K.heuristics = await API.heuristics();
  } catch {
    K.heuristics = [
      { key:'mobility',   title:'Even Hand',   blurb:'My moves minus yours. The textbook baseline.',                           cost:'low'    },
      { key:'aggressive', title:'Predator',     blurb:'Relentlessly cuts escape corridors.',                                   cost:'low'    },
      { key:'defensive',  title:'Hermit',       blurb:'Withdraws into self-contained archipelagos.',                          cost:'low'    },
      { key:'lookahead',  title:'Far Sight',    blurb:'Projects moves now and the moves those moves unlock.',                  cost:'medium' },
      { key:'territory',  title:'Cartographer', blurb:'Calculates choke-points and knight-hop graph connectivity.',           cost:'high'   },
    ];
  }

  navigate('ritual');
});
