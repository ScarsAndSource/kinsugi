// workshop.js — Screen 03: The Crucible / Workshop Lab
// Wires to /api/lab/compare, /api/lab/tournament, and /api/lab/duel.
// Minimal, highly visual, zero fluff.

let _workshopTab = 'compare'; // 'compare' | 'tournament' | 'duel'
let _duelPlayback = {
  game: null,
  step: 0,
  timer: null,
  isPlaying: false,
};

function workshopRender() {
  return `
<div class="flex flex-col w-full text-on-surface select-none">
  <div class="w-full px-margin-mobile lg:px-margin py-space-md lg:py-space-lg">
    
    <!-- Header banner -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/15">
      <div class="flex flex-col gap-space-xs">
        <div class="flex items-center gap-space-sm">
          <span class="font-data-mono text-data-mono text-primary tracking-widest uppercase">THE WORKSHOP CRUCIBLE</span>
          <div class="w-8 h-px bg-primary/40"></div>
          <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">SEARCH &amp; EVALUATION PROVING GROUND</span>
        </div>
        <h1 class="font-display-hero text-headline-lg lg:text-display-hero text-on-surface tracking-tight font-normal">
          Anatomy of Precognition
        </h1>
        <p class="font-title-editorial text-title-editorial text-on-surface-variant/80 max-w-2xl italic font-light">
          Dissect the algorithms that illuminate the void. Measure pruning efficiency, pit philosophies in round-robin tournaments, or witness automated synthetic clashes.
        </p>
      </div>

      <!-- Workshop Tab Switcher -->
      <div class="flex items-center gap-1 p-1 bg-surface-container-lowest/80 border border-outline-variant/20 rounded">
        <button onclick="workshopSetTab('compare')" id="wtab-compare"
          class="px-space-md py-1.5 font-label-caps text-label-caps tracking-wider transition-all rounded ${_workshopTab === 'compare' ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface-variant hover:text-on-surface'}">
          01 BENCHMARK
        </button>
        <button onclick="workshopSetTab('tournament')" id="wtab-tournament"
          class="px-space-md py-1.5 font-label-caps text-label-caps tracking-wider transition-all rounded ${_workshopTab === 'tournament' ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface-variant hover:text-on-surface'}">
          02 TOURNAMENT
        </button>
        <button onclick="workshopSetTab('duel')" id="wtab-duel"
          class="px-space-md py-1.5 font-label-caps text-label-caps tracking-wider transition-all rounded ${_workshopTab === 'duel' ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface-variant hover:text-on-surface'}">
          03 DUEL &amp; TIME-LAPSE
        </button>
      </div>
    </header>

    <!-- Content Slot for active tab -->
    <div id="workshop-tab-content">
      ${_workshopTabContent()}
    </div>

  </div>
</div>`;
}

function _workshopTabContent() {
  if (_workshopTab === 'compare') return _workshopCompareHTML();
  if (_workshopTab === 'tournament') return _workshopTournamentHTML();
  return _workshopDuelHTML();
}

function workshopSetTab(tab) {
  _workshopTab = tab;
  if (_duelPlayback.timer) {
    clearInterval(_duelPlayback.timer);
    _duelPlayback.isPlaying = false;
  }
  const el = document.getElementById('workshop-tab-content');
  if (el) el.innerHTML = _workshopTabContent();

  ['compare', 'tournament', 'duel'].forEach(t => {
    const btn = document.getElementById(`wtab-${t}`);
    if (btn) {
      btn.className = `px-space-md py-1.5 font-label-caps text-label-caps tracking-wider transition-all rounded ${t === tab ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface-variant hover:text-on-surface'}`;
    }
  });

  if (tab === 'duel' && _duelPlayback.game) {
    _workshopRenderDuelBoard();
  }
}

