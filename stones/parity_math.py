# codex: 2026-09-09 实现 6x6 奇偶棋盘谜题数学推导、理论极小值计算、确定性构造与求解器
"""
奇偶棋子谜题核心数学与求解模块 (Parity Chess Puzzle Solver & Math)
原题描述：
在 N×N 棋盘（原题 N=6）中放入棋子（每格最多1枚）：
- 每行都有偶数（>0）枚棋子；
- 每列都有奇数枚棋子；
求最少放入多少枚棋子，并给出构造方案。

数学定理：
1. 若 N 为奇数：无解。因为行总和为偶数之和（必为偶数），列总和为奇数个奇数之和（必为奇数），二者必相等矛盾。
2. 若 N 为偶数：
   - 每行偶数 > 0，则每行至少 2 枚棋子，总棋子数 >= 2N。
   - 当总棋子数 = 2N 时，每行恰好 2 枚；列和必须为正奇数（1, 3, ...）。
   - 可构造 N/2 个列包含 3 枚棋子，N/2 个列包含 1 枚棋子，列和总数为 (N/2)*3 + (N/2)*1 = 2N。
   - 由 Gale-Ryser 定理或显式对称分配法，该配置始终存在二值矩阵解。
   - 故最少棋子数严格为 2N（当 N=6 时为 12 枚）。
"""
from typing import List, Tuple, Dict, Optional


def compute_theoretical_min_pieces(n: int) -> int:
    """
    计算 N×N 棋盘满足条件的理论最小棋子数。
    若 N 为奇数，返回 -1（表示无解）。
    若 N 为偶数且 >= 2，返回 2 * n。
    """
    if n <= 0:
        raise ValueError("棋盘尺寸 n 必须为正整数")
    if n % 2 != 0:
        return -1
    return 2 * n


def validate_board(board: List[List[int]]) -> Dict[str, any]:
    """
    验证棋盘是否满足所有规则。
    board: n x n 二维数组，0 表示空格，1 表示棋子
    """
    n = len(board)
    if n == 0 or any(len(row) != n for row in board):
        raise ValueError("输入棋盘必须为合法的方形网格")

    row_counts = [sum(row) for row in board]
    col_counts = [sum(board[r][c] for r in range(n)) for c in range(n)]

    # 行条件：偶数且 > 0
    row_valid = [cnt > 0 and cnt % 2 == 0 for cnt in row_counts]
    # 列条件：奇数且 > 0
    col_valid = [cnt > 0 and cnt % 2 != 0 for cnt in col_counts]

    total_pieces = sum(row_counts)
    is_valid = all(row_valid) and all(col_valid)
    min_pieces = compute_theoretical_min_pieces(n)
    is_optimal = is_valid and (total_pieces == min_pieces)

    return {
        "is_valid": is_valid,
        "is_optimal": is_optimal,
        "total_pieces": total_pieces,
        "min_pieces": min_pieces,
        "row_counts": row_counts,
        "col_counts": col_counts,
        "row_valid": row_valid,
        "col_valid": col_valid,
        "all_rows_valid": all(row_valid),
        "all_cols_valid": all(col_valid),
    }


def construct_optimal_solution(n: int) -> List[List[int]]:
    """
    显式构造任意偶数 n (n >= 4) 的 2n 枚棋子最优解。
    构造逻辑：
    - 前 k = n // 2 列，每列 3 枚棋子
    - 后 k = n // 2 列，每列 1 枚棋子
    - 每行恰好 2 枚棋子
    对于 6x6 (k=3):
      第 0~2 列各 3 枚，第 3~5 列各 1 枚。
      行 0: 列 0, 1
      行 1: 列 0, 2
      行 2: 列 1, 2
      (此时前 3 列各有 2 枚)
      行 3: 列 0, 3 (列0达到3枚，列3有1枚)
      行 4: 列 1, 4 (列1达到3枚，列4有1枚)
      行 5: 列 2, 5 (列2达到3枚，列5有1枚)
    一般化推广：
      对于偶数 n >= 4，令 k = n // 2。
      前 k 行由前 k 列中的一对列填充（形成环形覆盖，每列 2 枚）：
        行 r (0 <= r < k): 放置在列 r 与列 (r+1)%k
        此时前 k 列每列恰有 2 枚，每行 2 枚。
      后 k 行 (k <= r < n):
        行 r (设 i = r - k, 0 <= i < k): 放置在列 i 与列 (k + i)
        此时列 i 达到 2+1=3 枚（奇数），列 k+i 获得 1 枚（奇数）。
      总计：前 k 列各 3 枚（奇数），后 k 列各 1 枚（奇数），共 2n 枚，每行 2 枚（偶数>0）。
    """
    if n % 2 != 0 or n < 2:
        raise ValueError("构造算法仅支持偶数阶棋盘 n >= 2")
    if n == 2:
        # 2x2 无法同时满足每行2枚且每列奇数(1枚)，因为总数4枚，列和必为2(偶数)
        # 验证: n=2, sum=4, 2列，若每列奇数则只能是1+3(超界)或1+1(sum=2!=4)，故n=2无解
        raise ValueError("2x2 棋盘无解（列和无法全为奇数）")

    board = [[0] * n for _ in range(n)]
    k = n // 2

    # 前 k 行：在 [0, k) 列中交替放 2 枚，使得前 k 列每列恰好有 2 枚
    for r in range(k):
        c1 = r
        c2 = (r + 1) % k
        board[r][c1] = 1
        board[r][c2] = 1

    # 后 k 行：行 r 连结前半区的一列与后半区对应列
    for i in range(k):
        r = k + i
        c1 = i
        c2 = k + i
        board[r][c1] = 1
        board[r][c2] = 1

    return board


