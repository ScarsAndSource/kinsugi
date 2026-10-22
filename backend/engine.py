"""
engine.py - Knight Isolation rules. Pure logic, zero dependencies.

Board: n x n, squares indexed r * n + c (row 0 = top of the screen).
Destroyed squares are stored as a Python int bitmask, which keeps the
search fast and the state immutable.

Rules
  * each player owns one piece that moves like a chess knight
  * the square you LEAVE is destroyed forever
  * you may not land on a destroyed square or on the opponent's piece
  * if it is your turn and you have no legal move, you lose

Player 0 starts bottom-centre, player 1 starts top-centre (180 degree
rotational symmetry, so random holes can be placed fairly).
"""
from __future__ import annotations

import random
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, Iterator, List, Optional, Tuple

KNIGHT_DELTAS = [(-2, -1), (-2, 1), (-1, -2), (-1, 2), (1, -2), (1, 2), (2, -1), (2, 1)]


@dataclass(frozen=True)
class Geometry:
    n: int
    size: int
    kmask: Tuple[int, ...]  # kmask[sq] = bitmask of squares a knight on sq attacks
    full: int               # bitmask with every square set


@lru_cache(maxsize=None)
def geometry(n: int) -> Geometry:
    kmask = []
    for idx in range(n * n):
        r, c = divmod(idx, n)
        m = 0
        for dr, dc in KNIGHT_DELTAS:
            rr, cc = r + dr, c + dc
            if 0 <= rr < n and 0 <= cc < n:
                m |= 1 << (rr * n + cc)
        kmask.append(m)
    return Geometry(n, n * n, tuple(kmask), (1 << (n * n)) - 1)


def iter_bits(mask: int) -> Iterator[int]:
    """Yield indices of set bits, ascending."""
    while mask:
        low = mask & -mask
        yield low.bit_length() - 1
        mask ^= low


@dataclass(frozen=True)
class State:
    n: int
    blocked: int              # bitmask of destroyed squares
    pos: Tuple[int, int]      # (player0_square, player1_square)
    turn: int                 # whose move it is: 0 or 1

    @property
    def geo(self) -> Geometry:
        return geometry(self.n)

    def moves_mask(self, player: int) -> int:
        """Bitmask of squares `player` could jump to right now."""
        return self.geo.kmask[self.pos[player]] & ~self.blocked & ~(1 << self.pos[1 - player])

    def legal_moves(self) -> List[int]:
        return list(iter_bits(self.moves_mask(self.turn)))

    def apply(self, to: int) -> "State":
        mover = self.turn
        frm = self.pos[mover]
        pos = (to, self.pos[1]) if mover == 0 else (self.pos[0], to)
        return State(self.n, self.blocked | (1 << frm), pos, 1 - mover)

    def winner(self) -> Optional[int]:
        """None while the game is live; otherwise the player who wins."""
        if self.moves_mask(self.turn):
            return None
        return 1 - self.turn

    def free_squares(self) -> int:
        occupied = (1 << self.pos[0]) | (1 << self.pos[1])
        return (self.geo.full & ~self.blocked & ~occupied).bit_count()

    # ---- (de)serialisation: the API is stateless, the client carries the state ----
    def to_dict(self) -> Dict[str, Any]:
        return {
            "n": self.n,
            "blocked": list(iter_bits(self.blocked)),
            "pos": [self.pos[0], self.pos[1]],
            "turn": self.turn,
        }

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "State":
        try:
            n = int(d["n"])
            pos = tuple(int(x) for x in d["pos"])
            turn = int(d["turn"])
            blocked_list = [int(x) for x in d["blocked"]]
        except (KeyError, TypeError, ValueError) as e:
            raise ValueError(f"malformed state: {e}")
        if not 5 <= n <= 8:
            raise ValueError("n must be between 5 and 8")
        size = n * n
        if len(pos) != 2 or turn not in (0, 1):
            raise ValueError("pos must have 2 entries and turn must be 0 or 1")
        if any(not 0 <= p < size for p in pos) or pos[0] == pos[1]:
            raise ValueError("invalid piece positions")
        mask = 0
        for b in blocked_list:
            if not 0 <= b < size:
                raise ValueError("blocked square out of range")
            mask |= 1 << b
        if (mask >> pos[0]) & 1 or (mask >> pos[1]) & 1:
            raise ValueError("a piece cannot stand on a destroyed square")
        return State(n, mask, (pos[0], pos[1]), turn)


def new_game(n: int = 7, holes: int = 0, seed: Optional[int] = None, first: int = 0) -> State:
    """
    Fresh board. `holes` = number of symmetric PAIRS of pre-destroyed squares
    (so the position is fair to both sides). first = who moves first.
    """
    if not 5 <= n <= 8:
        raise ValueError("n must be between 5 and 8")
    size = n * n
    s0 = (n - 1) * n + n // 2
    s1 = size - 1 - s0  # 180-degree mirror
    rng = random.Random(seed)

    for _attempt in range(30):
        candidates = [i for i in range(size) if i not in (s0, s1) and size - 1 - i != i]
        rng.shuffle(candidates)
        blocked, placed = 0, 0
        for i in candidates:
            if placed >= holes:
                break
            j = size - 1 - i
            if j in (s0, s1) or (blocked >> i) & 1 or (blocked >> j) & 1:
                continue
            blocked |= (1 << i) | (1 << j)
            placed += 1
        st = State(n, blocked, (s0, s1), first)
        if st.moves_mask(0) and st.moves_mask(1):
            return st
    return State(n, 0, (s0, s1), first)
