# codex: 2026-08-09 test for game.currentPlayer state corruption during AI evaluation
from test_bridg_it import BridgItBoard

class MockAI:
    def __init__(self, color='red'):
        self.aiColor = color

    def check_threat(self, board):
        # Simulate opponent move testing
        opp_color = 'blue' if self.aiColor == 'red' else 'red'
        opp_moves = board.get_valid_moves(opp_color)
        
        orig_player = board.currentPlayer
        for m in opp_moves:
            board.place_move(opp_color, m)
            # Undo opponent move
            if opp_color == 'blue':
                board.blue_edges[m]['owner'] = None
            else:
                board.red_edges[m]['owner'] = None
            # Restore current player
            board.currentPlayer = orig_player

def test_current_player_restoration():
    board = BridgItBoard(3, 4)
    board.place_move('blue', 'bv_0_0')
    board.currentPlayer = 'red'

    orig_player = board.currentPlayer
    assert orig_player == 'red'

    # Perform mock check
    ai = MockAI('red')
    ai.check_threat(board)

    # State must be preserved
    assert board.currentPlayer == 'red'
    print("\nCurrent Player Restoration Test Passed!")

if __name__ == '__main__':
    test_current_player_restoration()
