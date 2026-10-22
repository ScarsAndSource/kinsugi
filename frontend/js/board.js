// board.js — Screen 02: Live Game
// Wires to POST /api/move (human turn) and POST /api/ai (machine turn).

// ─── Render: outer shell ───────────────────────────────────────────────────
function boardRender() {
  const n = K.game.view?.state?.n || K.config.n;
  return `
<div class="flex flex-col w-full">

  <!-- Status / toolbar bar -->
  <div class="w-full px-margin-mobile lg:px-margin pt-space-md pb-space-sm">
    <div class="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md mb-space-md bg-surface-container-low px-space-md py-space-sm rounded">
      <div class="flex items-center gap-space-md">
        <div class="flex items-center gap-space-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-primary/80" id="phase-dot"></span>
          <span class="font-label-caps text-label-caps text-on-surface-variant/90 tracking-widest uppercase" id="phase-label">HUMAN PHASE</span>
        </div>
        <div class="h-3 w-px bg-outline-variant/30"></div>
        <div class="font-data-mono text-data-mono text-on-surface-variant/60 flex items-center gap-space-xs">
          <span class="text-tertiary/80" id="board-n-label">${n}×${n}</span>
          <span class="tracking-wider" id="free-label">— — MOVES READY</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-space-xs">
        <button id="toggle-kingdoms" onclick="boardToggleKingdoms()" class="px-space-sm py-1 rounded bg-surface-container/60 hover:bg-surface-container transition-colors font-label-caps text-label-caps text-on-surface-variant/80 hover:text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px] opacity-70">grain</span>KINGDOMS [K]
        </button>
        <button id="toggle-camera" onclick="boardToggleCamera()" class="px-space-sm py-1 rounded bg-surface-container/40 hover:bg-surface-container transition-colors font-label-caps text-label-caps text-on-surface-variant/70 hover:text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px] opacity-70">videocam</span>
          <span id="cam-label">CAM: OBLIQUE [T]</span>
        </button>
        <div class="h-3 w-px bg-outline-variant/20 mx-1"></div>
        <button onclick="boardResign()" class="px-space-sm py-1 rounded hover:bg-surface-container transition-colors font-label-caps text-label-caps text-on-surface-variant/60 hover:text-error">RESIGN</button>
        <button onclick="boardNewRitual()" class="px-space-sm py-1 rounded bg-surface-container-high hover:bg-surface-container-highest transition-colors font-label-caps text-label-caps text-on-surface tracking-wider font-normal">NEW RITUAL</button>
      </div>
    </div>

    <!-- 3-column layout -->
    <div class="w-full grid grid-cols-12 gap-space-md items-start">

      <!-- LEFT: Telemetry -->
      <aside class="col-span-12 lg:col-span-2 flex flex-col gap-space-md order-2 lg:order-1">
        <div class="bg-surface-container-low/60 backdrop-blur-md p-space-md rounded flex flex-col gap-space-md">
          <div class="flex items-center justify-between">
            <span class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-widest">TELEMETRY</span>
            <span class="font-kanji-accent text-data-mono text-tertiary/70 font-light">盤面</span>
          </div>
          <div class="h-px w-full bg-outline-variant/20"></div>
          <div id="telemetry-content"><!-- filled by JS --></div>
        </div>
        <div class="bg-surface-container-low/40 p-space-md rounded hidden lg:flex flex-col gap-space-xs">
          <span class="font-label-caps text-label-caps text-tertiary/70 tracking-widest">MEDITATION</span>
          <p class="font-data-mono text-data-mono text-on-surface-variant/60 leading-relaxed font-light">Every step dissolves the ground beneath. You cannot tread upon the abyss twice. Gold mends severed roots.</p>
        </div>
      </aside>

      <!-- CENTER: 3-D Board -->
      <section class="col-span-12 lg:col-span-7 flex flex-col gap-space-sm order-1 lg:order-2">
        <div class="relative w-full rounded bg-surface-container-lowest shadow-2xl overflow-hidden p-space-sm" style="min-height:560px;">
          <!-- Decorative labels -->
          <div class="absolute top-space-md left-space-md z-30 flex flex-col gap-1 pointer-events-none">
            <div class="flex items-center gap-2">
              <span class="w-1 h-1 rounded-full bg-tertiary/70"></span>
              <span class="font-data-mono text-data-mono text-on-surface-variant/80 tracking-wider" id="board-label">BASALT MONOLITH ${n}×${n}</span>
            </div>
          </div>
          <div class="absolute top-space-md right-space-md z-30" id="score-badge">
            <div class="flex items-center gap-space-xs bg-surface-container-high/80 backdrop-blur px-space-sm py-1 rounded">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary/70"></span>
              <span class="font-data-mono text-[10px] text-on-surface-variant/70 tracking-widest" id="score-label">—</span>
            </div>
          </div>

          <!-- Stage -->
          <div class="w-full h-full min-h-[540px] flex items-center justify-center relative overflow-hidden" id="stage-viewport" style="perspective:1200px;">
            <div class="absolute inset-0 bg-radial-gradient opacity-80 pointer-events-none"></div>
            <div id="board-plane" style="transform:rotateX(55deg) rotateZ(-18deg); transform-style:preserve-3d; width:440px; height:440px; position:relative; transition:transform 0.7s ease-out;">
              <!-- Territory overlays -->
              <div id="territory-ember"  class="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500 rounded"></div>
              <div id="territory-celadon" class="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500 rounded"></div>
              <!-- Cell grid -->
              <div id="board-grid" class="w-full h-full relative" style="display:grid; grid-template-columns:repeat(${n},minmax(0,1fr)); gap:6px; transform-style:preserve-3d;">
                <!-- cells populated by JS -->
              </div>
            </div>
          </div>

          <!-- Bottom status strip -->
          <div class="absolute bottom-space-md left-space-md z-30 flex items-center gap-space-md">
            <div class="flex items-center gap-space-xs font-data-mono text-data-mono text-on-surface-variant/70 bg-surface-container/80 px-space-sm py-1 rounded" id="move-hint"></div>
            <div class="hidden sm:flex items-center gap-space-xs font-data-mono text-data-mono text-tertiary/80 bg-surface-container/80 px-space-sm py-1 rounded" id="thread-hint"></div>
          </div>

          <!-- Game-over overlay -->
          <div id="game-over-overlay" class="hidden absolute inset-0 z-40 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
            <div class="flex flex-col items-center gap-space-md text-center p-space-xl">
              <span class="font-kanji-accent text-kanji-accent text-tertiary">終</span>
              <span class="font-display-hero text-headline-lg text-on-surface" id="game-over-text">RITUAL CONCLUDED</span>
              <span class="font-data-mono text-data-mono text-on-surface-variant/60" id="game-over-sub"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT: AI Mind -->
      <aside class="col-span-12 lg:col-span-3 flex flex-col gap-space-md order-3">
        <div class="bg-surface-container-low/60 backdrop-blur-md p-space-md rounded flex flex-col gap-space-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-[15px] text-on-surface-variant/60">spa</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant/80 tracking-widest uppercase">THE MIND</span>
            </div>
            <span class="font-data-mono text-data-mono text-on-surface-variant/40" id="mind-depth-label">DEPTH ${K.config.depth}</span>
          </div>
          <div class="h-px w-full bg-outline-variant/20"></div>
          <div id="ai-panel-content"><!-- filled by JS --></div>
        </div>
      </aside>
    </div>

    <!-- Move timeline -->
    <div class="w-full mt-space-md p-space-md bg-surface-container-lowest rounded shadow-sm flex flex-col gap-space-xs">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-space-sm">
          <span class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-widest">CALLIGRAPHIC CHRONOLOGY</span>
          <span class="font-data-mono text-[10px] text-tertiary/70" id="timeline-count">0 STEPS</span>
        </div>
        <span class="font-data-mono text-[10px] text-on-surface-variant/40 tracking-wider">HISTORICAL SEQUENCE</span>
      </div>
      <div class="w-full overflow-x-auto py-1 flex items-center gap-2" id="move-timeline"></div>
    </div>
  </div>
</div>`;
}

