# codex: 2026-08-09 benchmark exact AI computation time on an 8x7 board
import time
from test_bridg_it import BridgItBoard
from test_perf import get_shortest_path_edges

def benchmark_8x7_board():
    R, C = 7, 8
    board = BridgItBoard(R, C)
    
    # Measure candidate evaluation time on fresh 7x8 board
    t0 = time.time()
    candidates = get_shortest_path_edges(board, "red")
    t1 = time.time()
    elapsed_ms = (t1 - t0) * 1000
    
    print(f"\n[Benchmarking 7x8 Board]")
    print(f"Total Edges: Blue={len(board.blue_edges)}, Red={len(board.red_edges)}")
    print(f"Top 8 Candidates Calculation Time: {elapsed_ms:.2f} ms")
    assert elapsed_ms < 150

if __name__ == "__main__":
    benchmark_8x7_board()
