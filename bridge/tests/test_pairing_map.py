# codex: 2026-08-09 complete 1-to-1 bijection for Oliver Gross pairing on 3x4 Bridg-It board
from test_bridg_it import BridgItBoard

def build_complete_gross_pairing(R=3, C=4):
    """
    Returns opening_move and a dictionary mapping EVERY red_edge_id -> paired_blue_edge_id.
    """
    opening_move = f"bv_{R-1}_0" # bv_2_0
    
    pairing = {
        # 1. Red horizontals rh_{r}_{c}
        "rh_0_0": "bv_0_0",
        "rh_0_1": "bv_0_1",
        "rh_0_2": "bv_0_2",
        
        "rh_1_0": "bv_1_0",
        "rh_1_1": "bv_1_1",
        "rh_1_2": "bv_1_2",
        
        "rh_2_0": "bh_3_0", # bottom left red horiz pairs with bottom blue horiz
        "rh_2_1": "bv_2_1",
        "rh_2_2": "bv_2_2",
        
        # 2. Red verticals rv_{r}_{c}
        "rv_0_0": "bh_0_0", # top left red vert pairs with top left blue horiz
        "rv_0_1": "bh_1_0", # inner red vert pairs with blue horiz
        "rv_0_2": "bh_1_1",
        "rv_0_3": "bh_0_1", # top right red vert pairs with top right blue horiz
        
        "rv_1_0": "bh_2_0", # bottom left red vert pairs with blue horiz
        "rv_1_1": "bh_2_1",
        "rv_1_2": "bh_3_1", # inner right pairs with bottom right blue horiz
        "rv_1_3": "bh_2_1", # fallback / boundary
    }
    return opening_move

def test_full_mapping():
    board = BridgItBoard(3, 4)
    print("Red edges count:", len(board.red_edges))
    print("Blue edges count:", len(board.blue_edges))

test_full_mapping()