// ─── Init ──────────────────────────────────────────────────────────────────
function boardInit() {
  // Event delegation for board clicks
  const grid = document.getElementById('board-grid');
  if (grid) {
    grid.addEventListener('click', e => {
      const cell = e.target.closest('[data-sq]');
      if (cell) boardOnCellClick(+cell.dataset.sq);
    });
  }

  // Keyboard shortcuts
  window._boardKeyHandler = e => {
    if (e.key === 't' || e.key === 'T') boardToggleCamera();
    if (e.key === 'k' || e.key === 'K') boardToggleKingdoms();
  };
  window.addEventListener('keydown', window._boardKeyHandler);

  boardRefreshAll();

  // If it's the machine's turn on first load (config.first === 1), trigger AI
  if (K.game.view && K.game.view.turn === 1 && !K.game.view.game_over) {
    setTimeout(boardDoAiMove, 600);
  }
}

// ─── Refresh (targeted DOM updates) ────────────────────────────────────────
function boardRefreshAll() {
  boardRefreshGrid();
  boardUpdateTerritoryOverlay();
  boardRefreshTelemetry();
  boardRefreshAiPanel();
  boardRefreshTimeline();
  boardRefreshStatus();
}

function boardRefreshGrid() {
  const grid = document.getElementById('board-grid');
  if (!grid || !K.game.view) return;
  const n = K.game.view.state.n;
  grid.style.gridTemplateColumns = `repeat(${n},minmax(0,1fr))`;
  grid.innerHTML = _boardCellsHTML();
}

