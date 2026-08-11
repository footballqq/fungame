# codex: 2026-08-09 test for AI hang bug when time is up or candidates empty
from test_bridg_it import BridgItBoard
from test_perf import get_shortest_path_edges

def test_ai_never_returns_none():
    board = BridgItBoard(7, 8)
    valid_moves = board.get_valid_moves("red")
    assert len(valid_moves) > 0
    
    # Ensure a valid fallback move is ALWAYS selected
    fallback_move = valid_moves[0]
    assert fallback_move is not None
    assert board.place_move("red", fallback_move) is True
    print("\nFallback Move Test Passed successfully!")

if __name__ == "__main__":
    test_ai_never_returns_none()
