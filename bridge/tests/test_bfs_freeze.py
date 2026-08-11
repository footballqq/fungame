# codex: 2026-08-09 reproduction and fix for 0-1 BFS queue explosion in Bridg-It
import time
from test_bridg_it import BridgItBoard
from collections import deque

def zero_one_bfs_shortest_path(board: BridgItBoard, color: str) -> int:
    R, C = board.R, board.C
    if color == "blue":
        # 0-1 BFS using Deque
        queue = deque([(0, c, 0) for c in range(C - 1)])
        visited = {(0, c): 0 for c in range(C - 1)}
        
        while queue:
            r, c, dist = queue.popleft()
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
                    new_dist = dist + cost
                    key = (nr, nc)
                    
                    if key not in visited or new_dist < visited[key]:
                        visited[key] = new_dist
                        if cost == 0:
                            queue.appendleft((nr, nc, new_dist)) # 0-cost goes to FRONT!
                        else:
                            queue.append((nr, nc, new_dist))     # 1-cost goes to BACK!
        return 999
    return 999

def test_bfs_performance():
    board = BridgItBoard(8, 9)
    # Claim 20 random edges to create 0-cost paths
    for i in range(10):
        board.place_move("blue", f"bv_{i%7}_{i%7}")
        board.place_move("red", f"rh_{i%7}_{i%7}")
        
    t0 = time.time()
    for _ in range(100):
        dist = zero_one_bfs_shortest_path(board, "blue")
    t1 = time.time()
    
    elapsed = (t1 - t0) * 1000
    print(f"\n100 runs of 0-1 BFS on 8x9 board with owned edges: {elapsed:.2f} ms")
    assert elapsed < 50

if __name__ == "__main__":
    test_bfs_performance()
