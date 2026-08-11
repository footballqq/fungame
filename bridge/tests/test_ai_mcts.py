# codex: 2026-08-09 MCTS (Monte Carlo Tree Search) and Threat Pruning test suite for Bridg-It
import time
import math
import random
from typing import List, Tuple, Optional
from test_bridg_it import BridgItBoard

class MCTSNode:
    def __init__(self, move: Optional[str] = None, parent=None, color: str = "blue"):
        self.move = move
        self.parent = parent
        self.color = color
        self.children = []
        self.visits = 0
        self.wins = 0.0
        self.untried_moves = []

    def uct_score(self, total_visits: int, c_param: float = 1.414) -> float:
        if self.visits == 0:
            return float('inf')
        return (self.wins / self.visits) + c_param * math.sqrt(math.log(total_visits) / self.visits)

def check_immediate_threat(board: BridgItBoard, color: str) -> Optional[str]:
    # 1. Immediate Win: Can self win in 1 move?
    valid_self = board.get_valid_moves(color)
    for m in valid_self:
        board.place_move(color, m)
        if board.check_winner() == color:
            board.blue_edges[m]["owner"] = None if color == "blue" else board.blue_edges.get(m, {}).get("owner")
            if color == "red": board.red_edges[m]["owner"] = None
            else: board.blue_edges[m]["owner"] = None
            return m
        if color == "blue": board.blue_edges[m]["owner"] = None
        else: board.red_edges[m]["owner"] = None

    # 2. Immediate Block: Can opponent win in 1 move?
    opp_color = "red" if color == "blue" else "blue"
    valid_opp = board.get_valid_moves(opp_color)
    for om in valid_opp:
        board.place_move(opp_color, om)
        if board.check_winner() == opp_color:
            board.blue_edges[om]["owner"] = None if opp_color == "blue" else board.blue_edges.get(om, {}).get("owner")
            if opp_color == "red": board.red_edges[om]["owner"] = None
            else: board.blue_edges[om]["owner"] = None
            
            # Find AI's edge that blocks this opponent move
            blocking_edge = board.red_to_blue_map.get(om) if color == "blue" else board.blue_to_red_map.get(om)
            if blocking_edge and blocking_edge in valid_self:
                return blocking_edge
        if opp_color == "blue": board.blue_edges[om]["owner"] = None
        else: board.red_edges[om]["owner"] = None

    return None

def test_threat_pruning():
    board = BridgItBoard(3, 4)
    # Blue has bv_0_0 and bv_1_0 -> Blue can win with bv_2_0
    board.place_move("blue", "bv_0_0")
    board.place_move("blue", "bv_1_0")
    
    # Check immediate winning move for Blue
    win_move = check_immediate_threat(board, "blue")
    assert win_move == "bv_2_0"

    # Reset and test Red blocking Blue's win
    board2 = BridgItBoard(3, 4)
    board2.place_move("blue", "bv_0_0")
    board2.place_move("blue", "bv_1_0")
    # Blue threatens to win at bv_2_0. Red's intersecting edge is rh_3_0
    block_move = check_immediate_threat(board2, "red")
    assert block_move == "rh_2_0"
    print("\nThreat Pruning Test Passed successfully!")
