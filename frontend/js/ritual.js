// ritual.js — Screen 01: Setup / configuration
// Wires to GET /api/heuristics (already loaded) and POST /api/new on launch.

// ─── Render ────────────────────────────────────────────────────────────────
function ritualRender() {
  return `
<div class="flex flex-col w-full text-on-surface select-none">

  <!-- Atmospheric SVG underlay -->
  <div class="relative w-full overflow-hidden px-margin-mobile lg:px-margin py-space-lg lg:py-space-xl">
    <div class="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      <svg class="w-full h-full" fill="none" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient cx="65%" cy="35%" id="fogGlow" r="50%">
            <stop offset="0%" stop-color="#ebc166" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="#0f0e0d" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="goldCrack" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#ebc166" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#ebc166" stop-opacity="0.1"/>
          </linearGradient>
        </defs>
        <rect fill="url(#fogGlow)" height="100%" width="100%"/>
        <g stroke-width="0.8" transform="translate(820,160) scale(0.95)">
          <polygon fill="#1d1b1a" fill-opacity="0.75" points="180,40 320,110 200,180 60,110"/>
          <path d="M110,90 Q170,120 200,180 M170,120 Q230,100 280,125" stroke="url(#goldCrack)" stroke-width="1.2"/>
          <polygon fill="#211f1e" fill-opacity="0.5" points="340,120 480,190 360,260 220,190"/>
          <polygon fill="#211f1e" fill-opacity="0.85" points="210,205 350,275 230,345 90,275"/>
          <path d="M140,250 L210,290 L290,260" stroke="#ebc166" stroke-width="1.5"/>
          <circle cx="210" cy="290" fill="#ebc166" r="2.5"/>
        </g>
      </svg>
    </div>

    <div class="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-start">

      <!-- LEFT PILLAR -->
      <aside class="hidden lg:flex lg:col-span-1 flex-col items-center justify-between self-stretch py-space-sm">
        <div class="flex flex-col items-center gap-space-md">
          <span class="font-data-mono text-data-mono text-on-surface-variant/40 tracking-widest uppercase">01</span>
          <div class="w-px h-16 bg-outline-variant/30"></div>
          <span class="font-kanji-accent text-kanji-accent text-tertiary select-none">儀式</span>
        </div>
        <div class="my-space-xl [writing-mode:vertical-rl] rotate-180 flex items-center gap-space-md">
          <span class="font-title-editorial text-headline-sm text-on-surface tracking-widest uppercase opacity-85">KINTSUGI PROTOCOL</span>
          <span class="font-data-mono text-data-mono text-on-surface-variant/50 tracking-wider">INITIATION SEQUENCE</span>
        </div>
        <div class="flex flex-col items-center gap-space-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
          <div class="w-px h-20 bg-outline-variant/30"></div>
          <span class="font-data-mono text-data-mono text-on-surface-variant/30 uppercase">[SYS]</span>
        </div>
      </aside>

      <!-- MAIN CONFIG COLUMN -->
      <div class="lg:col-span-8 flex flex-col gap-space-xl">

        <!-- Section lead -->
        <header class="flex flex-col gap-space-xs">
          <div class="flex items-center gap-space-sm">
            <span class="font-data-mono text-data-mono text-primary tracking-widest uppercase">RITUAL OF THE VOID</span>
            <div class="w-8 h-px bg-primary/40"></div>
            <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">CANONICAL SETUP</span>
          </div>
          <h1 class="font-display-hero text-headline-lg lg:text-display-hero text-on-surface tracking-tight font-normal">Preparing the Vanishing Floor</h1>
          <p class="font-title-editorial text-title-editorial text-on-surface-variant/80 max-w-2xl italic font-light">
            Every step consumes the earth beneath. Bind parameters to calibrate stone fracture depth, machine precognition, and the initial scars across the slate.
          </p>
        </header>

        <!-- 01 BOARD SIZE + FAULTS -->
        <section class="flex flex-col gap-space-lg pt-space-lg border-t border-outline-variant/15">
          <div class="flex items-baseline justify-between">
            <div class="flex items-center gap-space-sm">
              <span class="font-data-mono text-data-mono text-tertiary/70">01.0</span>
              <h2 class="font-label-caps text-label-caps text-on-surface-variant/80 tracking-widest uppercase">Basalt Geometry &amp; Pre-Faults</h2>
            </div>
            <span class="font-data-mono text-data-mono text-secondary/70" id="board-summary-pill">7 × 7 SLATE • 49 PLATES</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
            <!-- Size buttons -->
            <div class="md:col-span-6 flex items-center justify-between gap-space-xs" id="size-btns">
              ${_ritualSizeBtns()}
            </div>
            <!-- Fault slider -->
            <div class="md:col-span-6 flex flex-col gap-space-xs">
              <div class="flex items-center justify-between font-data-mono text-data-mono">
                <span class="text-on-surface-variant/60">PRE-BROKEN FAULTS</span>
                <span class="text-primary/90" id="fault-readout">2 PAIRS (4 TILES DISSOLVED)</span>
              </div>
              <input id="fault-slider" type="range" min="0" max="8" step="1" value="2"
                class="w-full h-1 bg-surface-container appearance-none cursor-pointer accent-primary/80">
              <div class="flex justify-between font-data-mono text-[9px] text-on-surface-variant/40 uppercase">
                <span>Virgin (0)</span><span>Balanced (2)</span><span>Chasm (8)</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 02+03 FIRST MOVE + SOLVER -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-space-lg pt-space-lg border-t border-outline-variant/15">
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center gap-space-sm">
              <span class="font-data-mono text-data-mono text-tertiary/70">02.0</span>
              <h2 class="font-label-caps text-label-caps text-on-surface-variant/80 tracking-widest uppercase">Temporal First Strike</h2>
            </div>
            <p class="font-data-mono text-data-mono text-on-surface-variant/50">Who leaves the first footprint upon untouched ground.</p>
            <div class="grid grid-cols-2 gap-space-xs p-1 bg-surface-container-lowest/60 border border-outline-variant/15">
              <button id="turn-human" onclick="ritualSelectFirst(0)" class="flex items-center justify-between p-space-sm bg-surface-container-low transition-all">
                <div class="flex items-center gap-space-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary/90"></span>
                  <span class="font-label-caps text-label-caps text-primary/90 tracking-wider">HUMAN</span>
                </div>
                <span class="font-kanji-accent text-data-mono text-primary/70">人</span>
              </button>
              <button id="turn-machine" onclick="ritualSelectFirst(1)" class="flex items-center justify-between p-space-sm hover:bg-surface-container-low/40 opacity-40 transition-all">
                <div class="flex items-center gap-space-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-secondary/80"></span>
                  <span class="font-label-caps text-label-caps text-secondary/80 tracking-wider">MACHINE</span>
                </div>
                <span class="font-kanji-accent text-data-mono text-secondary/60">機</span>
              </button>
            </div>
          </div>
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center gap-space-sm">
              <span class="font-data-mono text-data-mono text-tertiary/70">03.0</span>
              <h2 class="font-label-caps text-label-caps text-on-surface-variant/80 tracking-widest uppercase">The Machine's Logic</h2>
            </div>
            <p class="font-data-mono text-data-mono text-secondary/70" id="solver-note">Alpha-Beta: prunes dead branches, same answer as minimax.</p>
            <div class="grid grid-cols-2 gap-space-xs p-1 bg-surface-container-lowest/60 border border-outline-variant/15">
              <button id="btn-alphabeta" onclick="ritualSelectSolver('alphabeta')" class="flex flex-col p-space-sm bg-surface-container-low text-left transition-all">
                <span class="font-label-caps text-label-caps text-secondary/90 tracking-wider">ALPHA-BETA</span>
                <span class="font-data-mono text-[9px] text-on-surface-variant/40">PRUNES DEAD BRANCHES</span>
              </button>
              <button id="btn-minimax" onclick="ritualSelectSolver('minimax')" class="flex flex-col p-space-sm hover:bg-surface-container-low/40 text-left opacity-40 transition-all">
                <span class="font-label-caps text-label-caps text-on-surface-variant/60 tracking-wider">MINIMAX</span>
                <span class="font-data-mono text-[9px] text-on-surface-variant/40">BRUTE RECURSIVE SWEEP</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 04 HEURISTICS -->
        <section class="flex flex-col gap-space-md pt-space-lg border-t border-outline-variant/15">
          <div class="flex items-baseline justify-between">
            <div class="flex items-center gap-space-sm">
              <span class="font-data-mono text-data-mono text-tertiary/70">04.0</span>
              <h2 class="font-label-caps text-label-caps text-on-surface-variant/80 tracking-widest uppercase">Its Way of Seeing</h2>
            </div>
            <span class="font-data-mono text-data-mono text-on-surface-variant/40">[MUTUALLY EXCLUSIVE]</span>
          </div>
          <div class="flex flex-col divide-y divide-outline-variant/15 border border-outline-variant/15 bg-surface-container-lowest/30" id="heuristic-list">
            ${_ritualHeuristicRows()}
          </div>
        </section>

        <!-- 05 DEPTH + TIME + TOGGLES -->
        <section class="grid grid-cols-1 md:grid-cols-12 gap-space-lg pt-space-lg border-t border-outline-variant/15">
          <div class="md:col-span-5 flex flex-col items-center justify-center p-space-md bg-surface-container-lowest/50 border border-outline-variant/15 relative overflow-hidden">
            <span class="font-label-caps text-label-caps text-on-surface-variant/40 tracking-widest uppercase mb-space-sm">PLY RECURSION SPHERE</span>
            <div class="relative w-36 h-36 flex items-center justify-center my-space-xs">
              <div class="absolute inset-0 rounded-full border border-outline-variant/15"></div>
              <div class="absolute inset-3 rounded-full border border-outline-variant/20"></div>
              <div class="absolute inset-6 rounded-full border border-outline-variant/25"></div>
              <div class="absolute inset-9 rounded-full border border-tertiary/20"></div>
              <div class="absolute inset-12 rounded-full border border-tertiary/40"></div>
              <div class="flex flex-col items-center justify-center">
                <span class="font-display-hero text-headline-lg text-primary/90 font-light leading-none" id="depth-visual-val">5</span>
                <span class="font-data-mono text-[9px] text-on-surface-variant/50 tracking-widest uppercase mt-0.5">PLIES</span>
              </div>
            </div>
          </div>
          <div class="md:col-span-7 flex flex-col justify-between gap-space-md">
            <div class="flex flex-col gap-space-xs">
              <div class="flex items-center justify-between font-data-mono text-data-mono">
                <span class="text-on-surface-variant/70">RECURSION DEPTH</span>
                <span class="text-tertiary/90" id="depth-readout">DEPTH 5 / 10</span>
              </div>
              <input id="depth-slider" type="range" min="1" max="10" step="1" value="5"
                class="w-full h-1 bg-surface-container appearance-none cursor-pointer accent-tertiary/80">
              <div class="flex justify-between font-data-mono text-[9px] text-on-surface-variant/40">
                <span>01 (INSTANT)</span><span>05 (MODERATE)</span><span>10 (EXHAUSTIVE)</span>
              </div>
            </div>
            <div class="flex flex-col gap-space-xs">
              <div class="flex items-center justify-between font-data-mono text-data-mono">
                <span class="text-on-surface-variant/70">TIME BUDGET PER MOVE</span>
                <span class="text-secondary/80" id="time-readout">3.0s ALLOTTED</span>
              </div>
              <input id="time-slider" type="range" min="0.5" max="10" step="0.5" value="3"
                class="w-full h-1 bg-surface-container appearance-none cursor-pointer accent-secondary/70">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
              <label class="flex items-center gap-space-xs cursor-pointer">
                <input id="chk-iterative" type="checkbox" checked class="w-3.5 h-3.5 accent-tertiary/70 cursor-pointer">
                <span class="font-data-mono text-data-mono text-on-surface-variant/70 hover:text-on-surface transition-colors">Iterative Deepening</span>
              </label>
              <label class="flex items-center gap-space-xs cursor-pointer">
                <input id="chk-ordering" type="checkbox" checked class="w-3.5 h-3.5 accent-primary/70 cursor-pointer">
                <span class="font-data-mono text-data-mono text-on-surface-variant/70 hover:text-on-surface transition-colors">Move-Ordering Heuristic</span>
              </label>
            </div>
          </div>
        </section>

        <!-- 06 PRESETS + LAUNCH -->
        <section class="flex flex-col gap-space-lg pt-space-md border-t border-outline-variant/25">
          <div class="flex flex-wrap items-center justify-between gap-space-sm">
            <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">CANONICAL RIGS:</span>
            <div class="flex items-center gap-space-lg">
              <button onclick="ritualPreset('gentle')" class="font-data-mono text-data-mono text-on-surface-variant hover:text-secondary underline decoration-outline-variant/30 underline-offset-4 transition-colors">'GENTLE' (Ply 2 / Even Hand)</button>
              <span class="text-outline-variant/30">•</span>
              <button onclick="ritualPreset('sharp')" class="font-data-mono text-data-mono text-tertiary underline decoration-tertiary/40 underline-offset-4 transition-colors">'SHARP' (Ply 5 / Cartographer)</button>
              <span class="text-outline-variant/30">•</span>
              <button onclick="ritualPreset('merciless')" class="font-data-mono text-data-mono text-primary underline decoration-primary/40 underline-offset-4 transition-colors">'MERCILESS' (Ply 8 / Cartographer)</button>
            </div>
          </div>
          <div class="w-full pt-space-sm">
            <button id="begin-ritual-btn" onclick="ritualLaunch()" class="relative group w-full py-space-md px-space-lg bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tertiary to-transparent group-hover:h-[2px] transition-all"></div>
              <div class="flex items-center gap-space-md">
                <span class="font-kanji-accent text-kanji-accent text-tertiary transition-transform group-hover:scale-110">始</span>
                <div class="flex flex-col text-left">
                  <span class="font-headline-sm text-headline-sm text-on-surface tracking-widest font-normal group-hover:text-primary transition-colors">COMMENCE RITUAL</span>
                  <span class="font-data-mono text-data-mono text-on-surface-variant/50">SEAL ARENA CONSTANTS &amp; ENTER DECAY CYCLE</span>
                </div>
              </div>
              <div class="flex items-center gap-space-sm">
                <span id="ritual-ready-label" class="hidden sm:inline font-data-mono text-data-mono text-tertiary tracking-widest uppercase">READY</span>
                <span class="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
              <div class="absolute bottom-0 left-0 w-full h-[1px] bg-outline-variant/20 group-hover:bg-primary/50 transition-colors"></div>
            </button>
            <div id="ritual-error" class="hidden mt-space-xs font-data-mono text-data-mono text-error px-space-md py-space-xs bg-error-container/20"></div>
          </div>
        </section>
      </div>

      <!-- RIGHT COLUMN: minimap + philosophy + stats -->
      <aside class="lg:col-span-3 flex flex-col gap-space-lg">
        <div class="flex flex-col p-space-md bg-surface-container-lowest/40 border border-outline-variant/15 gap-space-sm">
          <div class="flex items-center justify-between">
            <span class="font-label-caps text-label-caps text-on-surface-variant/50 tracking-wider uppercase">ARENA FOOTPRINT</span>
            <span class="font-data-mono text-data-mono text-tertiary/70">PREVIEW</span>
          </div>
          <div class="w-full aspect-square bg-surface-container-lowest p-2" id="minimap-grid" style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;"></div>
          <div class="flex items-center justify-between font-data-mono text-[10px] text-on-surface-variant/40 pt-1">
            <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-primary/70 inline-block"></span><span>HUMAN</span></div>
            <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-secondary/70 inline-block"></span><span>MACHINE</span></div>
            <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-surface-container-lowest inline-block opacity-25"></span><span>FAULT</span></div>
          </div>
        </div>
        <div class="flex flex-col gap-space-xs p-space-md bg-surface-container-low/20 border-l border-outline-variant/15">
          <span class="font-data-mono text-data-mono text-tertiary/60 tracking-widest uppercase">THE PHILOSOPHY</span>
          <p class="font-title-editorial text-body-default text-on-surface-variant/80 italic leading-relaxed">
            "In Kintsugi, an abyss is not merely an absence of stone. It is a monument to where weight once stood. Move without hesitation, for the floor remembers nothing but your surrender."
          </p>
          <span class="font-data-mono text-[9px] text-on-surface-variant/30 mt-space-xs tracking-widest uppercase">— THE BASALT CODEX, FOLIO IV</span>
        </div>
        <div class="flex flex-col p-space-md bg-surface-container-lowest/40 border border-outline-variant/15 gap-space-sm">
          <span class="font-label-caps text-label-caps text-on-surface-variant/50 tracking-widest uppercase">RESOURCE PROJECTION</span>
          <div class="flex flex-col gap-1">
            <div class="flex justify-between font-data-mono text-data-mono">
              <span class="text-on-surface-variant/50">ALGORITHM</span>
              <span class="text-on-surface-variant/80" id="proj-algo">ALPHA-BETA</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex justify-between font-data-mono text-data-mono">
              <span class="text-on-surface-variant/50">EST. THINK TIME</span>
              <span class="text-secondary/70" id="proj-time">≤ 3.0s / MOVE</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex justify-between font-data-mono text-data-mono">
              <span class="text-on-surface-variant/50">HEURISTIC COST</span>
              <span class="text-tertiary/70" id="proj-cost">HIGH</span>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</div>`;
}

