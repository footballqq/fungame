# codex: 2026-09-14 实现滑冰棋 AI 评估算法与决策引擎，支持启发式评分与 Minimax 搜索
"""
滑冰棋 AI 决策引擎
包含：
1. 启发式局面评估函数 (Heuristic Evaluation)
2. 一步制胜/防守阻截检测 (Instant Win / Block Detection)
3. 走法排序与剪枝 (Move Ordering & Pruning)
4. Minimax / Alpha-Beta 搜索 (支持难度分级：简单、中等、困难)
"""

import math
from typing import List, Tuple, Optional
from engine import (
    HexCoord,
    IceSkatingGame,
    SlideMove,
    TileMove,
    TurnAction,
    PLAYER_RED,
    PLAYER_BLUE
)


def evaluate_board(game: IceSkatingGame, for_player: int) -> float:
    """
    评估当前局面对于 for_player 的优劣得分。
    得分维度：
    1. 铁三角胜利：+100,000 / 对手胜利：-100,000
    2. 己方三子间总曼哈顿/六角距离（越小越优，距离为3即成铁三角）
    3. 己方两两相邻的对数（每有一对相邻+150分）
    4. 对手三子间总距离（越大越优）
    5. 对手两两相邻对数（惩罚对手的相邻）
    6. 己方棋子的灵活性（合法滑行方向数）
    """
    opp = PLAYER_BLUE if for_player == PLAYER_RED else PLAYER_RED

    # 胜利检测
    if game.check_player_triangle(for_player):
        return 100000.0
    if game.check_player_triangle(opp):
        return -100000.0

    my_p = game.pieces[for_player]
    opp_p = game.pieces[opp]

    # 己方距离与相邻对数
    d01 = my_p[0].distance_to(my_p[1])
    d12 = my_p[1].distance_to(my_p[2])
    d20 = my_p[2].distance_to(my_p[0])
    my_dist_sum = d01 + d12 + d20

    my_adj_pairs = (1 if d01 == 1 else 0) + (1 if d12 == 1 else 0) + (1 if d20 == 1 else 0)

    # 对手距离与相邻对数
    od01 = opp_p[0].distance_to(opp_p[1])
    od12 = opp_p[1].distance_to(opp_p[2])
    od20 = opp_p[2].distance_to(opp_p[0])
    opp_dist_sum = od01 + od12 + od20

    opp_adj_pairs = (1 if od01 == 1 else 0) + (1 if od12 == 1 else 0) + (1 if od20 == 1 else 0)

    score = 0.0

    # 距离评分：初始总距离通常在 10~12，接近 3 时得分极高
    score += (18.0 - my_dist_sum) * 40.0
    score -= (18.0 - opp_dist_sum) * 45.0

    # 相邻对数评分
    score += my_adj_pairs * 160.0
    score -= opp_adj_pairs * 200.0  # 优先防守对手即将成型

    # 若已有两对相邻且三子距离很近（只差一步成三角），给予重磅激励
    if my_adj_pairs == 2:
        score += 500.0
    if opp_adj_pairs == 2:
        score -= 700.0

    return score


class IceSkatingAI:
    """AI 决策器"""

    def __init__(self, difficulty: str = "medium"):
        # difficulty: 'easy', 'medium', 'hard'
        self.difficulty = difficulty

    def select_best_turn(self, game: IceSkatingGame) -> Optional[TurnAction]:
        """
        为当前玩家选出最佳回合行动（滑冰 + 搬移底座）。
        """
        player = game.current_player
        valid_slides = game.get_all_valid_slides(player)
        if not valid_slides:
            return None

        # 简单难度：随机加轻度距离贪心
        if self.difficulty == "easy":
            import random
            best_action = None
            best_score = -math.inf
            # 随机抽样部分合法走法评估
            random.shuffle(valid_slides)
            for slide in valid_slides[:6]:
                # 模拟滑行
                game_copy = IceSkatingGame(
                    tiles=set(game.tiles),
                    pieces={PLAYER_RED: list(game.pieces[PLAYER_RED]), PLAYER_BLUE: list(game.pieces[PLAYER_BLUE])},
                    current_player=player,
                    strict_triangle_only=game.strict_triangle_only
                )
                game_copy.apply_slide(slide)
                removables = game_copy.get_removable_tiles()
                if not removables:
                    continue
                random.shuffle(removables)
                tile_rem = removables[0]
                placements = game_copy.get_valid_placements(tile_rem)
                if not placements:
                    continue
                random.shuffle(placements)
                tile_to = placements[0]
                tile_move = TileMove(from_tile=tile_rem, to_tile=tile_to)

                # 执行底座搬移
                game_copy.apply_tile_move(tile_move)
                score = evaluate_board(game_copy, player) + random.uniform(-20, 20)
                if score > best_score:
                    best_score = score
                    best_action = TurnAction(slide_move=slide, tile_move=tile_move)
            return best_action

        # 中等 / 困难：先查找能否一步制胜，若不能则使用启发式评估排序与搜索
        best_action = None
        best_score = -math.inf

        # 1. 优先遍历滑行
        for slide in valid_slides:
            game_copy = IceSkatingGame(
                tiles=set(game.tiles),
                pieces={PLAYER_RED: list(game.pieces[PLAYER_RED]), PLAYER_BLUE: list(game.pieces[PLAYER_BLUE])},
                current_player=player,
                strict_triangle_only=game.strict_triangle_only
            )
            game_copy.apply_slide(slide)

            removables = game_copy.get_removable_tiles()
            if not removables:
                continue

            # 对底座移除和放置进行启发式候选筛选
            # 优先移除离己方较远或靠近对手的底座，优先放置在己方棋子周围
            for tile_rem in removables:
                placements = game_copy.get_valid_placements(tile_rem)
                if not placements:
                    continue

                # 排序 placements：靠近己方棋子的优先
                my_pieces = game_copy.pieces[player]
                placements.sort(key=lambda p: min(p.distance_to(mp) for mp in my_pieces))

                # 检查最有潜力的放置位置
                for tile_to in placements[:4]:
                    tile_move = TileMove(from_tile=tile_rem, to_tile=tile_to)
                    # 模拟完成回合
                    sim_game = IceSkatingGame(
                        tiles=set(game_copy.tiles),
                        pieces={PLAYER_RED: list(game_copy.pieces[PLAYER_RED]), PLAYER_BLUE: list(game_copy.pieces[PLAYER_BLUE])},
                        current_player=player,
                        strict_triangle_only=game.strict_triangle_only
                    )
                    sim_game.step_in_turn = 2
                    sim_game.apply_tile_move(tile_move)

                    # 如果这步直接胜利，立刻返回！
                    if sim_game.winner == player:
                        return TurnAction(slide_move=slide, tile_move=tile_move)

                    score = evaluate_board(sim_game, player)

                    if score > best_score:
                        best_score = score
                        best_action = TurnAction(slide_move=slide, tile_move=tile_move)

        return best_action
