"use strict";
/* Kintsugi — the Lab. Two live experiments. Needs app.js first ($, api, fmt, esc, HEUR). */

(function () {
  const bar = (v, max) => {
    const pct = Math.max(2, Math.round(100 * Math.log10(v + 1) / Math.log10(max + 1)));
    return `<i style="width:calc(${pct}% - 20px)"></i>`;
  };

  /* ---------------------------------------------------------- 01 pruning */
  async function runCompare() {
    const btn = $("#runCompare"), out = $("#compareOut");
    btn.disabled = true;
    out.innerHTML = '<p class="note">Running… this takes a few seconds.</p>';
    try {
      // fixed start position, so the experiment never depends on whatever game you just played
      const start = await api("/api/new", { n: 7, holes: 2, seed: 1, first: 0 });
      const res = await api("/api/lab/compare", { state: start.state, max_depth: 6, heuristic: "aggressive" });
      const rows = res.rows;
      const max = Math.max(...rows.map(r => r.minimax.nodes));
      const allAgree = rows.every(r => r.agree);
      const last = rows[rows.length - 1];

      const body = rows.map(r => `
        <tr>
          <td>${r.depth}</td>
          <td class="cb">${fmt(r.minimax.nodes)}${bar(r.minimax.nodes, max)}</td>
          <td class="cb">${fmt(r.alphabeta.nodes)}${bar(r.alphabeta.nodes, max)}</td>
          <td class="cb">${fmt(r.alphabeta_ordered.nodes)}${bar(r.alphabeta_ordered.nodes, max)}</td>
          <td class="best">${r.speedup_ordered}× fewer</td>
        </tr>`).join("");

      out.innerHTML = `
        <div class="scroll"><table class="data">
          <thead><tr><th>Depth</th><th>Minimax</th><th>Alpha-beta</th><th>+ promising moves first</th><th>Work saved</th></tr></thead>
          <tbody>${body}</tbody>
        </table></div>
        <p class="note">Positions checked at each depth, from one fixed starting board. Bars use a log scale.</p>
        <p class="verdict">${allAgree
          ? "All three methods gave <b>exactly the same score</b> at every depth."
          : "<b>The scores differed</b> at some depth. That would mean a bug, so tell your teacher."}
          At depth ${last.depth}, minimax took ${fmt(Math.round(last.minimax.time_ms))} ms and
          alpha-beta with ordering took ${fmt(Math.round(last.alphabeta_ordered.time_ms))} ms.</p>`;
    } catch (e) {
      out.innerHTML = `<p class="err">Couldn't run it: ${esc(e.message)}</p>`;
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------------------------------------------------------- 02 tournament */
  function tint(rate) {
    // ember glow grows with win rate
    return `background:rgba(228,87,46,${(rate * 0.62).toFixed(2)})`;
  }

  async function runTourney() {
    const btn = $("#runTourney"), out = $("#tourneyOut");
    btn.disabled = true;
    out.innerHTML = '<p class="note">Playing the games… a few seconds.</p>';
    try {
      const depth = +$("#tDepth").value;
      const res = await api("/api/lab/tournament", { depth, games_per_pair: 2, n: 7, holes: 2, seed: 1 });
      const keys = res.keys;
      const name = k => (HEUR[k] ? HEUR[k].name : k);

      const head = keys.map(k => `<th>${esc(name(k))}</th>`).join("");
      const body = keys.map(a => {
        const cells = keys.map(b => {
          if (a === b) return '<td class="self">–</td>';
          const r = res.win_rate[a][b];
          return `<td style="${tint(r)}">${Math.round(r * 100)}%</td>`;
        }).join("");
        return `<tr><th>${esc(name(a))}</th>${cells}<td class="best">${Math.round(res.overall[a] * 100)}%</td></tr>`;
      }).join("");

      const ranking = [...keys].sort((a, b) => res.overall[b] - res.overall[a]);
      const first = keys[0], second = keys[1];
      const gamesPerPair = res.played[first][second];

      out.innerHTML = `
        <div class="scroll"><table class="data">
          <thead><tr><th>Row beats column</th>${head}<th>Overall</th></tr></thead>
          <tbody>${body}</tbody>
        </table></div>
        <p class="note">Brighter ember means the row side wins more often. Each pairing played ${gamesPerPair} games at depth ${depth}.</p>
        <p class="verdict">Best overall in this run: <b>${esc(name(ranking[0]))}</b> (${Math.round(res.overall[ranking[0]] * 100)}% of its games).
          Weakest: <b>${esc(name(ranking[ranking.length - 1]))}</b> (${Math.round(res.overall[ranking[ranking.length - 1]] * 100)}%).
          That is a small sample, so say "in my runs", not "always".</p>`;
    } catch (e) {
      out.innerHTML = `<p class="err">Couldn't run it: ${esc(e.message)}</p>`;
    } finally {
      btn.disabled = false;
    }
  }

  $("#runCompare").addEventListener("click", runCompare);
  $("#runTourney").addEventListener("click", runTourney);
})();
