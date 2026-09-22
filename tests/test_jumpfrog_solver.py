# codex: 2026-09-22 编写青蛙跳跃(jumpfrog)求解器与规则逻辑单元测试
import pytest
import sys
import os

# 确保能导入 boardgame/jumpfrog
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
jumpfrog_dir = os.path.join(parent_dir, "boardgame", "jumpfrog")
if jumpfrog_dir not in sys.path:
    sys.path.insert(0, jumpfrog_dir)

from jumpfrog_math import (
    EMPTY,
    WHITE,
    BLACK,
    create_initial_state,
    create_target_state,
    get_valid_moves,
    is_valid_move,
    apply_move,
    solve_bfs,
    get_hint,
    explain_move,
    evaluate_score,
)


def test_initial_and_target_states():
    """测试不同青蛙数量与空格位置的棋盘状态生成"""
    # 3v3 题图默认 (左侧空格)
    init_3_left = create_initial_state(3, 3, "left")
    tgt_3_left = create_target_state(3, 3, "left")
    assert init_3_left == (EMPTY, WHITE, WHITE, WHITE, BLACK, BLACK, BLACK)
    assert tgt_3_left == (EMPTY, BLACK, BLACK, BLACK, WHITE, WHITE, WHITE)

    # 2v2 经典中心空格
    init_2_center = create_initial_state(2, 2, "center")
    tgt_2_center = create_target_state(2, 2, "center")
    assert init_2_center == (WHITE, WHITE, EMPTY, BLACK, BLACK)
    assert tgt_2_center == (BLACK, BLACK, EMPTY, WHITE, WHITE)

    # 1v1 右侧空格
    init_1_right = create_initial_state(1, 1, "right")
    tgt_1_right = create_target_state(1, 1, "right")
    assert init_1_right == (WHITE, BLACK, EMPTY)
    assert tgt_1_right == (BLACK, WHITE, EMPTY)


def test_move_validity():
    """测试移动合法性判定（平移1格、跳跃2格、超距非法、空格移动非法）"""
    # 状态: [_, W, W, W, B, B, B]
    state = (EMPTY, WHITE, WHITE, WHITE, BLACK, BLACK, BLACK)

    # 合法平移：第1格白蛙移入第0格空格 (dist=1)
    assert is_valid_move(state, 1, 0) is True

    # 合法跳跃：第2格白蛙越过第1格跳入第0格空格 (dist=2)
    assert is_valid_move(state, 2, 0) is True

    # 非法超距：第3格白蛙试图跳3格到第0格 (dist=3)
    assert is_valid_move(state, 3, 0) is False

    # 非法移动：从空格移动到空格
    assert is_valid_move(state, 0, 1) is False

    # 非法移动：越界
    assert is_valid_move(state, -1, 0) is False
    assert is_valid_move(state, 1, 10) is False


def test_unidirectional_mode_restrictions():
    """测试单向模式限制（白蛙向右，黑蛙向左）"""
    # [W, _, B]
    state = (WHITE, EMPTY, BLACK)
    # 白蛙从0向右移到1：允许
    assert is_valid_move(state, 0, 1, allow_backward=False) is True
    # 黑蛙从2向左移到1：允许
    assert is_valid_move(state, 2, 1, allow_backward=False) is True

    # [B, _, W]
    state2 = (BLACK, EMPTY, WHITE)
    # 黑蛙从0向右移到1：单向模式禁止
    assert is_valid_move(state2, 0, 1, allow_backward=False) is False
    # 白蛙从2向左移到1：单向模式禁止
    assert is_valid_move(state2, 2, 1, allow_backward=False) is False

    # 自由模式（题图规则）：允许任意方向
    assert is_valid_move(state2, 0, 1, allow_backward=True) is True
    assert is_valid_move(state2, 2, 1, allow_backward=True) is True


def test_jumpfrog_jpg_3v3_solution():
    """验证题图原题（3白3黑左侧空格）的最优解与20步规则限制"""
    init = create_initial_state(3, 3, "left")
    tgt = create_target_state(3, 3, "left")

    path = solve_bfs(init, tgt, allow_backward=True)
    assert path is not None
    steps = len(path) - 1

    # 题图规则要求必须在 20 步以内（含 20 步）完成
    assert steps <= 20
    # 理论最优步数应为 17 步
    assert steps == 17

    # 验证路径中的每一步均为严格合法的移动
    for i in range(steps):
        s_cur = path[i]
        s_nxt = path[i + 1]
        empty_cur = s_cur.index(EMPTY)
        empty_nxt = s_nxt.index(EMPTY)
        # 对应青蛙从 empty_nxt 跳到了 empty_cur
        assert is_valid_move(s_cur, empty_nxt, empty_cur, allow_backward=True)
        assert apply_move(s_cur, empty_nxt, empty_cur) == s_nxt


def test_scalable_frog_counts():
    """测试可扩展青蛙数量：1v1, 2v2, 4v4 最优步数与可解性"""
    cases = [
        (1, 3),   # N=1 最少 3 步
        (2, 9),   # N=2 最少 9 步
        (3, 17),  # N=3 最少 17 步
        (4, 27),  # N=4 最少 27 步
    ]
    for n, expected_steps in cases:
        init = create_initial_state(n, n, "left")
        tgt = create_target_state(n, n, "left")
        path = solve_bfs(init, tgt, allow_backward=True)
        assert path is not None
        assert len(path) - 1 == expected_steps


def test_hint_and_explanation():
    """测试下一步提示与生动教学解说生成"""
    init = create_initial_state(3, 3, "left")
    tgt = create_target_state(3, 3, "left")

    hint = get_hint(init, tgt, allow_backward=True)
    assert hint is not None
    assert hint["to_idx"] == 0
    assert hint["from_idx"] in (1, 2)
    assert hint["remaining_steps"] == 17
    assert len(hint["explanation"]) > 0


def test_score_and_praise_evaluation():
    """测试星级与鼓励评价"""
    # 17 步完成 3v3：3 星
    res_3star = evaluate_score(17, 17, 20)
    assert res_3star["stars"] == 3
    assert "大师" in res_3star["badge"]

    # 20 步完成：2 星
    res_2star = evaluate_score(20, 17, 20)
    assert res_2star["stars"] == 2

    # 25 步完成：1 星
    res_1star = evaluate_score(25, 17, 20)
    assert res_1star["stars"] == 1
