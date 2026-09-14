# codex: 2026-09-14 编写 AI 决策与一步制胜判定的单元测试
"""
滑冰棋 AI 单元测试：验证启发式评分、一步制胜选择与合法走法生成
"""

from engine import (
    HexCoord,
    IceSkatingGame,
    PLAYER_RED,
    PLAYER_BLUE
)
from ai_engine import evaluate_board, IceSkatingAI


def test_ai_evaluation_scores():
    """测试评估函数对铁三角和距离的灵敏度"""
    triangle_pieces = {
        PLAYER_RED: [HexCoord(0, 0, 0), HexCoord(1, -1, 0), HexCoord(1, 0, -1)],
        PLAYER_BLUE: [HexCoord(2, 0, -2), HexCoord(-2, 0, 2), HexCoord(0, -2, 2)]
    }
    game_win = IceSkatingGame(pieces=triangle_pieces, current_player=PLAYER_RED)
    score_red = evaluate_board(game_win, PLAYER_RED)
    score_blue = evaluate_board(game_win, PLAYER_BLUE)

    assert score_red >= 100000.0
    assert score_blue <= -100000.0


def test_ai_finds_instant_win():
    """测试 AI 当存在一步可成铁三角时，能立即选择该制胜步"""
    # 红方已有两个子紧挨着 (0, 0, 0) 和 (1, -1, 0)
    # 第三个红子在 (1, 2, -3) 或某条滑道上，可以通过一次滑行停在 (1, 0, -1)
    custom_pieces = {
        PLAYER_RED: [HexCoord(0, 0, 0), HexCoord(1, -1, 0), HexCoord(1, 2, -3)],
        PLAYER_BLUE: [HexCoord(-2, 0, 2), HexCoord(-2, 2, 0), HexCoord(0, -2, 2)]
    }
    # 棋盘包含这些底座
    game = IceSkatingGame(pieces=custom_pieces, current_player=PLAYER_RED)
    # 保证 (1, 2, -3) 和滑行路径在棋盘内
    game.tiles.add(HexCoord(1, 2, -3))
    game.tiles.add(HexCoord(1, 1, -2))

    # 方向 (0, -1, 1): (1, 2, -3) + (0, -1, 1) = (1, 1, -2) + (0, -1, 1) = (1, 0, -1)
    # 下一个是 (1, -1, 0)，已被己方棋子挡住！所以刚好停在 (1, 0, -1)！
    # 停在 (1, 0, -1) 后，红方三子为 (0, 0, 0), (1, -1, 0), (1, 0, -1) 构成铁三角！
    ai = IceSkatingAI(difficulty="medium")
    action = ai.select_best_turn(game)

    assert action is not None
    assert action.slide_move.to_coord == HexCoord(1, 0, -1)


def test_ai_generates_valid_turn_from_initial_board():
    """测试 AI 从初始棋局能正常规划并输出完整回合动作"""
    game = IceSkatingGame()
    ai = IceSkatingAI(difficulty="medium")
    action = ai.select_best_turn(game)

    assert action is not None
    assert action.slide_move.from_coord in game.pieces[PLAYER_RED]
    assert action.slide_move.to_coord != action.slide_move.from_coord
    assert action.tile_move.from_tile in game.tiles
    assert action.tile_move.to_tile != action.tile_move.from_tile