function boardRefreshTelemetry() {
  const el = document.getElementById('telemetry-content');
  if (el && K.game.view) el.innerHTML = _telemetryHTML();
}

function boardRefreshAiPanel() {
  const el = document.getElementById('ai-panel-content');
  if (el) el.innerHTML = _aiPanelHTML();
}

function boardRefreshTimeline() {
  const el = document.getElementById('move-timeline');
  const count = document.getElementById('timeline-count');
  if (!el) return;
  const hist = K.game.history;
  if (count) count.textContent = `${hist.length} STEP${hist.length === 1 ? '' : 'S'} RECORDED`;
  el.innerHTML = hist.length === 0
    ? '<span class="font-data-mono text-data-mono text-on-surface-variant/30 px-space-sm shrink-0">THE SLATE AWAITS FIRST DESCENT</span>'
    : hist.map((h, i) => {
        const isCur = i === hist.length - 1;
        const n = K.game.view.state.n;
        const dot = h.player === 0 ? 'bg-primary/70' : 'bg-secondary/70';
        const from = _sqToCoord(h.from, n);
        const to   = _sqToCoord(h.to,   n);
        const num  = String(i + 1).padStart(3, '0');
        if (isCur) return `<span class="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-data-mono text-[10px] shrink-0 ring-1 ring-outline-variant/30">
          <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span><span>${num} ${from}→${to} (PRESENT)</span></span>`;
        return `<span class="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container/40 text-on-surface-variant/70 font-data-mono text-[10px] shrink-0">
          <span class="w-1 h-1 rounded-full ${dot}"></span><span>${num} ${from}→${to}</span></span>`;
      }).join('');
  // Auto-scroll to end
  el.scrollLeft = el.scrollWidth;
}

