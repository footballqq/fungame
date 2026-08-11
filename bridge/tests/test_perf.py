# codex: 2026-08-09 performance test for 6x7 and 8x9 boards to prevent main-thread freezing
import time
from typing import List, Tuple
from test_bridg_it import BridgItBoard

def get_shortest_path_edges(board: BridgItBoard, color: str) -> List[str]:
    valid = board.get_valid_moves(color)
    if not valid:
        return []
    
    scored = []
    opp_color = "red" if color == "blue" else "blue"
    
    for m in valid:
        board.place_move(color, m)
        dist_self = get_distance(board, color)
        dist_opp = get_distance(board, opp_color)
        if color == "blue":
            board.blue_edges[m]["owner"] = None
        else:
            board.red_edges[m]["owner"] = None
        
        score = (dist_opp * 10) - (dist_self * 15)
        scored.append((score, m))
        
    scored.sort(key=lambda x: x[0], reverse=True)
    return [m for _, m in scored[:8]]

def get_distance(board: BridgItBoard, color: str) -> int:
    R, C = board.R, board.C
    if color == "blue":
        queue = [(0, c, 0) for c in range(C - 1)]
        visited = set((0, c) for c in range(C - 1))
        while queue:
            r, c, dist = queue.pop(0)
            if r == R:
                return dist
            nbrs = [
                (r - 1, c, f"bv_{r-1}_{c}"),
                (r + 1, c, f"bv_{r}_{c}"),
                (r, c - 1, f"bh_{r}_{c-1}"),
                (r, c + 1, f"bh_{r}_{c}")
            ]
            for nr, nc, edge in nbrs:
                if 0 <= nr <= R and 0 <= nc < C - 1:
                    e_data = board.blue_edges.get(edge)
                    if not e_data or e_data["owner"] == "red":
                        continue
                    cost = 0 if e_data["owner"] == "blue" else 1
                    if (nr, nc) not in visited:
                        visited.add((nr, nc))
                        queue.append((nr, nc, dist + cost))
        return 999
    else:
        queue = [(r, 0, 0) for r in range(R)]
        visited = set((r, 0) for r in range(R))
        while queue:
            r, c, dist = queue.pop(0)
            if c == C - 1:
                return dist
            nbrs = [
                (r - 1, c, f"rv_{r-1}_{c}"),
                (r + 1, c, f"rv_{r}_{c}"),
                (r, c - 1, f"rh_{r}_{c-1}"),
                (r, c + 1, f"rh_{r}_{c}")
            ]
            for nr, nc, edge in nbrs:
                if 0 <= nr < R and 0 <= nc < C:
                    e_data = board.red_edges.get(edge)
                    if not e_data or e_data["owner"] == "blue":
                        continue
                    cost = 0 if e_data["owner"] == "red" else 1
                    if (nr, nc) not in visited:
                        visited.add((nr, nc))
                        queue.append((nr, nc, dist + cost))
        return 999

def test_performance_6x7():
    board = BridgItBoard(6, 7)
    t0 = time.time()
    candidates = get_shortest_path_edges(board, "red")
    t1 = time.time()
    elapsed = (t1 - t0) * 1000
    print(f"\n6x7 board candidates calculation time: {elapsed:.2f} ms")
    assert elapsed < 50
    assert len(candidates) > 0
