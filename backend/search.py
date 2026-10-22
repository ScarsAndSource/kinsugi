"""
search.py - minimax and alpha-beta pruning, written from scratch.

Terminology
  me     the player the search is working for (the side to move at the root)
  ply    distance from the root (root = 0)
  score  from `me`'s point of view. Terminal wins/losses use +/-WIN adjusted by
         ply, so the AI prefers faster wins and slower losses.

The optional `trace` argument records the top plies of the search tree
(moves, scores, and which siblings alpha-beta skipped). The frontend turns
this into the "thought threads" visual.
NOTE: alpha-beta scores of non-best siblings can be bounds rather than exact
values. That is a property of the algorithm, not a bug.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from engine import State
from heuristics import HEURISTICS

INF = float("inf")
WIN = 10_000.0


class SearchTimeout(Exception):
    pass


@dataclass
class SearchStats:
    nodes: int = 0          # every call of the recursive function
    cutoffs: int = 0        # times alpha >= beta fired
    leaf_evals: int = 0     # heuristic evaluations at the depth limit
    order_evals: int = 0    # extra evaluations spent on move ordering
    deadline: Optional[float] = None

    def tick(self) -> None:
        if self.deadline is not None and (self.nodes & 511) == 0 and time.perf_counter() > self.deadline:
            raise SearchTimeout()


def _terminal_score(state: State, me: int, ply: int) -> float:
    # the side to move has no legal move -> that side loses
    return (-WIN + ply) if state.turn == me else (WIN - ply)


# ==========================================================================
# MINIMAX
# ==========================================================================
def _minimax(state, depth, ply, me, h, stats, trace, trace_depth) -> float:
    stats.nodes += 1
    stats.tick()
    moves = state.legal_moves()
    if not moves:
        return _terminal_score(state, me, ply)
    if depth == 0:
        stats.leaf_evals += 1
        return h(state, me)

    maximizing = state.turn == me
    best = -INF if maximizing else INF
    for mv in moves:
        child = state.apply(mv)
        entry, child_trace = None, None
        if trace is not None:
            entry = {"move": mv, "score": None, "pruned": False, "children": []}
            trace.append(entry)
            if ply + 1 < trace_depth:
                child_trace = entry["children"]
        val = _minimax(child, depth - 1, ply + 1, me, h, stats, child_trace, trace_depth)
        if entry is not None:
            entry["score"] = val
        if maximizing:
            if val > best:
                best = val
        else:
            if val < best:
                best = val
    return best


# ==========================================================================
# ALPHA-BETA
# ==========================================================================
def _alphabeta(state, depth, ply, alpha, beta, me, h, stats, ordering, trace, trace_depth) -> float:
    stats.nodes += 1
    stats.tick()
    moves = state.legal_moves()
    if not moves:
        return _terminal_score(state, me, ply)
    if depth == 0:
        stats.leaf_evals += 1
        return h(state, me)

    maximizing = state.turn == me
    if ordering == "heuristic" and len(moves) > 1:
        # try the most promising moves first -> earlier cutoffs
        stats.order_evals += len(moves)
        moves.sort(key=lambda m: h(state.apply(m), me), reverse=maximizing)

    best = -INF if maximizing else INF
    for i, mv in enumerate(moves):
        child = state.apply(mv)
        entry, child_trace = None, None
        if trace is not None:
            entry = {"move": mv, "score": None, "pruned": False, "children": []}
            trace.append(entry)
            if ply + 1 < trace_depth:
                child_trace = entry["children"]
        val = _alphabeta(child, depth - 1, ply + 1, alpha, beta, me, h, stats, ordering, child_trace, trace_depth)
        if entry is not None:
            entry["score"] = val
        if maximizing:
            if val > best:
                best = val
            if best > alpha:
                alpha = best
        else:
            if val < best:
                best = val
            if best < beta:
                beta = best
        if alpha >= beta:
            stats.cutoffs += 1
            if trace is not None:
                for rest in moves[i + 1:]:
                    trace.append({"move": rest, "score": None, "pruned": True, "children": []})
            break
    return best


# ==========================================================================
# ROOT SEARCH (one fixed depth)
# ==========================================================================
def _search_root(state, depth, algorithm, h_name, ordering, trace_depth, deadline, first_moves) -> Dict[str, Any]:
    h = HEURISTICS[h_name].fn
    me = state.turn
    stats = SearchStats(deadline=deadline)
    t0 = time.perf_counter()

    moves = state.legal_moves()
    if algorithm == "alphabeta":
        if ordering == "heuristic":
            moves.sort(key=lambda m: h(state.apply(m), me), reverse=True)
        if first_moves:  # principal variation from the previous iteration goes first
            moves.sort(key=lambda m: 0 if m in first_moves else 1)

    alpha = -INF
    best_move, best_score = None, -INF
    root_moves: List[Dict[str, Any]] = []
    tree: Optional[List[Dict[str, Any]]] = [] if trace_depth >= 1 else None

    for mv in moves:
        n0 = stats.nodes
        child = state.apply(mv)
        entry, child_trace = None, None
        if tree is not None:
            entry = {"move": mv, "score": None, "pruned": False, "children": []}
            tree.append(entry)
            if trace_depth >= 2:
                child_trace = entry["children"]
        if algorithm == "minimax":
            val = _minimax(child, depth - 1, 1, me, h, stats, child_trace, trace_depth)
            exact = True
        else:
            val = _alphabeta(child, depth - 1, 1, alpha, INF, me, h, stats, ordering, child_trace, trace_depth)
            exact = val > alpha
            if val > alpha:
                alpha = val
        if entry is not None:
            entry["score"] = val
        root_moves.append({"move": mv, "score": val, "nodes": stats.nodes - n0, "exact": exact})
        if val > best_score:
            best_score, best_move = val, mv

    return {
        "best_move": best_move,
        "score": best_score,
        "root_moves": root_moves,
        "tree": tree,
        "nodes": stats.nodes,
        "cutoffs": stats.cutoffs,
        "leaf_evals": stats.leaf_evals,
        "order_evals": stats.order_evals,
        "time_ms": round((time.perf_counter() - t0) * 1000, 2),
    }


# ==========================================================================
# PUBLIC ENTRY: iterative deepening with an optional time budget
# ==========================================================================
def search(
    state: State,
    algorithm: str = "alphabeta",
    heuristic: str = "territory",
    depth: int = 5,
    ordering: str = "heuristic",
    iterative: bool = True,
    time_limit_ms: Optional[int] = None,
    trace_depth: int = 2,
) -> Dict[str, Any]:
    if algorithm not in ("minimax", "alphabeta"):
        raise ValueError("algorithm must be 'minimax' or 'alphabeta'")
    if heuristic not in HEURISTICS:
        raise ValueError(f"unknown heuristic '{heuristic}'")
    if not state.legal_moves():
        raise ValueError("no legal moves: game is over")

    t_start = time.perf_counter()
    deadline = t_start + time_limit_ms / 1000.0 if (iterative and time_limit_ms) else None
    depths = range(1, depth + 1) if iterative else [depth]

    iterations: List[Dict[str, Any]] = []
    result: Optional[Dict[str, Any]] = None
    first_moves: Optional[List[int]] = None
    totals = {"nodes": 0, "cutoffs": 0, "leaf_evals": 0, "order_evals": 0}

    for d in depths:
        try:
            r = _search_root(state, d, algorithm, heuristic, ordering, trace_depth,
                             deadline if d > 1 else None, first_moves)
        except SearchTimeout:
            iterations.append({"depth": d, "completed": False})
            break
        for k in totals:
            totals[k] += r[k]
        iterations.append({
            "depth": d, "completed": True, "best_move": r["best_move"], "score": r["score"],
            "nodes": r["nodes"], "cutoffs": r["cutoffs"], "time_ms": r["time_ms"],
        })
        result = r
        first_moves = [r["best_move"]]
        if abs(r["score"]) >= WIN - 100:  # forced win/loss found; deeper cannot change it
            break

    assert result is not None
    return {
        "move": result["best_move"],
        "score": result["score"],
        "depth_completed": max(i["depth"] for i in iterations if i["completed"]),
        "algorithm": algorithm,
        "heuristic": heuristic,
        "ordering": ordering,
        "stats": {**totals, "time_ms": round((time.perf_counter() - t_start) * 1000, 2)},
        "root_moves": result["root_moves"],
        "tree": result["tree"],
        "iterations": iterations,
    }


# ==========================================================================
# LAB: minimax vs alpha-beta vs alpha-beta with move ordering
# ==========================================================================
def compare_algorithms(state: State, max_depth: int = 5, heuristic: str = "aggressive") -> List[Dict[str, Any]]:
    variants = (
        ("minimax", "minimax", "none"),
        ("alphabeta", "alphabeta", "none"),
        ("alphabeta_ordered", "alphabeta", "heuristic"),
    )
    rows = []
    for d in range(1, max_depth + 1):
        row: Dict[str, Any] = {"depth": d}
        for label, algo, ordering in variants:
            r = _search_root(state, d, algo, heuristic, ordering, 0, None, None)
            row[label] = {
                "nodes": r["nodes"], "cutoffs": r["cutoffs"], "time_ms": r["time_ms"],
                "best_move": r["best_move"], "score": r["score"],
                "effective_branching": round(r["nodes"] ** (1.0 / d), 3),
            }
        scores = {row[l]["score"] for l, _, _ in variants}
        row["agree"] = len(scores) == 1  # all three must return the same game value
        row["speedup"] = round(row["minimax"]["nodes"] / max(1, row["alphabeta"]["nodes"]), 2)
        row["speedup_ordered"] = round(row["minimax"]["nodes"] / max(1, row["alphabeta_ordered"]["nodes"]), 2)
        rows.append(row)
    return rows