// ─── Helper renderers ────────────────────────────────────────────────────────
function _ritualSizeBtns() {
  return [5,6,7,8].map(n => {
    const kanji = ['五','六','七','八'][n-5];
    const isActive = n === K.config.n;
    const label = n === 7 ? 'STANDARD' : `${n*n} TILES`;
    const cls = isActive
      ? 'board-size-btn group flex-1 flex flex-col items-center py-space-sm px-space-xs bg-surface-container text-tertiary transition-all border border-tertiary/40'
      : 'board-size-btn group flex-1 flex flex-col items-center py-space-sm px-space-xs bg-surface-container-low/40 hover:bg-surface-container-low/70 transition-all';
    const numCls = isActive ? 'font-data-mono text-data-mono font-medium text-tertiary' : 'font-data-mono text-data-mono text-on-surface-variant/50 group-hover:text-on-surface';
    const kanjiCls = isActive ? 'font-kanji-accent text-data-mono text-tertiary/90 mt-space-xs' : 'font-kanji-accent text-data-mono text-outline-variant/60 group-hover:text-tertiary/80 mt-space-xs';
    const subCls = isActive ? 'font-data-mono text-[9px] text-tertiary/70 mt-1' : 'font-data-mono text-[9px] text-on-surface-variant/40 mt-1';
    return `<button class="${cls}" data-board="${n}" onclick="ritualSetSize(${n})">
      <span class="${numCls}">${n}×${n}</span>
      <span class="${kanjiCls}">${kanji}</span>
      <span class="${subCls}">${label}</span>
    </button>`;
  }).join('');
}