function boardRefreshStatus() {
  const v = K.game.view;
  if (!v) return;
  const phaseDot   = document.getElementById('phase-dot');
  const phaseLabel = document.getElementById('phase-label');
  const freeLabel  = document.getElementById('free-label');
  const moveHint   = document.getElementById('move-hint');
  const threadHint = document.getElementById('thread-hint');
  const mindDepth  = document.getElementById('mind-depth-label');

  if (v.game_over) {
    if (phaseDot)   { phaseDot.className = 'w-1.5 h-1.5 rounded-full bg-tertiary/80'; }
    if (phaseLabel) phaseLabel.textContent = 'RITUAL CONCLUDED';
    if (freeLabel)  freeLabel.textContent = `WINNER: ${v.winner === 0 ? 'HUMAN' : 'MACHINE'}`;
    if (moveHint)   moveHint.innerHTML = `<span class="text-tertiary font-bold">終</span><span>GAME OVER</span>`;
    // Show overlay
    const overlay = document.getElementById('game-over-overlay');
    const txt = document.getElementById('game-over-text');
    const sub = document.getElementById('game-over-sub');
    if (overlay) overlay.classList.remove('hidden');
    if (txt) txt.textContent = v.winner === 0 ? 'You outlasted it.' : 'The machine endures.';
    if (sub) sub.textContent = v.winner === 0 ? 'HUMAN SURVIVED — BASALT YIELDS' : 'MACHINE PRECISION — FLOOR CONSUMED';
    return;
  }

  const isHumanTurn = v.turn === 0;
  const thinking = K.game.isAiThinking;

  if (phaseDot) {
    phaseDot.className = `w-1.5 h-1.5 rounded-full ${thinking ? 'bg-secondary/80 animate-pulse' : isHumanTurn ? 'bg-primary/80' : 'bg-secondary/80'}`;
  }
  if (phaseLabel) {
    phaseLabel.textContent = thinking ? 'MACHINE SYNTHESIS' : isHumanTurn ? 'HUMAN PHASE' : 'MACHINE PHASE';
  }
  const freeCount = v.free_squares;
  if (freeLabel) freeLabel.textContent = `${freeCount} TILES REMAIN`;

  if (moveHint) {
    const n = v.state.n;
    const sq = v.state.pos[isHumanTurn ? 0 : 1];
    const coord = _sqToCoord(sq, n);
    moveHint.innerHTML = thinking
      ? `<span class="text-secondary/80 animate-pulse">MACHINE COMPUTING...</span>`
      : isHumanTurn
        ? `<span class="text-primary font-bold">L-HOP</span><span>${coord} → SELECT TARGET</span>`
        : `<span class="text-secondary font-bold">L-HOP</span><span>${coord}</span>`;
  }
  const legalCount = v.legal_moves.length;
  if (threadHint) threadHint.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span><span>${legalCount} MOVES PROJECTED</span>`;
  if (mindDepth) mindDepth.textContent = `DEPTH ${K.config.depth}`;
}

function boardUpdateTerritoryOverlay() {
  const v = K.game.view;
  if (!v) return;
  const n = v.state.n;
  const [hSq, mSq] = v.state.pos;
  const hRow = Math.floor(hSq / n), hCol = hSq % n;
  const mRow = Math.floor(mSq / n), mCol = mSq % n;
  const hx = ((hCol + 0.5) / n * 100).toFixed(1);
  const hy = ((hRow + 0.5) / n * 100).toFixed(1);
  const mx = ((mCol + 0.5) / n * 100).toFixed(1);
  const my = ((mRow + 0.5) / n * 100).toFixed(1);

  const ember   = document.getElementById('territory-ember');
  const celadon = document.getElementById('territory-celadon');
  const vis = K.game.kingdomsVisible ? '0.75' : '0';

  if (ember) {
    ember.style.background = `radial-gradient(circle at ${hx}% ${hy}%, rgba(243,98,56,0.22) 0%, rgba(243,98,56,0.04) 50%, transparent 70%)`;
    ember.style.opacity = vis;
  }
  if (celadon) {
    celadon.style.background = `radial-gradient(circle at ${mx}% ${my}%, rgba(155,210,191,0.20) 0%, rgba(155,210,191,0.04) 50%, transparent 70%)`;
    celadon.style.opacity = vis;
  }
}

// ─── Cell Rendering ────────────────────────────────────────────────────────
function _boardCellsHTML() {
  const v = K.game.view;
  const st = v.state;
  const n = st.n;
  const blocked = new Set(st.blocked);
  const [hSq, mSq] = st.pos;
  const legalSet = new Set(v.legal_moves);
  const isHumanTurn = v.turn === 0;
  const thinking = K.game.isAiThinking;
  const owners = v.territory?.owner || [];

  let html = '';
  for (let sq = 0; sq < n * n; sq++) {
    if (blocked.has(sq)) {
      html += `<div data-sq="${sq}" class="relative" style="transform-style:preserve-3d">
        <div class="w-full h-full bg-surface-container-lowest rounded" style="opacity:0.18"></div>
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="${_goldVein(sq)}" stroke="#ebc166" stroke-width="1.4" fill="none" opacity="0.55"/>
        </svg>
      </div>`;
    } else if (sq === hSq) {
      html += `<div data-sq="${sq}" class="relative bg-surface-container-high rounded" style="transform-style:preserve-3d">
        <div class="absolute inset-0 rounded bg-primary-container/20"></div>
        <div class="absolute inset-0 flex items-center justify-center" style="transform:translateZ(18px)">
          <div class="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shadow-[0_0_24px_rgba(243,98,56,0.9)] ring-2 ring-primary">
            <span style="font-family:'Noto Serif';font-size:11px;color:#601400;line-height:1">人</span>
          </div>
        </div>
      </div>`;
    } else if (sq === mSq) {
      const pulse = thinking ? 'animate-pulse' : '';
      html += `<div data-sq="${sq}" class="relative bg-surface-container-high rounded" style="transform-style:preserve-3d">
        <div class="absolute inset-0 rounded bg-secondary-container/20 ${thinking ? 'animate-pulse' : ''}"></div>
        <div class="absolute inset-0 flex items-center justify-center" style="transform:translateZ(18px)">
          <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shadow-[0_0_24px_rgba(155,210,191,0.9)] ring-2 ring-secondary-fixed ${pulse}">
            <span style="font-family:'Noto Serif';font-size:11px;color:#00382c;line-height:1">機</span>
          </div>
        </div>
      </div>`;
    } else if (!thinking && isHumanTurn && legalSet.has(sq)) {
      html += `<div data-sq="${sq}" class="relative bg-surface-container rounded cursor-pointer hover:bg-surface-container-high transition-all ring-1 ring-tertiary/40 hover:ring-tertiary/80 hover:shadow-[0_0_12px_rgba(235,193,102,0.3)]" style="transform-style:preserve-3d">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-tertiary/50 hover:bg-tertiary/80 transition-all"></div>
        </div>
      </div>`;
    } else {
      // Territory tinting on regular squares
      const own = owners[sq];
      let extra = '';
      if (own === 0) extra = 'shadow-[inset_0_0_6px_rgba(243,98,56,0.07)]';
      else if (own === 1) extra = 'shadow-[inset_0_0_6px_rgba(155,210,191,0.07)]';
      const base = (sq % 2 === 0) ? 'bg-surface-container-high' : 'bg-surface-container';
      html += `<div data-sq="${sq}" class="relative ${base} ${extra} rounded" style="transform-style:preserve-3d"></div>`;
    }
  }
  return html;
}

function _goldVein(sq) {
  // Deterministic kintsugi crack from square index
  const x1 = ((sq * 73  + 11) % 80) + 10;
  const y1 = ((sq * 43  + 23) % 60) + 20;
  const cx = ((sq * 97  + 37) % 80) + 10;
  const cy = ((sq * 61  + 17) % 60) + 20;
  const x2 = ((sq * 53  + 71) % 80) + 10;
  const y2 = ((sq * 29  + 47) % 80) + 10;
  const bx = ((sq * 113 + 59) % 60) + 20;
  const by = ((sq * 31  + 83) % 80) + 10;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2} M${x2},${y2} L${bx},${by}`;
}

