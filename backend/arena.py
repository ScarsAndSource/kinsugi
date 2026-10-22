"""
arena.py - AI vs AI games and a heuristic round-robin tournament.

Fairness measures: every pairing is played on the same board twice with colours
swapped, and the first `random_plies` moves are random so games differ.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from engine import new_game
from search import search


def play_game(n: int, holes: int, seed: int, cfg0: Dict[str, Any], cfg1: Dict[str, Any],
              random_plies: int = 2) -> Dict[str, Any]:
    """cfg = {"heuristic": str, "depth": int, "algorithm": str (optional)}"""
    state = new_game(n, holes, seed, first=0)
    start = state.to_dict()
    rng = random.Random(seed)
    cfgs = (cfg0, cfg1)
    moves: List[Dict[str, int]] = []

    while state.legal_moves():
        player = state.turn
        if len(moves) < random_plies:
            mv = rng.choice(state.legal_moves())
        else:
            c = cfgs[player]
            res = search(state, algorithm=c.get("algorithm", "alphabeta"), heuristic=c["heuristic"],
                         depth=c["depth"], ordering="heuristic", iterative=False, trace_depth=0)
            mv = res["move"]
        moves.append({"player": player, "from": state.pos[player], "to": mv})
        state = state.apply(mv)

    return {"winner": state.winner(), "plies": len(moves), "moves": moves, "start": start}


def round_robin(keys: List[str], depth: int = 3, games_per_pair: int = 2, n: int = 7,
                holes: int = 2, seed: int = 1) -> Dict[str, Any]:
    wins = {a: {b: 0 for b in keys} for a in keys}
    played = {a: {b: 0 for b in keys} for a in keys}

    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            for g in range(games_per_pair):
                s = seed + g
                ca, cb = {"heuristic": a, "depth": depth}, {"heuristic": b, "depth": depth}
                r1 = play_game(n, holes, s, ca, cb)   # a is player 0
                r2 = play_game(n, holes, s, cb, ca)   # b is player 0, same board
                wins[a][b] += (r1["winner"] == 0) + (r2["winner"] == 1)
                wins[b][a] += (r1["winner"] == 1) + (r2["winner"] == 0)
                played[a][b] += 2
                played[b][a] += 2

    rate = {a: {b: (round(wins[a][b] / played[a][b], 3) if played[a][b] else None) for b in keys} for a in keys}
    overall = {}
    for a in keys:
        w = sum(wins[a][b] for b in keys if b != a)
        p = sum(played[a][b] for b in keys if b != a)
        overall[a] = round(w / p, 3) if p else None
    return {"keys": keys, "depth": depth, "wins": wins, "played": played, "win_rate": rate, "overall": overall}
