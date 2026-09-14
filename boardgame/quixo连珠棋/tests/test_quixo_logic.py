# codex: 2026-09-14 编写Quixo核心对弈与胜负规则pytest测试套件
"""
Quixo 战棋核心规则与逻辑的单元测试集
覆盖：边缘外围判定、取子合法性、推入方向与滑动移位、五连胜负与自杀反杀规则
"""
import pytest

BLANK = 0
CIRCLE = 1
CROSS = 2

DIR_UP = 'up'
DIR_DOWN = 'down'
DIR_LEFT = 'left'
DIR_RIGHT = 'right'

class QuixoLogic:
    """Python 版 Quixo 规则引擎参考实现，与前端 JS 规则严格一一对齐"""
    def __init__(self, size=5):
        self.size = size

    def is_edge(self, row, col):
        return row == 0 or row == self.size - 1 or col == 0 or col == self.size - 1

    def is_corner(self, row, col):
        return (row == 0 or row == self.size - 1) and (col == 0 or col == self.size - 1)

    def can_pick(self, board, row, col, current_player):
        if not self.is_edge(row, col):
            return False
        cell = board[row][col]
        return cell == BLANK or cell == current_player

    def get_push_directions(self, row, col):
        directions = []
        last = self.size - 1
        if row != 0:
            directions.append(DIR_DOWN)
        if row != last:
            directions.append(DIR_UP)
        if col != 0:
            directions.append(DIR_RIGHT)
        if col != last:
            directions.append(DIR_LEFT)
        return directions

    def apply_move(self, board, row, col, direction, player):
        board = [r[:] for r in board]
        last = self.size - 1

        if direction == DIR_DOWN:
            for r in range(row, 0, -1):
                board[r][col] = board[r - 1][col]
            board[0][col] = player
        elif direction == DIR_UP:
            for r in range(row, last):
                board[r][col] = board[r + 1][col]
            board[last][col] = player
        elif direction == DIR_RIGHT:
            for c in range(col, 0, -1):
                board[row][c] = board[row][c - 1]
            board[row][0] = player
        elif direction == DIR_LEFT:
            for c in range(col, last):
                board[row][c] = board[row][c + 1]
            board[row][last] = player
        return board

    def check_five_in_row(self, board, player):
        n = self.size
        # 行
        for r in range(n):
            if all(board[r][c] == player for c in range(n)):
                return True
        # 列
        for c in range(n):
            if all(board[r][c] == player for r in range(n)):
                return True
        # 主对角线
        if all(board[i][i] == player for i in range(n)):
            return True
        # 副对角线
        if all(board[i][n - 1 - i] == player for i in range(n)):
            return True
        return False

    def check_winner(self, board, acting_player):
        opp = CROSS if acting_player == CIRCLE else CIRCLE
        acting_win = self.check_five_in_row(board, acting_player)
        opp_win = self.check_five_in_row(board, opp)

        # 自杀规则：对手达成5连（即便行动方也达成），行动方直接判负（对手胜）
        if opp_win:
            return opp
        if acting_win:
            return acting_player
        return None


@pytest.fixture
def logic():
    return QuixoLogic(5)

@pytest.fixture
def empty_board():
    return [[BLANK] * 5 for _ in range(5)]


def test_edge_and_inner_counts(logic):
    """验证 5x5 棋盘外围恰好 16 格，内部恰好 9 格，4 个角"""
    edge_count = 0
    inner_count = 0
    corner_count = 0

    for r in range(5):
        for c in range(5):
            if logic.is_edge(r, c):
                edge_count += 1
            else:
                inner_count += 1
            if logic.is_corner(r, c):
                corner_count += 1

    assert edge_count == 16, "外圈边缘应恰好为 16 格"
    assert inner_count == 9, "内圈应恰好为 9 格 (3x3)"
    assert corner_count == 4, "角位应恰好为 4 个"