// ─── Sidebar Content ────────────────────────────────────────────────────────
function _telemetryHTML() {
  const v = K.game.view;
  const st = v.state;
  const n = st.n;
  const moves = K.game.history.length;
  const hMoves = K.game.history.filter(h => h.player === 0).length;
  const mMoves = K.game.history.filter(h => h.player === 1).length;
  const counts = v.territory?.counts || [0, 0];
  const [hTerr, mTerr] = counts;
  const terrTotal = hTerr + mTerr || 1;
  const hp = Math.round(hTerr / terrTotal * 100);
  const mp = 100 - hp;
  const delta = hTerr - mTerr;
  const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;

  return `<div class="flex flex-col gap-space-sm pt-space-xs">
    <div class="flex flex-col gap-0.5">
      <span class="font-data-mono text-[10px] text-on-surface-variant/50 tracking-wider">CYCLE</span>
      <div class="flex items-baseline gap-space-xs">
        <span class="font-headline-sm text-headline-sm text-on-surface font-light">${moves}</span>
        <span class="font-data-mono text-data-mono text-on-surface-variant/40">/ ${n*n}</span>
      </div>
    </div>
    <div class="flex flex-col gap-0.5">
      <span class="font-data-mono text-[10px] text-on-surface-variant/50 tracking-wider">RESIDUAL STRATUM</span>
      <div class="flex items-baseline gap-space-xs">
        <span class="font-headline-sm text-headline-sm text-tertiary/90 font-light">${v.free_squares}</span>
        <span class="font-data-mono text-data-mono text-on-surface-variant/40">REMAIN</span>
      </div>
    </div>
    <div class="flex flex-col gap-0.5 pt-space-xs">
      <div class="flex justify-between font-data-mono text-data-mono">
        <span class="text-on-surface-variant/60">STRIKES</span>
        <span class="text-primary/80">${String(hMoves).padStart(2,'0')}</span>
      </div>
      <div class="flex justify-between font-data-mono text-data-mono">
        <span class="text-on-surface-variant/60">SHIFTS</span>
        <span class="text-secondary/80">${String(mMoves).padStart(2,'0')}</span>
      </div>
    </div>
  </div>
  <div class="h-px w-full bg-outline-variant/20 my-space-xs"></div>
  <div class="flex flex-col gap-space-sm">
    <div class="flex items-center justify-between">
      <span class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-widest text-[10px]">STRATUM HARMONY</span>
      <span class="font-data-mono text-data-mono text-tertiary/70 text-[10px]">Δ ${deltaStr}</span>
    </div>
    <div class="flex items-center justify-between font-data-mono text-data-mono text-on-surface-variant/70">
      <span class="text-primary/80">${hTerr}</span>
      <span class="text-[10px] text-on-surface-variant/40">SOVEREIGN</span>
      <span class="text-secondary/80">${mTerr}</span>
    </div>
    <div class="w-full h-1 rounded-full bg-surface-container overflow-hidden flex">
      <div class="h-full bg-primary/50 transition-all duration-500" style="width:${hp}%"></div>
      <div class="h-full bg-secondary/40 transition-all duration-500" style="width:${mp}%"></div>
    </div>
    <div class="flex justify-between font-data-mono text-[10px] text-on-surface-variant/40">
      <span>${hp}%</span><span>${mp}%</span>
    </div>
  </div>`;
}

