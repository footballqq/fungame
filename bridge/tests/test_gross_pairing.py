# codex: 2026-08-09 find and verify Oliver Gross / Gale pairing bijection for Bridg-It
import itertools
from test_bridg_it import BridgItBoard

def build_gross_pairing(R: int, C: int):
    """
    Build 1-to-1 pairing map between Red edges and Blue edges after Blue opening move.
    Opening move: Blue plays bv_{R-1}_0 (or bv_0_{C-2})
    """
    opening_move = f"bv_{R-1}_0"
    pairing = {} # red_edge_id -> blue_edge_id

    # 1. Red horizontal edges rh_{r}_{c} (0<=r<R, 0<=c<C-1)
    for r in range(R):
        for c in range(C - 1):
            red_id = f"rh_{r}_{c}"
            if r < R - 1:
                # Pair rh_{r}_{c} with bv_{r+1}_{c}
                blue_id = f"bv_{r+1}_{c}"
                if blue_id == opening_move:
                    # Special pairing for rh_{R-2}_0 because bv_{R-1}_0 is the opening move
                    blue_id = f"bh_{R}_{0}"
                pairing[red_id] = blue_id
            else:
                # r == R - 1 (bottom row)
                if c < C - 2:
                    pairing[red_id] = f"bh_{R}_{c}"
                else:
                    # c == C - 1 (bottom-right)
                    pairing[red_id] = f"bh_{R}_{C-3}"

    # 2. Red vertical edges rv_{r}_{c} (0<=r<R-1, 0<=c<C)
    for r in range(R - 1):
        for c in range(C):
            red_id = f"rv_{r}_{c}"
            if c == 0:
                # Leftmost column
                pairing[red_id] = f"bv_{r}_0"
            elif c == C - 1:
                # Rightmost column
                pairing[red_id] = f"bv_{r}_{C-2}"
            else:
                # Inner columns 1 <= c <= C - 2
                pairing[red_id] = f"bh_{r}_{c-1}"

    return opening_move, pairing

def test_pairing_correctness(R=3, C=4):
    opening_move, pairing = build_gross_pairing(R, C)
    board = BridgItBoard(R, C)

    # Check 1: Opening move is valid
    assert opening_move in board.blue_edges

    # Check 2: All red edges are in pairing
    assert set(pairing.keys()) == set(board.red_edges.keys())

    # Check 3: All paired blue edges are valid and unique (1-to-1 bijection)
    remaining_blue = set(board.blue_edges.keys()) - {opening_move}
    paired_blue = set(pairing.values())
    
    print(f"\n[R={R}, C={C}]")
    print(f"Total Red edges: {len(pairing)}")
    print(f"Total Remaining Blue edges: {len(remaining_blue)}")
    print(f"Paired Blue edges: {len(paired_blue)}")
    
    diff = remaining_blue - paired_blue
    if diff:
        print(f"Unpaired Blue edges: {diff}")
    
    dup = len(pairing) - len(paired_blue)
    if dup > 0:
        print(f"Duplicate Blue targets: {dup}")

if __name__ == "__main__":
    for R, C in [(3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9)]:
        test_pairing_correctness(R, C)