def test_pick_rules(logic, empty_board):
    """测试取子规则：内圈不可取，外圈只能取空白或己方，严禁抽取对方棋子"""
    # 初始全为空白，外圈皆可取，内圈不可取
    assert logic.can_pick(empty_board, 0, 0, CIRCLE) is True
    assert logic.can_pick(empty_board, 0, 2, CIRCLE) is True
    assert logic.can_pick(empty_board, 2, 2, CIRCLE) is False  # 内部中心点
    assert logic.can_pick(empty_board, 1, 1, CIRCLE) is False  # 内部点

    # 放置对手棋子在边缘 (0, 1)
    empty_board[0][1] = CROSS
    # 放置己方棋子在边缘 (0, 3)
    empty_board[0][3] = CIRCLE

    # CIRCLE 玩家测试
    assert logic.can_pick(empty_board, 0, 1, CIRCLE) is False, "严禁抽取对手棋子"
    assert logic.can_pick(empty_board, 0, 3, CIRCLE) is True, "可以抽取己方棋子"


def test_push_directions(logic):
    """测试推入方向：角位 2 种，边位 3 种，严禁原位放回"""
    # 左上角 (0, 0): 不能从 (0,0) 放回，只能 UP 或 LEFT
    corner_dirs = logic.get_push_directions(0, 0)
    assert set(corner_dirs) == {DIR_UP, DIR_LEFT}
    assert len(corner_dirs) == 2

    # 右下角 (4, 4): 只能 DOWN 或 RIGHT
    corner_br = logic.get_push_directions(4, 4)
    assert set(corner_br) == {DIR_DOWN, DIR_RIGHT}
    assert len(corner_br) == 2

    # 顶边非四角 (0, 2): 可以 UP, LEFT, RIGHT
    edge_dirs = logic.get_push_directions(0, 2)
    assert set(edge_dirs) == {DIR_UP, DIR_LEFT, DIR_RIGHT}
    assert len(edge_dirs) == 3


def test_slide_movement(logic, empty_board):
    """测试推入滑动位移"""
    # 棋盘第一行放 [B, X, O, X, B]
    empty_board[0] = [BLANK, CROSS, CIRCLE, CROSS, BLANK]

    # CIRCLE 玩家从 (0, 4) 取子，从左向右推入 (DIR_RIGHT)
    # 取出 (0, 4)，整行向右滑动一格，并在 (0, 0) 放入 CIRCLE
    new_board = logic.apply_move(empty_board, 0, 4, DIR_RIGHT, CIRCLE)

    # 预期新第一行为: [CIRCLE(新入), BLANK, CROSS, CIRCLE, CROSS]
    assert new_board[0][0] == CIRCLE
    assert new_board[0][1] == BLANK
    assert new_board[0][2] == CROSS
    assert new_board[0][3] == CIRCLE
    assert new_board[0][4] == CROSS


def test_win_detection_normal(logic, empty_board):
    """测试普通胜利：行、列、对角线 5 连"""
    # 行 5 连
    for c in range(5):
        empty_board[1][c] = CIRCLE
    assert logic.check_winner(empty_board, CIRCLE) == CIRCLE

    # 对角线 5 连
    diag_board = [[BLANK] * 5 for _ in range(5)]
    for i in range(5):
        diag_board[i][i] = CROSS
    assert logic.check_winner(diag_board, CROSS) == CROSS


def test_suicide_rule(logic, empty_board):
    """
    核心规则测试：自杀判负
    如果行动方的推入导致对手达成 5 连，或者双方同时达成 5 连，行动方判负！
    """
    # 设第 0 行全是 CROSS
    for c in range(5):
        empty_board[0][c] = CROSS

    # 行动方是 CIRCLE
    winner = logic.check_winner(empty_board, acting_player=CIRCLE)
    assert winner == CROSS, "行动方使对手达成5连，行动方直接判负，CROSS获胜"

    # 设第 0 行全是 CROSS，同时第 1 行全是 CIRCLE（双五连）
    for c in range(5):
        empty_board[1][c] = CIRCLE

    winner_double = logic.check_winner(empty_board, acting_player=CIRCLE)
    assert winner_double == CROSS, "同时达成5连时，行动方判负，对手CROSS获胜"

    # 若行动方是 CROSS 且出现双五连
    winner_cross_acting = logic.check_winner(empty_board, acting_player=CROSS)
    assert winner_cross_acting == CIRCLE, "CROSS行动造成双五连，CROSS判负，CIRCLE获胜"