function _aiPanelHTML() {
  const ai = K.game.aiResult;
  const thinking = K.game.isAiThinking;

  if (thinking) {
    return `<div class="flex flex-col items-center justify-center gap-space-md py-space-xl">
      <div class="relative w-16 h-16 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full border border-tertiary/30 animate-spin" style="border-top-color:transparent"></div>
        <span class="font-kanji-accent text-kanji-accent text-tertiary/70" style="font-size:1rem">機</span>
      </div>
      <span class="font-data-mono text-data-mono text-tertiary/70 animate-pulse">SYNTHESIZING...</span>
      <span class="font-data-mono text-[9px] text-on-surface-variant/40 tracking-widest">${K.config.algorithm.toUpperCase()} · ${K.config.heuristic.toUpperCase()}</span>
    </div>`;
  }

  if (!ai) {
    return `<div class="flex items-center justify-center py-space-xl text-on-surface-variant/25 font-data-mono text-data-mono text-center px-space-md">
      AWAITING<br>FIRST SYNTHESIS
    </div>`;
  }

  const stats = ai.stats;
  const nodes = stats.nodes;
  const cutoffs = stats.cutoffs;
  const ms = stats.time_ms.toFixed(0);
  const depth = ai.depth_completed;
  const maxDepth = K.config.depth;
  const dashArr = 264;
  const dashOff = Math.max(0, dashArr - (depth / maxDepth * dashArr)).toFixed(0);

  const topMoves = (ai.root_moves || [])
    .filter(m => m.score !== null && m.score !== undefined)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const n = K.game.view.state.n;
  const machineSq = K.game.view.state.pos[1];

  const intents = topMoves.map((rm, i) => {
    const from = _sqToCoord(machineSq, n);
    const to   = _sqToCoord(rm.move, n);
    const scoreStr = rm.score >= 0 ? `+${rm.score.toFixed(2)}` : rm.score.toFixed(2);
    const rowCls  = i===0 ? 'bg-surface-container/60 text-on-surface' : i===1 ? 'bg-surface-container/20 text-on-surface-variant/80' : 'bg-transparent text-on-surface-variant/40';
    const dotCls  = i===0 ? 'bg-tertiary/80' : i===1 ? 'bg-secondary/60' : 'bg-outline-variant/30';
    const scoreCls= i===0 ? 'text-tertiary/90' : i===1 ? 'text-secondary/80' : '';
    return `<div class="flex items-center justify-between p-2 rounded ${rowCls}">
      <div class="flex items-center gap-space-xs font-data-mono text-data-mono">
        <span class="w-1 h-1 rounded-full ${dotCls}"></span>
        <span>${from} › ${to}</span>
      </div>
      <span class="${scoreCls} text-[10px] font-data-mono">${scoreStr}</span>
    </div>`;
  }).join('');

  const fmtNodes = nodes > 9999 ? `${(nodes/1000).toFixed(0)}K` : nodes;
  const fmtCuts  = cutoffs > 9999 ? `${(cutoffs/1000).toFixed(1)}K` : cutoffs;

  return `<div class="w-full flex flex-col items-center justify-center py-space-sm">
    <div class="relative flex items-center justify-center w-28 h-28">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#59413b" stroke-width="1"/>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#ebc166" stroke-width="1.5"
          stroke-dasharray="${dashArr}" stroke-dashoffset="${dashOff}"
          stroke-linecap="round" opacity="0.8"/>
        <circle cx="50" cy="50" r="32" fill="none" stroke="#59413b" stroke-width="0.8" opacity="0.5"/>
      </svg>
      <div class="absolute flex flex-col items-center justify-center">
        <span class="font-data-mono text-title-editorial text-on-surface font-light">${fmtNodes}</span>
        <span class="font-data-mono text-[9px] text-on-surface-variant/50 tracking-widest uppercase">NODES</span>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-2 gap-space-xs text-center bg-surface-container/40 p-space-xs rounded font-data-mono">
    <div class="py-1">
      <span class="text-[9px] text-on-surface-variant/40 block tracking-wider uppercase">PRUNED</span>
      <span class="text-data-mono text-tertiary/80">${fmtCuts}</span>
    </div>
    <div class="py-1">
      <span class="text-[9px] text-on-surface-variant/40 block tracking-wider uppercase">LATENCY</span>
      <span class="text-data-mono text-on-surface-variant/70">${ms}ms</span>
    </div>
  </div>
  <div class="flex flex-col gap-space-sm mt-space-md">
    <div class="flex items-center justify-between">
      <span class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-widest text-[10px]">INTENTIONS</span>
      <span class="font-data-mono text-[10px] text-on-surface-variant/40">DEPTH ${depth}</span>
    </div>
    <div class="flex flex-col gap-1.5 font-data-mono text-data-mono">${intents}</div>
  </div>`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function _sqToCoord(sq, n) {
  const row = Math.floor(sq / n);
  const col = sq % n;
  return `${String.fromCharCode(97 + col)}${n - row}`;
}

// ─── User Actions (global) ─────────────────────────────────────────────────
function boardToggleCamera() {
  K.game.cameraOblique = !K.game.cameraOblique;
  const plane = document.getElementById('board-plane');
  const lbl   = document.getElementById('cam-label');
  if (plane) plane.style.transform = K.game.cameraOblique
    ? 'rotateX(55deg) rotateZ(-18deg)'
    : 'rotateX(0deg) rotateZ(0deg)';
  if (lbl) lbl.textContent = K.game.cameraOblique ? 'CAM: OBLIQUE [T]' : 'CAM: TOP-DOWN [T]';
}

function boardToggleKingdoms() {
  K.game.kingdomsVisible = !K.game.kingdomsVisible;
  boardUpdateTerritoryOverlay();
}

function boardResign() {
  if (K.game.view?.game_over) return;
  // Treat as machine win
  K.posterity = {
    resigned: true,
    winner: 1,
    history: [...K.game.history],
    config: { ...K.config },
    finalView: K.game.view,
  };
  navigate('posterity');
}

function boardNewRitual() {
  // Clean up keyboard handler before leaving
  if (window._boardKeyHandler) {
    window.removeEventListener('keydown', window._boardKeyHandler);
    delete window._boardKeyHandler;
  }
  navigate('ritual');
}

// ─── Move Handling ─────────────────────────────────────────────────────────
async function boardOnCellClick(sq) {
  const v = K.game.view;
  if (!v || K.game.isAiThinking || v.game_over) return;
  if (v.turn !== 0) return;                         // not human's turn
  if (!v.legal_moves.includes(sq)) return;          // not a legal target

  K.game.isAiThinking = true;
  boardRefreshGrid();  // re-render to show "locked" state
  boardRefreshStatus();

  try {
    const result = await API.move(v.state, sq);
    // result = full view after move, with .move = {player, from, to}

    K.game.history.push({
      plyIndex: K.game.history.length + 1,
      player:   result.move.player,
      from:     result.move.from,
      to:       result.move.to,
      viewAfter: result,
      aiResult:  null,
    });
    K.game.view = result;
    K.game.isAiThinking = false;
    boardRefreshAll();

    if (result.game_over) {
      _boardGameOver(result);
      return;
    }
    // Machine's turn
    if (result.turn === 1) {
      setTimeout(boardDoAiMove, 400);
    }
  } catch (e) {
    console.error('Move failed:', e);
    K.game.isAiThinking = false;
    boardRefreshAll();
  }
}

async function boardDoAiMove() {
  K.game.isAiThinking = true;
  boardRefreshGrid();
  boardRefreshAiPanel();
  boardRefreshStatus();

  try {
    const result = await API.ai({
      state:        K.game.view.state,
      algorithm:    K.config.algorithm,
      heuristic:    K.config.heuristic,
      depth:        K.config.depth,
      ordering:     K.config.ordering ? 'heuristic' : 'none',
      iterative:    K.config.iterative,
      time_limit_ms: K.config.timeLimitMs,
      trace_depth:  K.config.traceDepth,
    });

    const afterView = result.view;
    K.game.aiResult = result;
    K.game.history.push({
      plyIndex: K.game.history.length + 1,
      player:   result.move.player,
      from:     result.move.from,
      to:       result.move.to,
      viewAfter: afterView,
      aiResult:  result,
    });

    // Update score badge
    const badge = document.getElementById('score-label');
    if (badge) {
      const s = result.score;
      badge.textContent = `WEIGHT: ${s >= 0 ? '+' : ''}${s.toFixed(2)}`;
    }

    K.game.view = afterView;
    K.game.isAiThinking = false;
    boardRefreshAll();

    if (afterView.game_over) {
      _boardGameOver(afterView);
    }
  } catch (e) {
    console.error('AI move failed:', e);
    K.game.isAiThinking = false;
    boardRefreshAll();
  }
}

function _boardGameOver(view) {
  // Store posterity data
  const history = K.game.history;
  const initV   = K.game.initialView;

  // Compute trajectories
  const humanPath   = [initV.state.pos[0]];
  const machinePath = [initV.state.pos[1]];
  history.forEach(h => {
    if (h.player === 0) humanPath.push(h.to);
    else                machinePath.push(h.to);
  });

  // AI aggregate stats
  const aiMoves = history.filter(h => h.aiResult);
  const totalNodes   = aiMoves.reduce((s, h) => s + (h.aiResult.stats?.nodes || 0), 0);
  const totalCutoffs = aiMoves.reduce((s, h) => s + (h.aiResult.stats?.cutoffs || 0), 0);
  const totalMs      = aiMoves.reduce((s, h) => s + (h.aiResult.stats?.time_ms || 0), 0);
  const avgDepth     = aiMoves.length
    ? (aiMoves.reduce((s, h) => s + (h.aiResult.depth_completed || 0), 0) / aiMoves.length).toFixed(1)
    : K.config.depth;

  K.posterity = {
    winner: view.winner,
    resigned: false,
    history,
    humanPath,
    machinePath,
    finalView: view,
    config: { ...K.config },
    stats: { totalNodes, totalCutoffs, totalMs, avgDepth, aiMoves: aiMoves.length },
    boardN: view.state.n,
    finalBlocked: view.state.blocked,
    finalPos: view.state.pos,
  };

  // Show overlay briefly then navigate
  boardRefreshStatus();
  setTimeout(() => {
    if (window._boardKeyHandler) {
      window.removeEventListener('keydown', window._boardKeyHandler);
      delete window._boardKeyHandler;
    }
    navigate('posterity');
  }, 2200);
}
