# codex: 2026-08-10 exhaustively validate Gross's 3x4 productive-site pairing against every Red order
from copy import deepcopy

from test_bridg_it import BridgItBoard
from test_gross_strategy import OPENING_MOVE, get_gross_pairing_map


BOUNDARY_RED_MOVES = {"rv_0_0", "rv_0_3", "rv_1_0", "rv_1_3"}


def test_gross_pairing_wins_all_productive_move_orders() -> None:
    pairing = get_gross_pairing_map()
    productive_moves = set(pairing) - BOUNDARY_RED_MOVES
    board = BridgItBoard(3, 4)
    board.place_move("blue", OPENING_MOVE)

    def blue_wins_after_every_response(position: BridgItBoard) -> bool:
        winner = position.check_winner()
        if winner:
            return winner == "blue"

        red_moves = set(position.get_valid_moves("red")) & productive_moves
        if not red_moves:
            return False

        for red_move in red_moves:
            next_position = deepcopy(position)
            next_position.place_move("red", red_move)
            if next_position.check_winner() == "red":
                return False
            blue_move = pairing[red_move]
            if blue_move not in next_position.get_valid_moves("blue"):
                return False
            next_position.place_move("blue", blue_move)
            if not blue_wins_after_every_response(next_position):
                return False
        return True

    assert blue_wins_after_every_response(board)
