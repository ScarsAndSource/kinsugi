"""
main.py - FastAPI server. Stateless: the client sends the full game state with
every request, so replays, undo and time-travel in the UI are trivial.

Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from arena import play_game, round_robin
from engine import State, new_game
from heuristics import HEURISTICS, territory
from search import compare_algorithms, search

app = FastAPI(title="Kintsugi - Isolation engine", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MAX_MINIMAX_DEPTH = 7
MAX_ALPHABETA_DEPTH = 10


# ---------------------------------------------------------------- helpers
def parse_state(raw: Dict[str, Any]) -> State:
    try:
        return State.from_dict(raw)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


def view(state: State) -> Dict[str, Any]:
    """Everything the UI needs to draw a position."""
    t = territory(state)
    winner = state.winner()
    return {
        "state": state.to_dict(),
        "turn": state.turn,
        "legal_moves": state.legal_moves(),
        "mobility": [state.moves_mask(0).bit_count(), state.moves_mask(1).bit_count()],
        "free_squares": state.free_squares(),
        "winner": winner,
        "game_over": winner is not None,
        # owner: -1 destroyed/occupied, 0 / 1 = that player reaches it first, 2 = unreachable
        "territory": {"owner": t["owner"], "counts": t["counts"], "dist": t["dist"]},
    }


def check_heuristic(key: str) -> None:
    if key not in HEURISTICS:
        raise HTTPException(status_code=422, detail=f"unknown heuristic '{key}'")


# ---------------------------------------------------------------- schemas
class NewGameReq(BaseModel):
    n: int = Field(7, ge=5, le=8)
    holes: int = Field(0, ge=0, le=8, description="pairs of pre-destroyed squares (symmetric)")
    seed: Optional[int] = None
    first: int = Field(0, ge=0, le=1, description="0 = human/bottom moves first, 1 = AI/top")


class MoveReq(BaseModel):
    state: Dict[str, Any]
    to: int


class AIReq(BaseModel):
    state: Dict[str, Any]
    algorithm: Literal["minimax", "alphabeta"] = "alphabeta"
    heuristic: str = "territory"
    depth: int = Field(5, ge=1, le=MAX_ALPHABETA_DEPTH)
    ordering: Literal["none", "heuristic"] = "heuristic"
    iterative: bool = True
    time_limit_ms: Optional[int] = Field(3000, ge=50, le=30000)
    trace_depth: int = Field(2, ge=0, le=3)


class CompareReq(BaseModel):
    state: Dict[str, Any]
    max_depth: int = Field(6, ge=1, le=MAX_MINIMAX_DEPTH)
    heuristic: str = "aggressive"


class TournamentReq(BaseModel):
    heuristics: List[str] = Field(default_factory=lambda: list(HEURISTICS.keys()))
    depth: int = Field(3, ge=1, le=4)
    games_per_pair: int = Field(2, ge=1, le=4)
    n: int = Field(7, ge=5, le=8)
    holes: int = Field(2, ge=0, le=6)
    seed: int = 1


class DuelReq(BaseModel):
    a: str = "territory"
    b: str = "mobility"
    depth_a: int = Field(4, ge=1, le=6)
    depth_b: int = Field(4, ge=1, le=6)
    n: int = Field(7, ge=5, le=8)
    holes: int = Field(2, ge=0, le=6)
    seed: int = 1


# ---------------------------------------------------------------- routes
@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/heuristics")
def heuristics() -> List[Dict[str, str]]:
    return [{"key": h.key, "title": h.title, "blurb": h.blurb, "cost": h.cost} for h in HEURISTICS.values()]


@app.post("/api/new")
def api_new(req: NewGameReq) -> Dict[str, Any]:
    return view(new_game(req.n, req.holes, req.seed, req.first))


@app.post("/api/analyze")
def api_analyze(body: Dict[str, Any]) -> Dict[str, Any]:
    """Re-derive the view (legal moves, territory) for any state, e.g. while scrubbing a replay."""
    return view(parse_state(body["state"] if "state" in body else body))


@app.post("/api/move")
def api_move(req: MoveReq) -> Dict[str, Any]:
    state = parse_state(req.state)
    if state.winner() is not None:
        raise HTTPException(status_code=409, detail="game is already over")
    if req.to not in state.legal_moves():
        raise HTTPException(status_code=422, detail=f"square {req.to} is not a legal move")
    frm = state.pos[state.turn]
    out = view(state.apply(req.to))
    out["move"] = {"player": state.turn, "from": frm, "to": req.to}
    return out


@app.post("/api/ai")
def api_ai(req: AIReq) -> Dict[str, Any]:
    state = parse_state(req.state)
    check_heuristic(req.heuristic)
    if state.winner() is not None:
        raise HTTPException(status_code=409, detail="game is already over")
    if req.algorithm == "minimax" and req.depth > MAX_MINIMAX_DEPTH:
        raise HTTPException(status_code=422, detail=f"minimax depth is capped at {MAX_MINIMAX_DEPTH}")

    res = search(
        state,
        algorithm=req.algorithm,
        heuristic=req.heuristic,
        depth=req.depth,
        ordering=req.ordering,
        iterative=req.iterative,
        time_limit_ms=req.time_limit_ms,
        trace_depth=req.trace_depth,
    )
    frm = state.pos[state.turn]
    after = view(state.apply(res["move"]))
    return {
        "move": {"player": state.turn, "from": frm, "to": res["move"]},
        "score": res["score"],
        "depth_completed": res["depth_completed"],
        "algorithm": res["algorithm"],
        "heuristic": res["heuristic"],
        "stats": res["stats"],
        "root_moves": res["root_moves"],
        "tree": res["tree"],
        "iterations": res["iterations"],
        "view": after,
    }


@app.post("/api/lab/compare")
def api_compare(req: CompareReq) -> Dict[str, Any]:
    state = parse_state(req.state)
    check_heuristic(req.heuristic)
    if state.winner() is not None:
        raise HTTPException(status_code=409, detail="game is already over")
    return {"heuristic": req.heuristic, "rows": compare_algorithms(state, req.max_depth, req.heuristic)}


@app.post("/api/lab/tournament")
def api_tournament(req: TournamentReq) -> Dict[str, Any]:
    for k in req.heuristics:
        check_heuristic(k)
    if len(req.heuristics) < 2:
        raise HTTPException(status_code=422, detail="need at least 2 heuristics")
    return round_robin(req.heuristics, req.depth, req.games_per_pair, req.n, req.holes, req.seed)


@app.post("/api/lab/duel")
def api_duel(req: DuelReq) -> Dict[str, Any]:
    """One AI-vs-AI game, returned move by move so the UI can replay it as a time-lapse."""
    check_heuristic(req.a)
    check_heuristic(req.b)
    game = play_game(
        req.n, req.holes, req.seed,
        {"heuristic": req.a, "depth": req.depth_a},
        {"heuristic": req.b, "depth": req.depth_b},
    )
    return {"a_is_player": 0, "b_is_player": 1, **game}
