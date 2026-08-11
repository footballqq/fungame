# codex: 2026-08-10 verify the proven 3x4 Gross site-pairing table rather than an invalid edge matching
from test_bridg_it import BridgItBoard


OPENING_MOVE = "bv_2_0"


def get_gross_pairing_map():
    """Return the verified Blue response for each legal Red move after opening."""
    return {
        "rh_0_0": "bv_0_1", "rh_0_1": "bv_0_0",
        "rh_0_2": "bv_1_0", "rh_1_0": "bv_0_2",
        "rh_1_1": "bv_1_2", "rh_1_2": "bv_1_1",
        "rh_2_1": "bh_2_0", "rv_1_1": "bv_2_1",
        "rh_2_2": "bh_2_1", "rv_1_2": "bv_2_2",
        "rv_0_1": "bh_1_1", "rv_0_2": "bh_1_0",
        "rv_0_0": "bh_0_0", "rv_0_3": "bh_0_1",
        "rv_1_0": "bh_3_0", "rv_1_3": "bh_3_1",
    }


def test_gross_pairing_covers_each_legal_red_reply() -> None:
    board = BridgItBoard(3, 4)
    assert board.place_move("blue", OPENING_MOVE)
    pairing = get_gross_pairing_map()

    assert set(pairing) == set(board.get_valid_moves("red"))
    assert set(pairing.values()) == set(board.get_valid_moves("blue"))

    for red_move, blue_move in pairing.items():
        position = BridgItBoard(3, 4)
        position.place_move("blue", OPENING_MOVE)
        assert position.place_move("red", red_move)
        assert blue_move in position.get_valid_moves("blue")
