# codex: 2026-09-22 实现青蛙跳跃数学建模、合法走法判定与BFS最优解求解器
"""
青蛙跳跃数学模型与求解器 (jumpfrog_math.py)
对应 boardgame/jumpfrog 题图：
6只白蛙与黑蛙（3白3黑）加左侧空格，在20步内将白蛙与黑蛙位置互换。
支持扩展蛙数（1v1~5v5）、任意空格初始位置、双向自由移动与单向进阶模式。
"""

from collections import deque
from typing import List, Tuple, Optional, Dict, Any

EMPTY = "_"
WHITE = "W"
BLACK = "B"


def create_initial_state(num_white: int = 3, num_black: int = 3, empty_pos: str = "left") -> Tuple[str, ...]:
    """生成初始棋盘状态。"""
    whites = [WHITE] * num_white
    blacks = [BLACK] * num_black
    if empty_pos == "left":
        return tuple([EMPTY] + whites + blacks)
    elif empty_pos == "center":
        return tuple(whites + [EMPTY] + blacks)
    elif empty_pos == "right":
        return tuple(whites + blacks + [EMPTY])
    else:
        raise ValueError(f"未知的空格位置: {empty_pos}")


def create_target_state(num_white: int = 3, num_black: int = 3, empty_pos: str = "left") -> Tuple[str, ...]:
    """生成目标棋盘状态（白蛙与黑蛙完全对调，空格仍在原位）。"""
    whites = [WHITE] * num_white
    blacks = [BLACK] * num_black
    if empty_pos == "left":
        return tuple([EMPTY] + blacks + whites)
    elif empty_pos == "center":
        return tuple(blacks + [EMPTY] + whites)
    elif empty_pos == "right":
        return tuple(blacks + whites + [EMPTY])
    else:
        raise ValueError(f"未知的空格位置: {empty_pos}")


def get_valid_moves(state: Tuple[str, ...], allow_backward: bool = True) -> List[Tuple[int, int, str]]:
    """
    获取当前状态下所有合法移动。
    返回列表: [(from_idx, to_idx, move_type), ...]
    move_type 为 'slide' (平移1格) 或 'jump' (越过1只青蛙跳入空格)。
    """
    moves = []
    if EMPTY not in state:
        return moves
    empty_idx = state.index(EMPTY)

    # 候选位置：距离空格 -2, -1, 1, 2
    for offset in [-2, -1, 1, 2]:
        frog_idx = empty_idx + offset
        if 0 <= frog_idx < len(state):
            frog = state[frog_idx]
            if frog == EMPTY:
                continue

            # 单向模式限制：白蛙只能向右移(frog_idx < empty_idx)，黑蛙只能向左移(frog_idx > empty_idx)
            if not allow_backward:
                if frog == WHITE and frog_idx > empty_idx:
                    continue
                if frog == BLACK and frog_idx < empty_idx:
                    continue

            move_type = "slide" if abs(offset) == 1 else "jump"
            moves.append((frog_idx, empty_idx, move_type))
    return moves


def is_valid_move(state: Tuple[str, ...], from_idx: int, to_idx: int, allow_backward: bool = True) -> bool:
    """判定某一步移动是否合法。"""
    if not (0 <= from_idx < len(state) and 0 <= to_idx < len(state)):
        return False
    if state[from_idx] == EMPTY or state[to_idx] != EMPTY:
        return False
    dist = abs(from_idx - to_idx)
    if dist not in (1, 2):
        return False
    if not allow_backward:
        frog = state[from_idx]
        if frog == WHITE and from_idx > to_idx:
            return False
        if frog == BLACK and from_idx < to_idx:
            return False
    return True


def apply_move(state: Tuple[str, ...], from_idx: int, to_idx: int) -> Tuple[str, ...]:
    """执行一步移动并返回新状态。"""
    lst = list(state)
    lst[to_idx], lst[from_idx] = lst[from_idx], lst[to_idx]
    return tuple(lst)


def solve_bfs(
    initial_state: Tuple[str, ...],
    target_state: Tuple[str, ...],
    allow_backward: bool = True,
    max_states: int = 50000,
) -> Optional[List[Tuple[str, ...]]]:
    """
    使用广度优先搜索 (BFS) 计算从 initial_state 到 target_state 的全局最短路径。
    返回状态序列列表 [state_0, state_1, ..., state_target]，无解返回 None。
    """
    if initial_state == target_state:
        return [initial_state]

    queue = deque([initial_state])
    parent: Dict[Tuple[str, ...], Optional[Tuple[str, ...]]] = {initial_state: None}

    while queue and len(parent) < max_states:
        curr = queue.popleft()
        if curr == target_state:
            # 重建路径
            path = []
            node = curr
            while node is not None:
                path.append(node)
                node = parent[node]
            path.reverse()
            return path

        for from_idx, to_idx, _ in get_valid_moves(curr, allow_backward):
            nxt = apply_move(curr, from_idx, to_idx)
            if nxt not in parent:
                parent[nxt] = curr
                queue.append(nxt)

    return None


def get_hint(
    current_state: Tuple[str, ...],
    target_state: Tuple[str, ...],
    allow_backward: bool = True,
) -> Optional[Dict[str, Any]]:
    """
    从当前状态计算到达目标的下一步建议及剩余步数。
    """
    path = solve_bfs(current_state, target_state, allow_backward)
    if not path or len(path) < 2:
        return None
    next_state = path[1]
    # 找到移动的索引
    empty_cur = current_state.index(EMPTY)
    empty_nxt = next_state.index(EMPTY)
    from_idx = empty_nxt
    to_idx = empty_cur
    move_type = "slide" if abs(from_idx - to_idx) == 1 else "jump"
    explanation = explain_move(current_state, from_idx, to_idx)
    return {
        "from_idx": from_idx,
        "to_idx": to_idx,
        "move_type": move_type,
        "remaining_steps": len(path) - 1,
        "explanation": explanation,
    }


def explain_move(state: Tuple[str, ...], from_idx: int, to_idx: int) -> str:
    """生成通俗生动的教学步骤解析。"""
    frog = state[from_idx]
    frog_name = "白蛙" if frog == WHITE else "黑蛙"
    direction = "向右" if to_idx > from_idx else "向左"
    dist = abs(to_idx - from_idx)
    if dist == 1:
        return f"{frog_name}从第{from_idx+1}格{direction}滑入相邻空格，调整队形"
    else:
        jumped_idx = (from_idx + to_idx) // 2
        jumped_frog = "白蛙" if state[jumped_idx] == WHITE else "黑蛙"
        return f"{frog_name}从第{from_idx+1}格{direction}飞跃第{jumped_idx+1}格的{jumped_frog}跳入空格，形成交替换位！"


def evaluate_score(steps: int, optimal_steps: int, limit_steps: int = 20) -> Dict[str, Any]:
    """根据步数计算星级评价与夸奖评语。"""
    if steps <= optimal_steps:
        stars = 3
        badge = "荷塘跃迁大师 🏆"
        cheer = "叹为观止！你以理论极限最少步数完成了挑战，思维缜密！"
    elif steps <= limit_steps:
        stars = 2
        badge = "机智跳跃家 ⭐⭐"
        cheer = "太棒了！完全在20步限定规则内通关，身手不凡！"
    else:
        stars = 1
        badge = "顽强探索者 ⭐"
        cheer = "恭喜完成！坚持就是胜利，尝试挑战更少步数吧！"
    return {"stars": stars, "badge": badge, "cheer": cheer}