function _ritualHeuristicRows() {
  const h = K.heuristics;
  const indexKanji = ['一','二','三','四','五'];
  const costColor = { low: 'text-secondary/60', medium: 'text-tertiary/60', high: 'text-primary/60' };

  return h.map((hn, i) => {
    const isActive = hn.key === K.config.heuristic;
    const rowCls = isActive
      ? 'heuristic-row cursor-pointer py-space-sm px-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-xs transition-colors bg-surface-container-low/50 border-l border-tertiary/40'
      : 'heuristic-row cursor-pointer py-space-sm px-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-xs transition-colors hover:bg-surface-container-low/40';
    const titleCls = isActive ? 'font-title-editorial text-title-editorial text-on-surface font-normal' : 'font-title-editorial text-title-editorial text-on-surface-variant/80 group-hover:text-primary transition-colors';
    const radioCls = isActive ? 'w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(235,193,102,0.8)]' : 'w-2 h-2 rounded-full bg-outline-variant/30';
    const costLabel = isActive
      ? `<div class="flex items-center gap-space-xs"><h3 class="${titleCls}">${hn.title}</h3><span class="font-data-mono text-[9px] text-tertiary/70 border border-tertiary/20 px-1 py-0.5 uppercase">ACTIVE</span></div>`
      : `<h3 class="${titleCls}">${hn.title}</h3>`;

    return `<div class="${rowCls}" onclick="ritualSelectHeuristic('${hn.key}')">
      <div class="flex items-start md:items-center gap-space-md">
        <span class="font-data-mono text-data-mono ${isActive ? 'text-tertiary/80' : 'text-on-surface-variant/30'}">${String(i+1).padStart(2,'0')}</span>
        <div>${costLabel}
          <p class="font-data-mono text-data-mono text-on-surface-variant/50">${hn.blurb}</p>
        </div>
      </div>
      <div class="flex items-center gap-space-md self-end md:self-center">
        <span class="font-data-mono text-[10px] tracking-widest ${costColor[hn.cost] || 'text-on-surface-variant/50'} uppercase">COST: ${hn.cost.toUpperCase()}</span>
        <span class="${radioCls}"></span>
      </div>
    </div>`;
  }).join('');
}