def solve_parity_puzzle(
    n: int, target_count: Optional[int] = None
) -> Optional[List[List[int]]]:
    """
    使用回溯/约束传播求解 N×N 奇偶棋盘问题。
    若指定 target_count，则仅搜索棋子总数等于 target_count 的解；
    若未指定，则直接返回最小可能棋子数的解。
    """
    if n % 2 != 0 or n < 4:
        return None

    min_needed = compute_theoretical_min_pieces(n)
    if target_count is not None and target_count < min_needed:
        return None

    if target_count is None or target_count == min_needed:
        # 直接使用确定性最优构造
        return construct_optimal_solution(n)

    # 对于其他指定目标棋子数，使用回溯搜索
    board = [[0] * n for _ in range(n)]
    row_counts = [0] * n
    col_counts = [0] * n

    found = []

    def backtrack(r: int, c: int, pieces_left: int):
        if found:
            return
        if r == n:
            if pieces_left == 0 and all(cnt % 2 != 0 for cnt in col_counts):
                found.append([row[:] for row in board])
            return

        next_r = r if c + 1 < n else r + 1
        next_c = (c + 1) % n

        # 枝剪：若到达行尾，检查当前行是否为偶数 > 0
        if c == n - 1:
            # 尝试当前格放 0
            if row_counts[r] > 0 and row_counts[r] % 2 == 0:
                backtrack(next_r, next_c, pieces_left)
            # 尝试当前格放 1
            if pieces_left > 0 and (row_counts[r] + 1) % 2 == 0:
                board[r][c] = 1
                row_counts[r] += 1
                col_counts[c] += 1
                backtrack(next_r, next_c, pieces_left - 1)
                board[r][c] = 0
                row_counts[r] -= 1
                col_counts[c] -= 1
            return

        # 尝试放 0
        backtrack(next_r, next_c, pieces_left)
        if found:
            return

        # 尝试放 1
        if pieces_left > 0:
            board[r][c] = 1
            row_counts[r] += 1
            col_counts[c] += 1
            backtrack(next_r, next_c, pieces_left - 1)
            board[r][c] = 0
            row_counts[r] -= 1
            col_counts[c] -= 1

    backtrack(0, 0, target_count)
    return found[0] if found else None


def find_hint(board: List[List[int]]) -> Optional[Dict[str, any]]:
    """
    智能提示算法：
    根据当前盘面与最近的最优解进行对比，提示玩家下一步最有价值的操作。
    返回: {"row": r, "col": c, "action": "add"|"remove", "reason": str}
    """
    n = len(board)
    if n % 2 != 0 or n < 4:
        return None

    status = validate_board(board)
    if status["is_optimal"]:
        return {"action": "complete", "message": "当前盘面已是完美最优解！"}

    optimal = construct_optimal_solution(n)

    # 优先提示移除多余的棋子（如果在 optimal 中为 0 但当前为 1）
    for r in range(n):
        for c in range(n):
            if board[r][c] == 1 and optimal[r][c] == 0:
                return {
                    "row": r,
                    "col": c,
                    "action": "remove",
                    "reason": f"移除第 {r+1} 行、第 {c+1} 列的棋子以趋近最优平衡",
                }

    # 其次提示添加缺失的棋子
    for r in range(n):
        for c in range(n):
            if board[r][c] == 0 and optimal[r][c] == 1:
                return {
                    "row": r,
                    "col": c,
                    "action": "add",
                    "reason": f"在第 {r+1} 行、第 {c+1} 列放置棋子以满足该行偶数与该列奇数约束",
                }

    return None
