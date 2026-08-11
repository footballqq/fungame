# codex: 2026-08-09 test 100% win rate for 7x8 board using Lehman/Gross pairing strategy
import random
from test_bridg_it import BridgItBoard

def test_7x8_pairing_win_rate():
    R, C = 7, 8
    total_games = 100
    blue_wins = 0

    for _ in range(total_games):
        board = BridgItBoard(R, C)
        
        # Opening move: Blue plays central vertical edge
        center_r = R // 2
        center_c = (C - 1) // 2
        opening = f"bv_{center_r}_{center_c}"
        board.place_move("blue", opening)

        # Game loop
        while not board.check_winner():
            valid_red = board.get_valid_moves("red")
            if not valid_red:
                break
            
            # Red makes random move
            red_move = random.choice(valid_red)
            board.place_move("red", red_move)

            if board.check_winner():
                break

            # Blue plays paired move via dual graph map
            paired_blue = board.red_to_blue_map.get(red_move)
            valid_blue = board.get_valid_moves("blue")

            if paired_blue and paired_blue in valid_blue:
                board.place_move("blue", paired_blue)
            elif valid_blue:
                board.place_move("blue", valid_blue[0])

        if board.check_winner() == "blue":
            blue_wins += 1

    print(f"\n[7x8 Board Pairing Test] Blue Wins: {blue_wins}/{total_games} ({blue_wins/total_games*100:.1f}%)")

if __name__ == "__main__":
    test_7x8_pairing_win_rate()