function _ritualMinimap() {
  const n = K.config.n;
  const holes = K.config.holes;
  const total = n * n;
  const s0 = (n - 1) * n + Math.floor(n / 2); // human bottom-center
  const s1 = total - 1 - s0;                    // machine top-center

  // Deterministic holes (mirrors actual engine logic approximation)
  const faultSet = new Set();
  let candidates = [];
  for (let i = 0; i < total; i++) {
    if (i !== s0 && i !== s1 && (total - 1 - i) !== i) candidates.push(i);
  }
  // pick using simple stride
  let placed = 0;
  const step = Math.floor(candidates.length / (holes * 2 + 1));
  for (let i = 1; placed < holes && i * step < candidates.length; i++) {
    const idx = candidates[i * step];
    const mirror = total - 1 - idx;
    if (!faultSet.has(idx) && !faultSet.has(mirror) && mirror !== s0 && mirror !== s1) {
      faultSet.add(idx);
      faultSet.add(mirror);
      placed++;
    }
  }

  const grid = document.getElementById('minimap-grid');
  if (!grid) return;
  grid.style.gridTemplateColumns = `repeat(${n},minmax(0,1fr))`;
  grid.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'aspect-square transition-all';
    if (i === s0) d.className += ' bg-primary shadow-[0_0_4px_rgba(243,98,56,0.6)]';
    else if (i === s1) d.className += ' bg-secondary shadow-[0_0_4px_rgba(155,210,191,0.6)]';
    else if (faultSet.has(i)) d.className += ' bg-surface-container-lowest opacity-25';
    else d.className += ' bg-surface-container-high/80';
    grid.appendChild(d);
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
function ritualInit() {
  _ritualMinimap();

  // Fault slider
  document.getElementById('fault-slider').addEventListener('input', e => {
    K.config.holes = +e.target.value;
    const v = K.config.holes;
    document.getElementById('fault-readout').textContent =
      v === 0 ? 'VIRGIN GROUND (0 TILES)' : `${v} PAIRS (${v*2} TILES DISSOLVED)`;
    _ritualMinimap();
  });

  // Depth slider
  document.getElementById('depth-slider').addEventListener('input', e => {
    K.config.depth = +e.target.value;
    document.getElementById('depth-readout').textContent = `DEPTH ${e.target.value} / 10`;
    document.getElementById('depth-visual-val').textContent = e.target.value;
  });

  // Time slider
  document.getElementById('time-slider').addEventListener('input', e => {
    K.config.timeLimitMs = Math.round(+e.target.value * 1000);
    document.getElementById('time-readout').textContent = `${(+e.target.value).toFixed(1)}s ALLOTTED`;
    document.getElementById('proj-time').textContent = `≤ ${(+e.target.value).toFixed(1)}s / MOVE`;
  });

  // Checkboxes
  document.getElementById('chk-iterative').addEventListener('change', e => { K.config.iterative = e.target.checked; });
  document.getElementById('chk-ordering').addEventListener('change', e => { K.config.ordering = e.target.checked; });
}

// ─── UI Callbacks (global, called from inline onclick) ──────────────────────
function ritualSetSize(n) {
  K.config.n = n;
  document.getElementById('board-summary-pill').textContent = `${n} × ${n} SLATE • ${n*n} PLATES`;
  document.getElementById('size-btns').innerHTML = _ritualSizeBtns();
  _ritualMinimap();
}

function ritualSelectFirst(who) {
  K.config.first = who;
  const h = document.getElementById('turn-human');
  const m = document.getElementById('turn-machine');
  if (who === 0) {
    h.className = 'flex items-center justify-between p-space-sm bg-surface-container-low transition-all';
    h.style.opacity = '1';
    m.className = 'flex items-center justify-between p-space-sm hover:bg-surface-container-low/40 opacity-40 transition-all';
  } else {
    m.className = 'flex items-center justify-between p-space-sm bg-surface-container-low transition-all';
    m.style.opacity = '1';
    h.className = 'flex items-center justify-between p-space-sm hover:bg-surface-container-low/40 opacity-40 transition-all';
  }
}

function ritualSelectSolver(algo) {
  K.config.algorithm = algo;
  const ab = document.getElementById('btn-alphabeta');
  const mm = document.getElementById('btn-minimax');
  const note = document.getElementById('solver-note');
  const proj = document.getElementById('proj-algo');
  if (algo === 'alphabeta') {
    ab.className = 'flex flex-col p-space-sm bg-surface-container-low text-left transition-all';
    ab.style.opacity = '1';
    mm.className = 'flex flex-col p-space-sm hover:bg-surface-container-low/40 text-left opacity-40 transition-all';
    if (note) note.textContent = 'Alpha-Beta: prunes dead branches, same answer as minimax.';
    if (proj) proj.textContent = 'ALPHA-BETA';
  } else {
    mm.className = 'flex flex-col p-space-sm bg-surface-container-low text-left transition-all';
    mm.style.opacity = '1';
    ab.className = 'flex flex-col p-space-sm hover:bg-surface-container-low/40 text-left opacity-40 transition-all';
    if (note) note.textContent = 'Minimax: full recursive sweep — slower, identical result.';
    if (proj) proj.textContent = 'MINIMAX';
  }
}

function ritualSelectHeuristic(key) {
  K.config.heuristic = key;
  document.getElementById('heuristic-list').innerHTML = _ritualHeuristicRows();
  const h = K.heuristics.find(x => x.key === key);
  if (h) document.getElementById('proj-cost').textContent = h.cost.toUpperCase();
}

function ritualPreset(name) {
  const presets = {
    gentle:    { depth: 2, timeLimitMs: 1000, heuristic: 'mobility' },
    sharp:     { depth: 5, timeLimitMs: 2500, heuristic: 'territory' },
    merciless: { depth: 8, timeLimitMs: 5000, heuristic: 'territory' },
  };
  const p = presets[name];
  Object.assign(K.config, p);
  document.getElementById('depth-slider').value = p.depth;
  document.getElementById('depth-readout').textContent = `DEPTH ${p.depth} / 10`;
  document.getElementById('depth-visual-val').textContent = p.depth;
  document.getElementById('time-slider').value = p.timeLimitMs / 1000;
  document.getElementById('time-readout').textContent = `${(p.timeLimitMs/1000).toFixed(1)}s ALLOTTED`;
  document.getElementById('heuristic-list').innerHTML = _ritualHeuristicRows();
}

async function ritualLaunch() {
  const btn = document.getElementById('begin-ritual-btn');
  const lbl = document.getElementById('ritual-ready-label');
  const err = document.getElementById('ritual-error');
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = 'SEALING...';
  if (err) err.classList.add('hidden');

  try {
    const view = await API.newGame({
      n:     K.config.n,
      holes: K.config.holes,
      seed:  K.config.seed,
      first: K.config.first,
    });
    // view = {state, turn, legal_moves, territory, mobility, free_squares, winner, game_over}

    // Reset game state
    K.game.initialView = view;
    K.game.view = view;
    K.game.history = [];
    K.game.isAiThinking = false;
    K.game.aiResult = null;
    K.game.cameraOblique = true;
    K.game.kingdomsVisible = true;
    K.posterity = null;

    navigate('board');
  } catch (e) {
    if (lbl) lbl.textContent = 'READY';
    if (btn) btn.disabled = false;
    if (err) {
      err.textContent = `BACKEND ERROR: ${e.message}`;
      err.classList.remove('hidden');
    }
  }
}
