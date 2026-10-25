"""
selftest.py - proves the implementation is correct. Run: python selftest.py

The central claim of alpha-beta pruning: it returns EXACTLY the same game value
as plain minimax, just with fewer nodes. We verify that on random positions,
for every heuristic, with and without move ordering.
"""
import random

from engine import new_game
from heuristics import HEURISTICS
from search import _search_root


def random_position(rng: random.Random):
    st = new_game(7, holes=rng.randint(0, 4), seed=rng.randint(0, 10_000))
    for _ in range(rng.randint(0, 10)):  # play some random plies
        moves = st.legal_moves()
        if not moves:
            break
        st = st.apply(rng.choice(moves))
    return st


def main() -> None:
    rng = random.Random(42)
    checked, mismatches, saved = 0, 0, []
    while checked < 60:
        st = random_position(rng)
        if not st.legal_moves():
            continue
        key = rng.choice(list(HEURISTICS))
        depth = rng.randint(1, 4)
        mm = _search_root(st, depth, "minimax", key, "none", 0, None, None)
        ab = _search_root(st, depth, "alphabeta", key, "none", 0, None, None)
        abo = _search_root(st, depth, "alphabeta", key, "heuristic", 0, None, None)
        if not (mm["score"] == ab["score"] == abo["score"]):
            mismatches += 1
            print("MISMATCH", key, depth, mm["score"], ab["score"], abo["score"])
        if ab["nodes"] > mm["nodes"]:
            mismatches += 1
            print("alpha-beta expanded MORE nodes than minimax?!", key, depth)
        saved.append(mm["nodes"] / max(1, ab["nodes"]))
        checked += 1
    print(f"positions checked: {checked}   mismatches: {mismatches}")
    print(f"mean node reduction (minimax / alpha-beta): {sum(saved) / len(saved):.2f}x")
    assert mismatches == 0, "implementation bug"
    print("OK: alpha-beta == minimax on every position.")


if __name__ == "__main__":
    main()
