# codex: 2026-08-09 test core game logic and graph algorithms for Bridg-It (Blue Top-Bottom vs Red Left-Right)
import pytest
from typing import Dict, List, Set, Tuple, Optional

class BridgItBoard:
    """
    Bridg-It board model for testing logic:
    Blue dots: (R+1) rows x (C-1) cols (e.g. 4x3)
    Red dots: R rows x C cols (e.g. 3x4)
    """
    def __init__(self, R: int = 3, C: int = 4):
        self.R = R
        self.C = C
        
        self.blue_edges = {}
        for r in range(R):
            for c in range(C - 1):
                self.blue_edges[f"bv_{r}_{c}"] = {"type": "bv", "r": r, "c": c, "owner": None}
        for r in range(R + 1):
            for c in range(C - 2):
                self.blue_edges[f"bh_{r}_{c}"] = {"type": "bh", "r": r, "c": c, "owner": None}
                
        self.red_edges = {}
        for r in range(R):
            for c in range(C - 1):
                self.red_edges[f"rh_{r}_{c}"] = {"type": "rh", "r": r, "c": c, "owner": None}
        for r in range(R - 1):
            for c in range(C):
                self.red_edges[f"rv_{r}_{c}"] = {"type": "rv", "r": r, "c": c, "owner": None}

        self.blue_to_red_map = {}
        self.red_to_blue_map = {}
        self._build_intersection_map()

    def _build_intersection_map(self):
        for r in range(self.R):
            for c in range(self.C - 1):
                r_id = f"rh_{r}_{c}"
                b_id = f"bv_{r}_{c}"
                self.red_to_blue_map[r_id] = b_id
                self.blue_to_red_map[b_id] = r_id

        for r in range(self.R - 1):
            for c in range(1, self.C - 1):
                r_id = f"rv_{r}_{c}"
                b_id = f"bh_{r+1}_{c-1}"
                self.red_to_blue_map[r_id] = b_id
                self.blue_to_red_map[b_id] = r_id

    def get_valid_moves(self, color: str) -> List[str]:
        valid = []
        if color == "blue":
            for b_id, data in self.blue_edges.items():
                if data["owner"] is not None:
                    continue
                r_id = self.blue_to_red_map.get(b_id)
                if r_id and self.red_edges[r_id]["owner"] == "red":
                    continue
                valid.append(b_id)
        elif color == "red":
            for r_id, data in self.red_edges.items():
                if data["owner"] is not None:
                    continue
                b_id = self.red_to_blue_map.get(r_id)
                if b_id and self.blue_edges[b_id]["owner"] == "blue":
                    continue
                valid.append(r_id)
        return valid

    def place_move(self, color: str, edge_id: str) -> bool:
        if color == "blue":
            if edge_id not in self.blue_edges or self.blue_edges[edge_id]["owner"] is not None:
                return False
            intersecting_red = self.blue_to_red_map.get(edge_id)
            if intersecting_red and self.red_edges[intersecting_red]["owner"] == "red":
                return False
            self.blue_edges[edge_id]["owner"] = "blue"
            return True
        elif color == "red":
            if edge_id not in self.red_edges or self.red_edges[edge_id]["owner"] is not None:
                return False
            intersecting_blue = self.red_to_blue_map.get(edge_id)
            if intersecting_blue and self.blue_edges[intersecting_blue]["owner"] == "blue":
                return False
            self.red_edges[edge_id]["owner"] = "red"
            return True
        return False

    def check_winner(self) -> Optional[str]:
        top_blue = [(0, c) for c in range(self.C - 1)]
        visited_b = set(top_blue)
        queue_b = list(top_blue)
        
        while queue_b:
            r, c = queue_b.pop(0)
            if r == self.R:
                return "blue"
            if r > 0 and self.blue_edges.get(f"bv_{r-1}_{c}", {}).get("owner") == "blue":
                nxt = (r - 1, c)
                if nxt not in visited_b:
                    visited_b.add(nxt)
                    queue_b.append(nxt)
            if r < self.R and self.blue_edges.get(f"bv_{r}_{c}", {}).get("owner") == "blue":
                nxt = (r + 1, c)
                if nxt not in visited_b:
                    visited_b.add(nxt)
                    queue_b.append(nxt)
            if c > 0 and self.blue_edges.get(f"bh_{r}_{c-1}", {}).get("owner") == "blue":
                nxt = (r, c - 1)
                if nxt not in visited_b:
                    visited_b.add(nxt)
                    queue_b.append(nxt)
            if c < self.C - 2 and self.blue_edges.get(f"bh_{r}_{c}", {}).get("owner") == "blue":
                nxt = (r, c + 1)
                if nxt not in visited_b:
                    visited_b.add(nxt)
                    queue_b.append(nxt)

        left_red = [(r, 0) for r in range(self.R)]
        visited_r = set(left_red)
        queue_r = list(left_red)

        while queue_r:
            r, c = queue_r.pop(0)
            if c == self.C - 1:
                return "red"
            if r > 0 and self.red_edges.get(f"rv_{r-1}_{c}", {}).get("owner") == "red":
                nxt = (r - 1, c)
                if nxt not in visited_r:
                    visited_r.add(nxt)
                    queue_r.append(nxt)
            if r < self.R - 1 and self.red_edges.get(f"rv_{r}_{c}", {}).get("owner") == "red":
                nxt = (r + 1, c)
                if nxt not in visited_r:
                    visited_r.add(nxt)
                    queue_r.append(nxt)
            if c > 0 and self.red_edges.get(f"rh_{r}_{c-1}", {}).get("owner") == "red":
                nxt = (r, c - 1)
                if nxt not in visited_r:
                    visited_r.add(nxt)
                    queue_r.append(nxt)
            if c < self.C - 1 and self.red_edges.get(f"rh_{r}_{c}", {}).get("owner") == "red":
                nxt = (r, c + 1)
                if nxt not in visited_r:
                    visited_r.add(nxt)
                    queue_r.append(nxt)

        return None


def test_board_initialization():
    board = BridgItBoard(3, 4)
    assert len(board.blue_edges) == 17
    assert len(board.red_edges) == 17
    assert len(board.blue_to_red_map) == 13


def test_move_and_intersection_blocking():
    board = BridgItBoard(3, 4)
    assert board.place_move("blue", "bv_0_0") is True
    assert board.place_move("red", "rh_0_0") is False


def test_blue_win_condition():
    board = BridgItBoard(3, 4)
    # Blue vertical path from top (r=0) to bottom (r=3): bv_0_0 -> bv_1_0 -> bv_2_0
    assert board.place_move("blue", "bv_0_0") is True
    assert board.place_move("blue", "bv_1_0") is True
    assert board.place_move("blue", "bv_2_0") is True
    assert board.check_winner() == "blue"


def test_red_win_condition():
    board = BridgItBoard(3, 4)
    # Red horizontal path from left (c=0) to right (c=3): rh_0_0 -> rh_0_1 -> rh_0_2
    assert board.place_move("red", "rh_0_0") is True
    assert board.place_move("red", "rh_0_1") is True
    assert board.place_move("red", "rh_0_2") is True
    assert board.check_winner() == "red"


def test_ai_valid_moves():
    board = BridgItBoard(3, 4)
    moves_b = board.get_valid_moves("blue")
    moves_r = board.get_valid_moves("red")
    assert len(moves_b) == 17
    assert len(moves_r) == 17

    board.place_move("blue", "bv_0_0")
    moves_r_after = board.get_valid_moves("red")
    assert "rh_0_0" not in moves_r_after
    assert len(moves_r_after) == 16
