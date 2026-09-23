# codex: 2026-09-09 编写 6x6 奇偶棋盘谜题单测覆盖数学定理、构造解与求解器
import os
import sys
import pytest

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from stones.parity_math import (
    compute_theoretical_min_pieces,
    validate_board,
    construct_optimal_solution,
    solve_parity_puzzle,
    find_hint,
)



def test_theoretical_min_pieces():
    """测试奇偶棋盘理论极小值推导"""
    # 偶数棋盘: 理论最少 2n 枚
    assert compute_theoretical_min_pieces(4) == 8
    assert compute_theoretical_min_pieces(6) == 12
    assert compute_theoretical_min_pieces(8) == 16
    assert compute_theoretical_min_pieces(10) == 20

    # 奇数棋盘: 行总和与列总和奇偶性冲突，理论无解
    assert compute_theoretical_min_pieces(3) == -1
    assert compute_theoretical_min_pieces(5) == -1


def test_validate_board():
    """测试棋盘校验器对于合规与违规布局的判定"""
    # 6x6 构造解
    board = construct_optimal_solution(6)
    res = validate_board(board)
    assert res["is_valid"] is True
    assert res["is_optimal"] is True
    assert res["total_pieces"] == 12
    assert res["min_pieces"] == 12
    assert all(res["row_valid"])
    assert all(res["col_valid"])

    # 破坏行约束：第一行清空
    board_bad_row = [row[:] for row in board]
    board_bad_row[0] = [0] * 6
    res_bad_row = validate_board(board_bad_row)
    assert res_bad_row["is_valid"] is False
    assert res_bad_row["row_valid"][0] is False

    # 破坏列约束：在第一列增加一枚棋子使其变为偶数枚
    board_bad_col = [row[:] for row in board]
    for r in range(6):
        if board_bad_col[r][0] == 0:
            board_bad_col[r][0] = 1
            break
    res_bad_col = validate_board(board_bad_col)
    assert res_bad_col["is_valid"] is False
    assert res_bad_col["col_valid"][0] is False


def test_optimal_construction_4x4_6x6_8x8():
    """测试 4x4, 6x6, 8x8 的显式确定性最优构造"""
    for n in [4, 6, 8]:
        board = construct_optimal_solution(n)
        res = validate_board(board)
        assert res["is_valid"] is True
        assert res["is_optimal"] is True
        assert res["total_pieces"] == 2 * n

        # 验证每行恰好 2 枚（偶数 > 0）
        for r in range(n):
            assert sum(board[r]) == 2

        # 验证每列奇数枚（前半区 3 枚，后半区 1 枚）
        k = n // 2
        for c in range(k):
            col_sum = sum(board[r][c] for r in range(n))
            assert col_sum == 3
        for c in range(k, n):
            col_sum = sum(board[r][c] for r in range(n))
            assert col_sum == 1


def test_solver_no_solution_below_min():
    """测试 4x4 棋盘在棋子数少于 8 枚时无解"""
    # 针对 4x4，最小为 8。搜索 target_count = 6
    sol_6 = solve_parity_puzzle(4, target_count=6)
    assert sol_6 is None

    # 针对 4x4，target_count = 8 有解
    sol_8 = solve_parity_puzzle(4, target_count=8)
    assert sol_8 is not None
    assert validate_board(sol_8)["is_valid"] is True


def test_hint_functionality():
    """测试提示算法的建议精准度"""
    board = [[0] * 6 for _ in range(6)]
    hint_add = find_hint(board)
    assert hint_add is not None
    assert hint_add["action"] == "add"

    # 完全解的提示应为已完成
    optimal = construct_optimal_solution(6)
    hint_done = find_hint(optimal)
    assert hint_done["action"] == "complete"

    # 额外放置干扰棋子的提示应为移除
    bad_board = [row[:] for row in optimal]
    # 在非最优解位置放一枚
    for r in range(6):
        for c in range(6):
            if bad_board[r][c] == 0:
                bad_board[r][c] = 1
                break
        else:
            continue
        break

    hint_remove = find_hint(bad_board)
    assert hint_remove is not None
    assert hint_remove["action"] == "remove"
