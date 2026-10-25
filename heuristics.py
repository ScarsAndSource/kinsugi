"""
heuristics.py - how the machine judges a position when it cannot search to the end.

Every heuristic has the signature  fn(state, me) -> float  and scores the
position from the point of view of player `me` (higher = better for me).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List

from engine import State, iter_bits


# --------------------------------------------------------------------------
# 1-3. Mobility family: count the moves each side has.
# --------------------------------------------------------------------------
def mobility(state: State, me: int) -> float:
    """my moves - opponent moves."""
    return float(state.moves_mask(me).bit_count() - state.moves_mask(1 - me).bit_count())


def aggressive(state: State, me: int) -> float:
    """my moves - 2 * opponent moves. Hunts the opponent."""
    return float(state.moves_mask(me).bit_count() - 2 * state.moves_mask(1 - me).bit_count())


def defensive(state: State, me: int) -> float:
    """2 * my moves - opponent moves. Protects itself."""
    return float(2 * state.moves_mask(me).bit_count() - state.moves_mask(1 - me).bit_count())


# --------------------------------------------------------------------------
# 4. Lookahead mobility: moves now + (discounted) moves available after them.
# --------------------------------------------------------------------------
LOOKAHEAD_DISCOUNT = 0.4
LOOKAHEAD_OPP_WEIGHT = 1.5


def _two_ply_mobility(state: State, player: int) -> float:
    geo = state.geo
    first = state.moves_mask(player)
    dead = state.blocked | (1 << state.pos[player]) | (1 << state.pos[1 - player])
    second = 0
    for sq in iter_bits(first):
        second += (geo.kmask[sq] & ~dead).bit_count()
    return first.bit_count() + LOOKAHEAD_DISCOUNT * second


def lookahead(state: State, me: int) -> float:
    return _two_ply_mobility(state, me) - LOOKAHEAD_OPP_WEIGHT * _two_ply_mobility(state, 1 - me)


# --------------------------------------------------------------------------
# 5. Territory: who can reach each free square first (knight-distance Voronoi).
# --------------------------------------------------------------------------
def knight_distances(state: State, start: int) -> List[int]:
    """BFS knight distance from `start` to every reachable free square (-1 = unreachable)."""
    geo = state.geo
    passable = geo.full & ~state.blocked & ~(1 << state.pos[0]) & ~(1 << state.pos[1])
    dist = [-1] * geo.size
    dist[start] = 0
    seen = 1 << start
    frontier = seen
    d = 0
    while frontier:
        d += 1
        nxt = 0
        for sq in iter_bits(frontier):
            nxt |= geo.kmask[sq]
        nxt &= passable & ~seen
        for sq in iter_bits(nxt):
            dist[sq] = d
        seen |= nxt
        frontier = nxt
    return dist


def territory(state: State) -> Dict[str, object]:
    """
    owner[sq]:  -1 destroyed or occupied | 0 player 0 gets there first
                | 1 player 1 gets there first | 2 unreachable by both
    A tie in distance goes to the side whose turn it is (they move first).
    """
    geo = state.geo
    d0 = knight_distances(state, state.pos[0])
    d1 = knight_distances(state, state.pos[1])
    occupied = (1 << state.pos[0]) | (1 << state.pos[1])
    owner = [-1] * geo.size
    counts = [0, 0]
    for sq in range(geo.size):
        if (state.blocked >> sq) & 1 or (occupied >> sq) & 1:
            continue
        a, b = d0[sq], d1[sq]
        if a == -1 and b == -1:
            owner[sq] = 2
        elif b == -1 or (a != -1 and (a < b or (a == b and state.turn == 0))):
            owner[sq] = 0
            counts[0] += 1
        else:
            owner[sq] = 1
            counts[1] += 1
    return {"owner": owner, "counts": counts, "dist": [d0, d1]}


TERRITORY_MOBILITY_WEIGHT = 0.25


def territory_score(state: State, me: int) -> float:
    t = territory(state)
    c = t["counts"]
    mob = state.moves_mask(me).bit_count() - state.moves_mask(1 - me).bit_count()
    return float(c[me] - c[1 - me]) + TERRITORY_MOBILITY_WEIGHT * mob


# --------------------------------------------------------------------------
@dataclass(frozen=True)
class Heuristic:
    key: str
    title: str
    blurb: str
    cost: str  # relative evaluation cost: low | medium | high
    fn: Callable[[State, int], float]


HEURISTICS: Dict[str, Heuristic] = {
    h.key: h
    for h in [
        Heuristic("mobility", "Even Hand", "My moves minus yours. The textbook baseline.", "low", mobility),
        Heuristic("aggressive", "Predator", "My moves minus twice yours. Corners the opponent.", "low", aggressive),
        Heuristic("defensive", "Hermit", "Twice my moves minus yours. Protects its own room to breathe.", "low", defensive),
        Heuristic("lookahead", "Far Sight", "Counts moves now and the moves those moves unlock.", "medium", lookahead),
        Heuristic("territory", "Cartographer", "Counts the squares I can reach before you can. Maps the board into two kingdoms.", "high", territory_score),
    ]
}
