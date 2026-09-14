# codex: 2026-09-14 编写滑冰棋核心规则引擎的 pytest 单元测试
"""
滑冰棋核心规则引擎单元测试
测试覆盖：六边形坐标、19底座初始化、冰面滑行机制、底座移除与放置连通性约束、铁三角胜利判定
"""

import pytest
from engine import (
    HexCoord,
    IceSkatingGame,
    SlideMove,
    TileMove,
    PLAYER_RED,
    PLAYER_BLUE,
    get_initial_tiles,
    get_initial_pieces,
    is_connected
)


def test_hex_coordinates():
    """测试六边形坐标基本运算、距离与邻居"""
    c1 = HexCoord(0, 0, 0)
    c2 = HexCoord(1, -1, 0)
    c3 = HexCoord(2, -2, 0)

    # 邻接性与距离
    assert c1.distance_to(c2) == 1
    assert c1.is_adjacent(c2)
    assert c1.distance_to(c3) == 2
    assert not c1.is_adjacent(c3)

    # 邻居数量
    neighbors = c1.neighbors()
    assert len(neighbors) == 6
    assert c2 in neighbors

    # 非法坐标校验
    with pytest.raises(ValueError):
        HexCoord(1, 1, 1)


def test_initial_board_and_pieces():
    """测试初始棋盘结构（19个底座）及初始6个角顶点的棋子交替摆放"""
    tiles = get_initial_tiles()
    assert len(tiles) == 19
    assert is_connected(tiles)

    # 中心底座 (0,0,0) 应在棋盘内且被 6 个邻居完全环绕
    center = HexCoord(0, 0, 0)
    assert center in tiles
    assert sum(1 for n in center.neighbors() if n in tiles) == 6

    pieces = get_initial_pieces()
    assert len(pieces[PLAYER_RED]) == 3
    assert len(pieces[PLAYER_BLUE]) == 3

    # 所有棋子均在初始底座上
    for p in pieces[PLAYER_RED] + pieces[PLAYER_BLUE]:
        assert p in tiles
        # 初始棋子均在最外圈（即邻居数 < 6）
        assert sum(1 for n in p.neighbors() if n in tiles) < 6

    # 双方棋子无重叠
    all_pieces = set(pieces[PLAYER_RED]) | set(pieces[PLAYER_BLUE])
    assert len(all_pieces) == 6


def test_slide_mechanics_to_boundary():
    """测试冰面滑行直到棋盘边缘停下（Ice-sliding 机制）"""
    game = IceSkatingGame()
    # 红方初始一枚棋子在 (0, -2, 2)
    start = HexCoord(0, -2, 2)
    assert start in game.pieces[PLAYER_RED]

    # 方向 (0, +1, -1) 是从 (0, -2, 2) 穿过中心 (0, 0, 0) 朝对角滑行
    # 路径：(0, -2, 2) -> (0, -1, 1) -> (0, 0, 0) -> (0, 1, -1) -> 蓝方在 (0, 2, -2)！
    # 注意蓝方刚好在 (0, 2, -2)，因此会被蓝方阻挡在 (0, 1, -1)！
    d_idx = 2  # (0, +1, -1)
    dest = game.calculate_slide_destination(start, d_idx)
    assert dest == HexCoord(0, 1, -1)

    # 测试向外滑出棋盘的方向：(0, -1, 1) 是往外滑
    # (0, -2, 2) + (0, -1, 1) = (0, -3, 3) 不在棋盘内，所以应该无法朝该方向移动
    d_out_idx = 5  # (0, -1, +1)
    assert game.calculate_slide_destination(start, d_out_idx) is None


def test_slide_blocked_by_obstacle():
    """测试滑行被其他棋子阻挡（不能穿透棋子，必须停在障碍物前一个底座）"""
    # 构造一个简单棋局：在 (0, 0, 0) 放置一个障碍棋子
    custom_pieces = {
        PLAYER_RED: [HexCoord(0, -2, 2), HexCoord(2, 0, -2), HexCoord(-2, 2, 0)],
        PLAYER_BLUE: [HexCoord(0, 0, 0), HexCoord(0, 2, -2), HexCoord(-2, 0, 2)]
    }
    game = IceSkatingGame(pieces=custom_pieces)

    start = HexCoord(0, -2, 2)
    d_idx = 2  # 方向 (0, +1, -1)
    dest = game.calculate_slide_destination(start, d_idx)
    # 因为 (0, 0, 0) 有蓝方棋子阻挡，所以滑行必须停在 (0, -1, 1)
    assert dest == HexCoord(0, -1, 1)


