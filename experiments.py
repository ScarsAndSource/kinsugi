"""
experiments.py - generates the tables and graphs for your report / viva.

Run:  python experiments.py
Output (in ./results): pruning.csv, tournament.csv, depth_duel.csv, + PNG charts
if matplotlib is installed (pip install matplotlib).

Three experiments
  1. Pruning: nodes expanded by minimax vs alpha-beta vs alpha-beta + move ordering
  2. Heuristic round-robin: which evaluation function plays best?
  3. Depth duel: does searching deeper actually win games?
"""
import csv
import os
import statistics

from arena import play_game, round_robin
from engine import new_game
from heuristics import HEURISTICS
from search import compare_algorithms

OUT = "results"
os.makedirs(OUT, exist_ok=True)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:  # charts are optional
    plt = None


def exp_pruning(max_depth: int = 7, positions: int = 5) -> None:
    print("\n== Experiment 1: pruning (averaged over", positions, "random positions) ==")
    agg = {d: {"mm": [], "ab": [], "abo": []} for d in range(1, max_depth + 1)}
    for s in range(positions):
        st = new_game(7, holes=s % 3, seed=100 + s)
        for row in compare_algorithms(st, max_depth, "aggressive"):
            assert row["agree"], "alpha-beta disagreed with minimax!"
            d = row["depth"]
            agg[d]["mm"].append(row["minimax"]["nodes"])
            agg[d]["ab"].append(row["alphabeta"]["nodes"])
            agg[d]["abo"].append(row["alphabeta_ordered"]["nodes"])

    rows = []
    print(f"{'depth':>5} {'minimax':>10} {'alpha-beta':>11} {'+ordering':>10} {'speedup':>8} {'speedup+ord':>12}")
    for d, v in agg.items():
        mm, ab, abo = (statistics.mean(v[k]) for k in ("mm", "ab", "abo"))
        rows.append([d, round(mm), round(ab), round(abo), round(mm / ab, 2), round(mm / abo, 2)])
        print(f"{d:>5} {mm:>10.0f} {ab:>11.0f} {abo:>10.0f} {mm / ab:>7.1f}x {mm / abo:>11.1f}x")
    with open(f"{OUT}/pruning.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["depth", "minimax_nodes", "alphabeta_nodes", "alphabeta_ordered_nodes", "speedup", "speedup_ordered"])
        w.writerows(rows)
    if plt:
        ds = [r[0] for r in rows]
        plt.figure(figsize=(7, 4.5))
        plt.plot(ds, [r[1] for r in rows], "o-", label="minimax")
        plt.plot(ds, [r[2] for r in rows], "s-", label="alpha-beta")
        plt.plot(ds, [r[3] for r in rows], "^-", label="alpha-beta + move ordering")
        plt.yscale("log")
        plt.xlabel("search depth (plies)")
        plt.ylabel("nodes expanded (log scale)")
        plt.title("Same answer, far fewer nodes")
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(f"{OUT}/pruning.png", dpi=160)
        plt.close()


def exp_tournament(depth: int = 3, games_per_pair: int = 6) -> None:
    print("\n== Experiment 2: heuristic round-robin (depth", depth, ") ==")
    keys = list(HEURISTICS)
    res = round_robin(keys, depth=depth, games_per_pair=games_per_pair, n=7, holes=2, seed=1)
    print(f"{'':>11}" + "".join(f"{k:>12}" for k in keys) + f"{'overall':>10}")
    for a in keys:
        cells = "".join(f"{('-' if a == b else res['win_rate'][a][b]):>12}" for b in keys)
        print(f"{a:>11}{cells}{res['overall'][a]:>10}")
    with open(f"{OUT}/tournament.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["row_beats_col"] + keys + ["overall"])
        for a in keys:
            w.writerow([a] + ["" if a == b else res["win_rate"][a][b] for b in keys] + [res["overall"][a]])
    if plt:
        import numpy as np
        m = np.array([[np.nan if a == b else res["win_rate"][a][b] for b in keys] for a in keys])
        plt.figure(figsize=(6.5, 5.5))
        plt.imshow(m, vmin=0, vmax=1, cmap="YlOrBr")
        plt.xticks(range(len(keys)), keys, rotation=30)
        plt.yticks(range(len(keys)), keys)
        for i in range(len(keys)):
            for j in range(len(keys)):
                if i != j:
                    plt.text(j, i, f"{m[i][j]:.2f}", ha="center", va="center")
        plt.title("Win rate of ROW against COLUMN")
        plt.colorbar()
        plt.tight_layout()
        plt.savefig(f"{OUT}/tournament.png", dpi=160)
        plt.close()


def exp_depth_duel(heuristic: str = "mobility", games: int = 10) -> None:
    print("\n== Experiment 3: does depth win games? (same heuristic:", heuristic, ") ==")
    rows = []
    for deep, shallow in ((2, 1), (3, 1), (4, 2), (5, 3)):
        wins = 0
        for g in range(games):
            for deep_is_p0 in (True, False):
                c_deep = {"heuristic": heuristic, "depth": deep}
                c_shal = {"heuristic": heuristic, "depth": shallow}
                r = play_game(7, 2, 500 + g, c_deep if deep_is_p0 else c_shal, c_shal if deep_is_p0 else c_deep)
                wins += (r["winner"] == 0) == deep_is_p0
        total = games * 2
        rows.append([f"{deep} vs {shallow}", wins, total, round(wins / total, 2)])
        print(f"  depth {deep} vs depth {shallow}: deeper side won {wins}/{total}")
    with open(f"{OUT}/depth_duel.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["matchup", "deeper_wins", "games", "win_rate"])
        w.writerows(rows)


if __name__ == "__main__":
    exp_pruning()
    exp_tournament()
    exp_depth_duel()
    print("\nSaved to ./results")