function workshopInit() {
  // auto-trigger initial benchmark comparison if not yet loaded
  const resultsContainer = document.getElementById('compare-results');
  if (_workshopTab === 'compare' && resultsContainer && !resultsContainer.dataset.loaded) {
    workshopRunCompare();
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 01 BENCHMARK: Minimax vs. Alpha-Beta vs. Move Ordering
// ───────────────────────────────────────────────────────────────────────────
function _workshopCompareHTML() {
  return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
  <!-- Controls Column -->
  <div class="lg:col-span-4 flex flex-col gap-space-md bg-surface-container-low/50 p-space-md border border-outline-variant/15 rounded">
    <div class="flex items-center justify-between">
      <span class="font-label-caps text-label-caps text-tertiary tracking-widest uppercase">TEST PROTOCOL</span>
      <span class="font-data-mono text-[10px] text-on-surface-variant/50">IDENTICAL BRANCHING</span>
    </div>
    <div class="flex flex-col gap-space-xs font-data-mono text-data-mono">
      <label class="text-on-surface-variant/70">BENCHMARK HEURISTIC</label>
      <select id="cmp-heuristic" class="bg-surface-container-high px-space-sm py-1.5 rounded border border-outline-variant/20 text-on-surface focus:outline-none">
        <option value="aggressive" selected>Predator (Aggressive)</option>
        <option value="mobility">Even Hand (Mobility)</option>
        <option value="defensive">Hermit (Defensive)</option>
        <option value="lookahead">Far Sight (Lookahead)</option>
        <option value="territory">Cartographer (Territory Voronoi)</option>
      </select>
    </div>
    <div class="flex flex-col gap-space-xs font-data-mono text-data-mono">
      <div class="flex justify-between">
        <label class="text-on-surface-variant/70">MAX DEPTH (PLIES)</label>
        <span class="text-tertiary" id="cmp-depth-val">5</span>
      </div>
      <input id="cmp-depth" type="range" min="2" max="6" value="5" step="1"
        oninput="document.getElementById('cmp-depth-val').textContent = this.value"
        class="w-full h-1 bg-surface-container appearance-none cursor-pointer accent-tertiary">
    </div>
    <button onclick="workshopRunCompare()" id="btn-run-compare"
      class="mt-space-xs py-space-sm px-space-md bg-surface-container-high hover:bg-surface-container-highest transition-all rounded font-label-caps text-label-caps text-primary tracking-wider border border-primary/30 flex items-center justify-center gap-space-xs">
      <span class="material-symbols-outlined text-[16px]">play_arrow</span>
      COMMENCE BENCHMARK
    </button>
    <div class="pt-space-xs border-t border-outline-variant/15 flex flex-col gap-1 text-[11px] font-data-mono text-on-surface-variant/50">
      <p>• Minimax sweeps all $b^d$ legal continuation paths.</p>
      <p>• Alpha-Beta eliminates branches mathematically unable to alter the minimax value.</p>
      <p>• Move ordering sorts promising killer moves first for maximal early branch pruning.</p>
    </div>
  </div>

  <!-- Results Table & Visualization Column -->
  <div class="lg:col-span-8 flex flex-col gap-space-md" id="compare-results">
    <div class="p-space-xl bg-surface-container-lowest/50 border border-outline-variant/15 rounded flex flex-col items-center justify-center text-center">
      <span class="font-kanji-accent text-kanji-accent text-tertiary/60 animate-pulse">剪定</span>
      <span class="font-data-mono text-data-mono text-on-surface-variant/50 mt-space-xs">READY TO INITIALIZE RECURSIVE SWEEP</span>
    </div>
  </div>
</div>`;
}

async function workshopRunCompare() {
  const container = document.getElementById('compare-results');
  const btn = document.getElementById('btn-run-compare');
  const h = document.getElementById('cmp-heuristic')?.value || 'aggressive';
  const maxDepth = +(document.getElementById('cmp-depth')?.value || 5);

  if (btn) btn.disabled = true;
  if (container) {
    container.innerHTML = `
      <div class="p-space-xl bg-surface-container-lowest/50 border border-outline-variant/15 rounded flex flex-col items-center justify-center gap-space-sm">
        <span class="material-symbols-outlined text-secondary animate-spin text-[32px]">sync</span>
        <span class="font-data-mono text-data-mono text-secondary tracking-widest uppercase">EXECUTING DEPTH 1..${maxDepth} SWEEP</span>
        <span class="font-data-mono text-[10px] text-on-surface-variant/40">CALCULATING MINIMAX ≡ ALPHA-BETA EQUIVALENCE</span>
      </div>`;
  }

  try {
    // Generate standard test state
    const initState = K.game.view?.state || {
      n: 7,
      blocked: [10, 38],
      pos: [45, 3],
      turn: 0
    };

    const res = await API.labCompare({
      state: initState,
      max_depth: maxDepth,
      heuristic: h,
    });

    container.dataset.loaded = 'true';
    container.innerHTML = _renderCompareTable(res.rows);
  } catch (e) {
    container.innerHTML = `<div class="p-space-md bg-error-container/20 text-error font-data-mono text-data-mono">Error: ${e.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _renderCompareTable(rows) {
  let tableRows = rows.map(r => {
    const mm = r.minimax.nodes.toLocaleString();
    const ab = r.alphabeta.nodes.toLocaleString();
    const abo = r.alphabeta_ordered.nodes.toLocaleString();
    const speedup = r.speedup ? `${r.speedup}x` : '—';
    const speedupOrd = r.speedup_ordered ? `${r.speedup_ordered}x` : '—';
    const agreePill = r.agree 
      ? `<span class="text-secondary text-[10px] font-bold">100% IDENTICAL</span>`
      : `<span class="text-error text-[10px]">MISMATCH</span>`;

    return `
      <tr class="border-b border-outline-variant/10 font-data-mono text-data-mono hover:bg-surface-container-low/30">
        <td class="py-2.5 px-3 text-tertiary">PLY 0${r.depth}</td>
        <td class="py-2.5 px-3 text-on-surface-variant/80">${mm}</td>
        <td class="py-2.5 px-3 text-secondary/90">${ab}</td>
        <td class="py-2.5 px-3 text-primary/90 font-medium">${abo}</td>
        <td class="py-2.5 px-3 text-secondary">${speedup}</td>
        <td class="py-2.5 px-3 text-primary font-bold">${speedupOrd}</td>
        <td class="py-2.5 px-3 text-right">${agreePill}</td>
      </tr>`;
  }).join('');

  // Top highlight stats from deepest ply
  const deepest = rows[rows.length - 1];
  const maxSpeedup = deepest?.speedup_ordered || 1;

  return `
<div class="flex flex-col gap-space-md">
  <!-- Key takeaway cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
    <div class="p-space-sm bg-surface-container-low border border-outline-variant/15 rounded flex flex-col">
      <span class="font-data-mono text-[10px] text-on-surface-variant/50 uppercase">MAX NODE REDUCTION</span>
      <span class="font-headline-sm text-headline-sm text-primary font-light">${maxSpeedup}x FASTER</span>
    </div>
    <div class="p-space-sm bg-surface-container-low border border-outline-variant/15 rounded flex flex-col">
      <span class="font-data-mono text-[10px] text-on-surface-variant/50 uppercase">MATHEMATICAL VALUE</span>
      <span class="font-headline-sm text-headline-sm text-secondary font-light">EXACTLY EQUIVALENT</span>
    </div>
    <div class="p-space-sm bg-surface-container-low border border-outline-variant/15 rounded flex flex-col">
      <span class="font-data-mono text-[10px] text-on-surface-variant/50 uppercase">BRANCHING FACTOR</span>
      <span class="font-headline-sm text-headline-sm text-tertiary font-light">b* ≈ ${deepest?.alphabeta_ordered?.effective_branching || '—'}</span>
    </div>
  </div>

  <!-- Detailed Table -->
  <div class="w-full overflow-x-auto bg-surface-container-lowest border border-outline-variant/15 rounded">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/20 font-label-caps text-label-caps text-on-surface-variant/50 tracking-wider">
          <th class="py-2 px-3">DEPTH</th>
          <th class="py-2 px-3">MINIMAX NODES</th>
          <th class="py-2 px-3">ALPHA-BETA</th>
          <th class="py-2 px-3">+ ORDERING</th>
          <th class="py-2 px-3">SPEEDUP</th>
          <th class="py-2 px-3">ORDERED SPEEDUP</th>
          <th class="py-2 px-3 text-right">CONVERGENCE</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
</div>`;
}

// ───────────────────────────────────────────────────────────────────────────
// 02 TOURNAMENT: Heuristic Round-Robin Coliseum
// ───────────────────────────────────────────────────────────────────────────
function _workshopTournamentHTML() {
  return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
  <!-- Config Column -->
  <div class="lg:col-span-4 flex flex-col gap-space-md bg-surface-container-low/50 p-space-md border border-outline-variant/15 rounded">
    <div class="flex items-center justify-between">
      <span class="font-label-caps text-label-caps text-tertiary tracking-widest uppercase">COLISEUM RIG</span>
      <span class="font-data-mono text-[10px] text-on-surface-variant/50">ALL-PLAY-ALL</span>
    </div>
    
    <div class="flex flex-col gap-space-xs font-data-mono text-data-mono">
      <label class="text-on-surface-variant/70">SEARCH HORIZON (PLY)</label>
      <select id="tourn-depth" class="bg-surface-container-high px-space-sm py-1.5 rounded border border-outline-variant/20 text-on-surface focus:outline-none">
        <option value="2">Depth 2 (Rapid)</option>
        <option value="3" selected>Depth 3 (Balanced)</option>
        <option value="4">Depth 4 (Deep Analysis)</option>
      </select>
    </div>

    <div class="flex flex-col gap-space-xs font-data-mono text-data-mono">
      <label class="text-on-surface-variant/70">MATCHES PER PAIR (COLOUR-SWAPPED)</label>
      <select id="tourn-games" class="bg-surface-container-high px-space-sm py-1.5 rounded border border-outline-variant/20 text-on-surface focus:outline-none">
        <option value="2" selected>2 Games (1 each as P0 / P1)</option>
        <option value="4">4 Games (Stochastic seed variance)</option>
      </select>
    </div>

    <button onclick="workshopRunTournament()" id="btn-run-tourn"
      class="mt-space-xs py-space-sm px-space-md bg-surface-container-high hover:bg-surface-container-highest transition-all rounded font-label-caps text-label-caps text-tertiary tracking-wider border border-tertiary/30 flex items-center justify-center gap-space-xs">
      <span class="material-symbols-outlined text-[16px]">military_tech</span>
      COMMENCE TOURNAMENT
    </button>
  </div>

  <!-- Tournament Matrix / Heatmap Output -->
  <div class="lg:col-span-8 flex flex-col gap-space-md" id="tournament-results">
    <div class="p-space-xl bg-surface-container-lowest/50 border border-outline-variant/15 rounded flex flex-col items-center justify-center text-center">
      <span class="font-kanji-accent text-kanji-accent text-tertiary/60">闘技</span>
      <span class="font-data-mono text-data-mono text-on-surface-variant/50 mt-space-xs">READY FOR HEURISTIC ROUND-ROBIN</span>
    </div>
  </div>
</div>`;
}

async function workshopRunTournament() {
  const container = document.getElementById('tournament-results');
  const btn = document.getElementById('btn-run-tourn');
  const depth = +(document.getElementById('tourn-depth')?.value || 3);
  const games = +(document.getElementById('tourn-games')?.value || 2);

  if (btn) btn.disabled = true;
  if (container) {
    container.innerHTML = `
      <div class="p-space-xl bg-surface-container-lowest/50 border border-outline-variant/15 rounded flex flex-col items-center justify-center gap-space-sm">
        <span class="material-symbols-outlined text-tertiary animate-spin text-[32px]">sync</span>
        <span class="font-data-mono text-data-mono text-tertiary tracking-widest uppercase">SIMULATING TOURNAMENT ROUNDS</span>
        <span class="font-data-mono text-[10px] text-on-surface-variant/40">COLOR-SWAPPED FAIRNESS ACTIVE</span>
      </div>`;
  }

  try {
    const res = await API.labTournament({
      heuristics: ['mobility', 'aggressive', 'defensive', 'lookahead', 'territory'],
      depth: depth,
      games_per_pair: games,
      n: 7,
      holes: 2,
      seed: 42,
    });

    container.innerHTML = _renderTournamentMatrix(res);
  } catch (e) {
    container.innerHTML = `<div class="p-space-md bg-error-container/20 text-error font-data-mono text-data-mono">Error: ${e.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _renderTournamentMatrix(res) {
  const keys = res.keys;
  const rates = res.win_rate;
  const overall = res.overall;

  // Header cells
  const thCols = keys.map(k => `<th class="py-2 px-3 text-center uppercase">${k.slice(0, 4)}</th>`).join('');

  // Matrix rows
  const trRows = keys.map(rowKey => {
    const cells = keys.map(colKey => {
      if (rowKey === colKey) {
        return `<td class="py-2.5 px-3 text-center text-on-surface-variant/20 font-data-mono text-data-mono bg-surface-container-lowest">—</td>`;
      }
      const rate = rates[rowKey]?.[colKey];
      const valStr = rate !== null && rate !== undefined ? `${(rate * 100).toFixed(0)}%` : '—';
      const isDominant = rate >= 0.5;
      const cellBg = rate >= 0.75 ? 'bg-tertiary/20 text-tertiary font-bold'
                   : rate >= 0.5  ? 'bg-secondary/15 text-secondary'
                   : 'text-on-surface-variant/50';
      return `<td class="py-2.5 px-3 text-center font-data-mono text-data-mono ${cellBg}">${valStr}</td>`;
    }).join('');

    const ovr = overall[rowKey] !== null ? `${(overall[rowKey] * 100).toFixed(1)}%` : '—';

    return `
      <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low/40">
        <td class="py-2.5 px-3 font-title-editorial text-title-editorial text-on-surface capitalize">${rowKey}</td>
        ${cells}
        <td class="py-2.5 px-3 text-center font-data-mono text-data-mono text-primary font-bold">${ovr}</td>
      </tr>`;
  }).join('');

  // Ranked order
  const ranked = [...keys].sort((a, b) => (overall[b] || 0) - (overall[a] || 0));
  const victor = ranked[0];

  return `
<div class="flex flex-col gap-space-md">
  <!-- Leaderboard Crown -->
  <div class="p-space-md bg-surface-container-low border border-tertiary/30 rounded flex items-center justify-between">
    <div class="flex items-center gap-space-md">
      <span class="font-kanji-accent text-kanji-accent text-tertiary text-2xl">冠</span>
      <div class="flex flex-col">
        <span class="font-label-caps text-label-caps text-tertiary uppercase">REIGNING PHILOSOPHY</span>
        <span class="font-headline-sm text-headline-sm text-on-surface capitalize">${victor} (${(overall[victor]*100).toFixed(1)}% WIN RATE)</span>
      </div>
    </div>
    <span class="font-data-mono text-[10px] text-on-surface-variant/50">ROUNDS EXHAUSTED</span>
  </div>

  <!-- Heatmap Matrix -->
  <div class="w-full overflow-x-auto bg-surface-container-lowest border border-outline-variant/15 rounded">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/20 font-label-caps text-label-caps text-on-surface-variant/50 tracking-wider">
          <th class="py-2 px-3">ROW VS COL</th>
          ${thCols}
          <th class="py-2 px-3 text-center text-primary">OVERALL</th>
        </tr>
      </thead>
      <tbody>
        ${trRows}
      </tbody>
    </table>
  </div>
</div>`;
}

// ───────────────────────────────────────────────────────────────────────────
// 03 DUEL & TIME-LAPSE: AI vs. AI Clash & Playback
// ───────────────────────────────────────────────────────────────────────────
function _workshopDuelHTML() {
  return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
  <!-- Duel Matchmaker -->
  <div class="lg:col-span-4 flex flex-col gap-space-md bg-surface-container-low/50 p-space-md border border-outline-variant/15 rounded">
    <div class="flex items-center justify-between">
      <span class="font-label-caps text-label-caps text-primary tracking-widest uppercase">MATCHMAKER</span>
      <span class="font-data-mono text-[10px] text-on-surface-variant/50">SYNTHETIC CLASH</span>
    </div>

    <!-- Gladiator A -->
    <div class="flex flex-col gap-space-xs p-space-sm bg-surface-container-lowest/60 border-l-2 border-primary">
      <span class="font-data-mono text-[10px] text-primary">GLADIATOR A (WHITE / MOVES FIRST)</span>
      <select id="duel-heura" class="bg-surface-container-high px-space-sm py-1 rounded border border-outline-variant/20 font-data-mono text-data-mono text-on-surface">
        <option value="territory" selected>Cartographer (Territory)</option>
        <option value="aggressive">Predator (Aggressive)</option>
        <option value="lookahead">Far Sight (Lookahead)</option>
        <option value="defensive">Hermit (Defensive)</option>
        <option value="mobility">Even Hand (Mobility)</option>
      </select>
      <div class="flex justify-between font-data-mono text-[10px] text-on-surface-variant/60 pt-1">
        <span>PLY HORIZON:</span>
        <select id="duel-deptha" class="bg-surface-container-high px-1 text-on-surface">
          <option value="3">3</option>
          <option value="4" selected>4</option>
          <option value="5">5</option>
        </select>
      </div>
    </div>

    <!-- Gladiator B -->
    <div class="flex flex-col gap-space-xs p-space-sm bg-surface-container-lowest/60 border-l-2 border-secondary">
      <span class="font-data-mono text-[10px] text-secondary">GLADIATOR B (BLACK)</span>
      <select id="duel-heurb" class="bg-surface-container-high px-space-sm py-1 rounded border border-outline-variant/20 font-data-mono text-data-mono text-on-surface">
        <option value="aggressive" selected>Predator (Aggressive)</option>
        <option value="territory">Cartographer (Territory)</option>
        <option value="lookahead">Far Sight (Lookahead)</option>
        <option value="defensive">Hermit (Defensive)</option>
        <option value="mobility">Even Hand (Mobility)</option>
      </select>
      <div class="flex justify-between font-data-mono text-[10px] text-on-surface-variant/60 pt-1">
        <span>PLY HORIZON:</span>
        <select id="duel-depthb" class="bg-surface-container-high px-1 text-on-surface">
          <option value="3">3</option>
          <option value="4" selected>4</option>
          <option value="5">5</option>
        </select>
      </div>
    </div>

    <button onclick="workshopRunDuel()" id="btn-run-duel"
      class="mt-space-xs py-space-sm px-space-md bg-surface-container-high hover:bg-surface-container-highest transition-all rounded font-label-caps text-label-caps text-primary tracking-wider border border-primary/30 flex items-center justify-center gap-space-xs">
      <span class="material-symbols-outlined text-[16px]">sports_martial_arts</span>
      IGNITE SYNTHETIC CLASH
    </button>
  </div>

  <!-- Duel Arena Visualizer -->
  <div class="lg:col-span-8 flex flex-col gap-space-md" id="duel-stage">
    <div class="p-space-xl bg-surface-container-lowest/50 border border-outline-variant/15 rounded flex flex-col items-center justify-center text-center">
      <span class="font-kanji-accent text-kanji-accent text-tertiary/60">激突</span>
      <span class="font-data-mono text-data-mono text-on-surface-variant/50 mt-space-xs">SELECT OPPOSING MINDS &amp; CLASH</span>
    </div>
  </div>
</div>`;
}

async function workshopRunDuel() {
  const stage = document.getElementById('duel-stage');
  const btn = document.getElementById('btn-run-duel');
  const a = document.getElementById('duel-heura')?.value || 'territory';
  const b = document.getElementById('duel-heurb')?.value || 'aggressive';
  const depthA = +(document.getElementById('duel-deptha')?.value || 4);
  const depthB = +(document.getElementById('duel-depthb')?.value || 4);

  if (btn) btn.disabled = true;
  if (stage) {
    stage.innerHTML = `
      <div class="p-space-xl bg-surface-container-lowest/50 border border-outline-variant/15 rounded flex flex-col items-center justify-center gap-space-sm">
        <span class="material-symbols-outlined text-primary animate-spin text-[32px]">sync</span>
        <span class="font-data-mono text-data-mono text-primary tracking-widest uppercase">SIMULATING AUTONOMOUS DUEL</span>
        <span class="font-data-mono text-[10px] text-on-surface-variant/40">GENERATING MOVE BY MOVE TRAJECTORY</span>
      </div>`;
  }

  try {
    const duelRes = await API.labDuel({
      a: a,
      b: b,
      depth_a: depthA,
      depth_b: depthB,
      n: 7,
      holes: 2,
      seed: Math.floor(Math.random() * 9999),
    });

    _duelPlayback.game = duelRes;
    _duelPlayback.step = duelRes.moves.length;
    _duelPlayback.isPlaying = false;

    _workshopRenderDuelBoard();
  } catch (e) {
    stage.innerHTML = `<div class="p-space-md bg-error-container/20 text-error font-data-mono text-data-mono">Duel Error: ${e.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _workshopRenderDuelBoard() {
  const stage = document.getElementById('duel-stage');
  const game = _duelPlayback.game;
  if (!stage || !game) return;

  const n = game.start.n;
  const totalSteps = game.moves.length;
  const curStep = _duelPlayback.step;
  const winner = game.winner;

  // Reconstruct board at current step
  const initialBlocked = new Set(game.start.blocked);
  const curBlocked = new Set(initialBlocked);
  let p0 = game.start.pos[0];
  let p1 = game.start.pos[1];

  for (let i = 0; i < curStep; i++) {
    const m = game.moves[i];
    curBlocked.add(m.from);
    if (m.player === 0) p0 = m.to;
    else p1 = m.to;
  }

  // Draw grid
  let cellsHTML = '';
  for (let sq = 0; sq < n * n; sq++) {
    if (curBlocked.has(sq)) {
      cellsHTML += `<div class="relative bg-surface-container-lowest/30 rounded aspect-square">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          <path d="${_goldVein(sq)}" stroke="#ebc166" stroke-width="1.6" fill="none" opacity="0.6"/>
        </svg>
      </div>`;
    } else if (sq === p0) {
      cellsHTML += `<div class="relative bg-surface-container rounded aspect-square flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(243,98,56,0.8)]">
          <span style="font-size:10px;color:#3b0900;font-weight:bold;">A</span>
        </div>
      </div>`;
    } else if (sq === p1) {
      cellsHTML += `<div class="relative bg-surface-container rounded aspect-square flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shadow-[0_0_12px_rgba(155,210,191,0.8)]">
          <span style="font-size:10px;color:#002018;font-weight:bold;">B</span>
        </div>
      </div>`;
    } else {
      cellsHTML += `<div class="bg-surface-container-high/60 rounded aspect-square"></div>`;
    }
  }

  stage.innerHTML = `
<div class="flex flex-col gap-space-sm bg-surface-container-lowest border border-outline-variant/15 p-space-md rounded">
  <!-- Top Bar -->
  <div class="flex items-center justify-between pb-space-xs border-b border-outline-variant/10">
    <div class="flex items-center gap-space-sm font-data-mono text-data-mono">
      <span class="text-primary font-bold">A: ${_duelPlayback.game.a_is_player === 0 ? 'WHITE' : 'BLACK'}</span>
      <span class="text-on-surface-variant/40">VS</span>
      <span class="text-secondary font-bold">B: ${_duelPlayback.game.b_is_player === 1 ? 'BLACK' : 'WHITE'}</span>
    </div>
    <div class="font-data-mono text-data-mono text-tertiary">
      ${curStep === totalSteps ? `VICTOR: GLADIATOR ${winner === 0 ? 'A' : 'B'}` : `CYCLE ${curStep} / ${totalSteps}`}
    </div>
  </div>

  <!-- Visual Slate -->
  <div class="max-w-[420px] w-full mx-auto aspect-square grid gap-1.5 p-2 bg-surface-container-low rounded"
    style="grid-template-columns: repeat(${n}, minmax(0, 1fr));">
    ${cellsHTML}
  </div>

  <!-- Playback Scrubber & Controls -->
  <div class="flex flex-col gap-space-xs pt-space-xs">
    <input type="range" min="0" max="${totalSteps}" value="${curStep}"
      oninput="workshopDuelScrub(this.value)"
      class="w-full h-1 bg-surface-container appearance-none cursor-pointer accent-tertiary">
    <div class="flex items-center justify-between font-data-mono text-data-mono">
      <div class="flex items-center gap-space-xs">
        <button onclick="workshopDuelStep(-1)" class="px-space-sm py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px]">◄ STEP</button>
        <button onclick="workshopDuelTogglePlay()" id="btn-duel-play" class="px-space-md py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-tertiary">
          ${_duelPlayback.isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button onclick="workshopDuelStep(1)" class="px-space-sm py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px]">STEP ►</button>
      </div>
      <span class="text-[10px] text-on-surface-variant/50">${curStep} / ${totalSteps} PLIES</span>
    </div>
  </div>
</div>`;
}

function workshopDuelScrub(val) {
  _duelPlayback.step = +val;
  _workshopRenderDuelBoard();
}

function workshopDuelStep(dir) {
  const next = _duelPlayback.step + dir;
  if (next >= 0 && next <= _duelPlayback.game.moves.length) {
    _duelPlayback.step = next;
    _workshopRenderDuelBoard();
  }
}

function workshopDuelTogglePlay() {
  _duelPlayback.isPlaying = !_duelPlayback.isPlaying;
  const btn = document.getElementById('btn-duel-play');
  if (btn) btn.textContent = _duelPlayback.isPlaying ? 'PAUSE' : 'PLAY';

  if (_duelPlayback.isPlaying) {
    if (_duelPlayback.step >= _duelPlayback.game.moves.length) {
      _duelPlayback.step = 0;
    }
    _duelPlayback.timer = setInterval(() => {
      if (_duelPlayback.step < _duelPlayback.game.moves.length) {
        _duelPlayback.step++;
        _workshopRenderDuelBoard();
      } else {
        clearInterval(_duelPlayback.timer);
        _duelPlayback.isPlaying = false;
        const b = document.getElementById('btn-duel-play');
        if (b) b.textContent = 'PLAY';
      }
    }, 450);
  } else {
    clearInterval(_duelPlayback.timer);
  }
}