def test_tile_removable_rules():
    """测试搬移底座第一步：拿掉最外圈无棋子空底座，且保证剩余18底座连通"""
    game = IceSkatingGame()
    removables = game.get_removable_tiles()

    # 验证每一个可移除的底座
    for tile in removables:
        # 1. 绝不能有棋子
        assert tile not in game.get_all_occupied_coords()
        # 2. 邻居数必须 < 6（最外圈）
        assert sum(1 for n in tile.neighbors() if n in game.tiles) < 6
        # 3. 移除后剩余18底座仍然连通
        assert is_connected(game.tiles - {tile})

    # 中心底座 (0,0,0) 绝不可被移除（邻居为6）
    assert HexCoord(0, 0, 0) not in removables

    # 有棋子的底座绝不可被移除
    for p in game.get_all_occupied_coords():
        assert p not in removables


def test_tile_placement_rules():
    """测试搬移底座第二步：新位置必须与现有底座中至少2个相邻，且保持紧凑"""
    game = IceSkatingGame()
    removables = game.get_removable_tiles()
    assert len(removables) > 0

    tile_to_remove = removables[0]
    placements = game.get_valid_placements(tile_to_remove)

    remaining = game.tiles - {tile_to_remove}
    assert len(placements) > 0

    for cand in placements:
        # 不能是剩余底座中的坐标
        assert cand not in remaining
        # 不能是原坐标
        assert cand != tile_to_remove
        # 至少与 2 个现有底座边相邻
        adj_count = sum(1 for n in cand.neighbors() if n in remaining)
        assert adj_count >= 2


def test_turn_progression():
    """测试完整回合流程：移动棋子 -> 搬移底座 -> 切换玩家"""
    game = IceSkatingGame()
    assert game.current_player == PLAYER_RED
    assert game.step_in_turn == 1

    # 1. 红方移动棋子
    slides = game.get_all_valid_slides()
    assert len(slides) > 0
    chosen_slide = slides[0]
    game.apply_slide(chosen_slide)

    assert game.step_in_turn == 2
    assert chosen_slide.from_coord not in game.pieces[PLAYER_RED]
    assert chosen_slide.to_coord in game.pieces[PLAYER_RED]

    # 2. 红方搬移底座
    removables = game.get_removable_tiles()
    assert len(removables) > 0
    tile_to_remove = removables[0]

    placements = game.get_valid_placements(tile_to_remove)
    assert len(placements) > 0
    target_placement = placements[0]

    game.apply_tile_move(TileMove(from_tile=tile_to_remove, to_tile=target_placement))

    # 3. 验证进入蓝方回合
    assert game.step_in_turn == 1
    assert game.current_player == PLAYER_BLUE
    assert tile_to_remove not in game.tiles
    assert target_placement in game.tiles
    assert len(game.tiles) == 19
    assert is_connected(game.tiles)


def test_strict_triangle_victory():
    """测试铁三角胜利判定：3枚棋子两两相邻"""
    # 构造红方铁三角局面：(0, 0, 0), (1, -1, 0), (1, 0, -1)
    # 这三枚棋子两两距离均为 1，构成互邻铁三角
    triangle_pieces = {
        PLAYER_RED: [HexCoord(0, 0, 0), HexCoord(1, -1, 0), HexCoord(1, 0, -1)],
        PLAYER_BLUE: [HexCoord(2, 0, -2), HexCoord(-2, 0, 2), HexCoord(0, -2, 2)]
    }
    game = IceSkatingGame(pieces=triangle_pieces, current_player=PLAYER_RED, strict_triangle_only=True)
    assert game.check_player_triangle(PLAYER_RED) is True
    assert game.check_win_condition() == PLAYER_RED

    # 构造三子连线而非铁三角：(-1, 0, 1), (0, 0, 0), (1, 0, -1)
    # 两端距离为 2，不满足两两相邻的铁三角
    line_pieces = {
        PLAYER_RED: [HexCoord(-1, 0, 1), HexCoord(0, 0, 0), HexCoord(1, 0, -1)],
        PLAYER_BLUE: [HexCoord(2, 0, -2), HexCoord(-2, 0, 2), HexCoord(0, -2, 2)]
    }
    game_line = IceSkatingGame(pieces=line_pieces, current_player=PLAYER_RED, strict_triangle_only=True)
    assert game_line.check_player_triangle(PLAYER_RED) is False
    assert game_line.check_win_condition() is None

    # 如果切换为连通块模式（只要连通即可）
    game_connected = IceSkatingGame(pieces=line_pieces, current_player=PLAYER_RED, strict_triangle_only=False)
    assert game_connected.check_player_triangle(PLAYER_RED) is True
    assert game_connected.check_win_condition() == PLAYER_RED
