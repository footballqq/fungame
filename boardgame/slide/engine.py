# codex: 2026-09-14 实现滑冰棋核心规则引擎，包含六边形立方坐标、19底座生成、滑冰移动、连通性检查与铁三角胜利判定
"""
滑冰棋 (Ice Sliding Chess) 核心规则引擎
包含：
1. 六边形立方坐标系统 (Cube Coordinates: q, r, s where q + r + s == 0)
2. 初始棋盘 (19个底座，半径2) 与 初始棋子分布 (外圈6个顶点交替摆放)
3. 滑冰机制 (沿直线滑动至边缘或障碍物前停下，不能中途自愿刹车)
4. 搬移底座机制 (拿掉最外圈无棋子空底座，保证剩余18底座连通，拼入拥有>=2个邻居的新位置)
5. 胜利条件 (行动结束后己方3枚棋子全部两两相邻/铁三角)
"""

from typing import List, Tuple, Set, Optional, Dict
from dataclasses import dataclass, field
import collections

# 六边形 6 个直线方向的立方坐标偏移量
HEX_DIRECTIONS: List[Tuple[int, int, int]] = [
    (+1, -1, 0),
    (+1, 0, -1),
    (0, +1, -1),
    (-1, +1, 0),
    (-1, 0, +1),
    (0, -1, +1),
]

# 玩家常量
PLAYER_RED = 1    # 先手 红方 / 冰蓝
PLAYER_BLUE = 2   # 后手 蓝方 / 炽红


@dataclass(frozen=True)
class HexCoord:
    """六边形立方坐标 (q, r, s)，满足 q + r + s == 0"""
    q: int
    r: int
    s: int

    def __post_init__(self):
        if self.q + self.r + self.s != 0:
            raise ValueError(f"Invalid HexCoord: {self.q} + {self.r} + {self.s} != 0")

    def add(self, direction: Tuple[int, int, int]) -> 'HexCoord':
        return HexCoord(self.q + direction[0], self.r + direction[1], self.s + direction[2])

    def distance_to(self, other: 'HexCoord') -> int:
        return (abs(self.q - other.q) + abs(self.r - other.r) + abs(self.s - other.s)) // 2

    def is_adjacent(self, other: 'HexCoord') -> bool:
        return self.distance_to(other) == 1

    def neighbors(self) -> List['HexCoord']:
        return [self.add(d) for d in HEX_DIRECTIONS]

    def to_tuple(self) -> Tuple[int, int, int]:
        return (self.q, self.r, self.s)


def get_initial_tiles() -> Set[HexCoord]:
    """生成半径为 2 的大六角形棋盘（19个底座：中心1个，扩展两圈 1+6+12=19）"""
    tiles: Set[HexCoord] = set()
    radius = 2
    for q in range(-radius, radius + 1):
        r1 = max(-radius, -q - radius)
        r2 = min(radius, -q + radius)
        for r in range(r1, r2 + 1):
            s = -q - r
            tiles.add(HexCoord(q, r, s))
    return tiles


def get_initial_pieces() -> Dict[int, List[HexCoord]]:
    """
    初始配置：双方各执 3 枚棋子，间隔摆放在最外圈的 6 个角/边缘顶点上。
    在半径2的外圈中，6个角顶点按顺时针/环形顺序为：
    Corner 0: (0, -2, 2)
    Corner 1: (2, -2, 0)
    Corner 2: (2, 0, -2)
    Corner 3: (0, 2, -2)
    Corner 4: (-2, 2, 0)
    Corner 5: (-2, 0, 2)
    红方执 0, 2, 4；蓝方执 1, 3, 5。
    """
    corners = [
        HexCoord(0, -2, 2),
        HexCoord(2, -2, 0),
        HexCoord(2, 0, -2),
        HexCoord(0, 2, -2),
        HexCoord(-2, 2, 0),
        HexCoord(-2, 0, 2),
    ]
    return {
        PLAYER_RED: [corners[0], corners[2], corners[4]],
        PLAYER_BLUE: [corners[1], corners[3], corners[5]],
    }


def is_connected(tiles: Set[HexCoord]) -> bool:
    """检查给定的底座集合是否连通"""
    if not tiles:
        return True
    start = next(iter(tiles))
    visited = {start}
    queue = collections.deque([start])
    while queue:
        curr = queue.popleft()
        for neighbor in curr.neighbors():
            if neighbor in tiles and neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return len(visited) == len(tiles)


@dataclass
class SlideMove:
    """滑冰移动：从 from_coord 沿 direction 方向滑行到 to_coord"""
    from_coord: HexCoord
    to_coord: HexCoord
    direction_index: int


@dataclass
class TileMove:
    """搬移底座：将 from_tile 移除，并拼入新位置 to_tile"""
    from_tile: HexCoord
    to_tile: HexCoord


@dataclass
class TurnAction:
    """一个完整回合的行动：先滑冰，后搬移底座"""
    slide_move: SlideMove
    tile_move: TileMove


class IceSkatingGame:
    """滑冰棋游戏状态与核心逻辑"""

    def __init__(self, tiles: Optional[Set[HexCoord]] = None,
                 pieces: Optional[Dict[int, List[HexCoord]]] = None,
                 current_player: int = PLAYER_RED,
                 strict_triangle_only: bool = True):
        self.tiles: Set[HexCoord] = set(tiles) if tiles is not None else get_initial_tiles()
        if pieces is not None:
            self.pieces: Dict[int, List[HexCoord]] = {
                PLAYER_RED: list(pieces[PLAYER_RED]),
                PLAYER_BLUE: list(pieces[PLAYER_BLUE])
            }
        else:
            self.pieces = get_initial_pieces()
        self.current_player: int = current_player
        self.strict_triangle_only: bool = strict_triangle_only
        self.winner: Optional[int] = None
        self.step_in_turn: int = 1  # 1: 正在等待移动棋子, 2: 正在等待搬移底座
        self.pending_slide: Optional[SlideMove] = None

    def get_all_occupied_coords(self) -> Set[HexCoord]:
        """获取所有有棋子停留的坐标"""
        return set(self.pieces[PLAYER_RED]) | set(self.pieces[PLAYER_BLUE])

    def get_piece_at(self, coord: HexCoord) -> Optional[int]:
        """查询指定坐标的棋子归属 (None, PLAYER_RED, PLAYER_BLUE)"""
        if coord in self.pieces[PLAYER_RED]:
            return PLAYER_RED
        if coord in self.pieces[PLAYER_BLUE]:
            return PLAYER_BLUE
        return None

    def calculate_slide_destination(self, start: HexCoord, direction_idx: int) -> Optional[HexCoord]:
        """
        计算从 start 沿 HEX_DIRECTIONS[direction_idx] 滑行后的最终着陆点。
        规则：
        - 沿直线滑行，直到碰到底座边缘（下一个格子无底座）或碰到其他棋子停下。
        - 不能中途自愿刹车。
        - 必须能移动至少 1 格才算合法滑动；如果一开始就受阻，返回 None。
        """
        direction = HEX_DIRECTIONS[direction_idx]
        occupied = self.get_all_occupied_coords()

        curr = start
        steps = 0

        while True:
            nxt = curr.add(direction)
            # 下一个格子是否有底座且无棋子阻挡？
            if nxt not in self.tiles or nxt in occupied:
                # 碰到边缘或障碍物，停在当前格 curr
                break
            curr = nxt
            steps += 1

        if steps > 0:
            return curr
        return None

    def get_valid_slides_for_piece(self, piece_coord: HexCoord) -> List[SlideMove]:
        """获取指定棋子的所有合法滑行移动"""
        valid_slides = []
        for d_idx in range(len(HEX_DIRECTIONS)):
            dest = self.calculate_slide_destination(piece_coord, d_idx)
            if dest is not None and dest != piece_coord:
                valid_slides.append(SlideMove(from_coord=piece_coord, to_coord=dest, direction_index=d_idx))
        return valid_slides

    def get_all_valid_slides(self, player: Optional[int] = None) -> List[SlideMove]:
        """获取当前玩家所有可用的滑行移动"""
        p = player if player is not None else self.current_player
        slides = []
        for piece in self.pieces[p]:
            slides.extend(self.get_valid_slides_for_piece(piece))
        return slides

    def apply_slide(self, slide: SlideMove) -> None:
        """执行滑行移动，进入回合第二步（搬移底座）"""
        if self.step_in_turn != 1:
            raise ValueError("当前不是移动棋子阶段")
        p = self.current_player
        if slide.from_coord not in self.pieces[p]:
            raise ValueError(f"坐标 {slide.from_coord} 上不是当前玩家的棋子")

        # 更新棋子位置
        idx = self.pieces[p].index(slide.from_coord)
        self.pieces[p][idx] = slide.to_coord
        self.pending_slide = slide
        self.step_in_turn = 2

    def get_removable_tiles(self) -> List[HexCoord]:
        """
        获取当前可以拿掉的底座列表。
        规则：
        1. 没有棋子停留的空底座
        2. 位于最外圈（在当前棋盘中邻居数 < 6）
        3. 拿掉该底座后，剩余 18 个底座仍然连通（非割点）
        """
        occupied = self.get_all_occupied_coords()
        removable = []

        for tile in self.tiles:
            # 1. 不能有棋子
            if tile in occupied:
                continue

            # 2. 位于最外圈（即在棋盘内邻居数 < 6，有露在外面的边）
            current_neighbors_count = sum(1 for n in tile.neighbors() if n in self.tiles)
            if current_neighbors_count == 6:
                # 内部完全被包围的底座不可作为最外圈拿掉
                continue

            # 3. 拿掉后剩余底座仍连通
            remaining = self.tiles - {tile}
            if is_connected(remaining):
                removable.append(tile)

        return removable

    def get_valid_placements(self, removed_tile: HexCoord) -> List[HexCoord]:
        """
        当移走 removed_tile 后，计算该底座可以拼入的新位置列表。
        规则：
        1. 新位置不能是现有 18 个底座之一
        2. 新位置至少与现有的 2 个底座边相邻 (neighbor count >= 2)
        3. 新位置不能与原位置完全相同 (必须是改变棋盘的有效移动)
        """
        remaining = self.tiles - {removed_tile}
        candidates: Set[HexCoord] = set()

        for t in remaining:
            for n in t.neighbors():
                if n not in remaining and n != removed_tile:
                    candidates.add(n)

        valid_placements = []
        for cand in candidates:
            # 检查与 remaining 的相邻边数是否 >= 2
            adj_count = sum(1 for n in cand.neighbors() if n in remaining)
            if adj_count >= 2:
                valid_placements.append(cand)

        return valid_placements

    def apply_tile_move(self, tile_move: TileMove) -> None:
        """执行搬移底座移动，完成回合，并检查胜负"""
        if self.step_in_turn != 2:
            raise ValueError("当前不是搬移底座阶段")

        if tile_move.from_tile not in self.tiles:
            raise ValueError("被搬移的底座不存在于棋盘中")

        removables = self.get_removable_tiles()
        if tile_move.from_tile not in removables:
            raise ValueError("所选底座不可移除（有棋子、非最外圈或移除后不连通）")

        valid_placements = self.get_valid_placements(tile_move.from_tile)
        if tile_move.to_tile not in valid_placements:
            raise ValueError("目标放置位置不合法（相邻底座不足2个或已被占用）")

        # 更新棋盘底座
        self.tiles.remove(tile_move.from_tile)
        self.tiles.add(tile_move.to_tile)

        # 检查当前行动结束后的胜利条件
        self.check_win_condition()

        # 切换回合
        self.step_in_turn = 1
        self.pending_slide = None
        self.current_player = PLAYER_BLUE if self.current_player == PLAYER_RED else PLAYER_RED

    def check_player_triangle(self, player: int) -> bool:
        """
        检查指定玩家的 3 枚棋子是否全部彼此相邻（铁三角）。
        若 strict_triangle_only 为 True，要求 3 枚棋子两两相邻：
          d(P1, P2) == 1, d(P2, P3) == 1, d(P3, P1) == 1
        若为 False，允许任意连通三连（包括铁三角、三子连线或折角）。
        """
        pieces = self.pieces[player]
        if len(pieces) != 3:
            return False

        p0, p1, p2 = pieces[0], pieces[1], pieces[2]
        d01 = p0.distance_to(p1) == 1
        d12 = p1.distance_to(p2) == 1
        d20 = p2.distance_to(p0) == 1

        if self.strict_triangle_only:
            return d01 and d12 and d20
        else:
            # 连通即可：任意两个相邻对形成连通块（3个顶点在无向图里连通）
            adj_count = (1 if d01 else 0) + (1 if d12 else 0) + (1 if d20 else 0)
            return adj_count >= 2

    def check_win_condition(self) -> Optional[int]:
        """
        当某位玩家行动结束后，己方的 3 枚棋子全部彼此相邻（组成连通块/铁三角），即判定获胜。
        """
        p = self.current_player
        opp = PLAYER_BLUE if p == PLAYER_RED else PLAYER_RED

        p_won = self.check_player_triangle(p)
        opp_won = self.check_player_triangle(opp)

        if p_won:
            self.winner = p
            return p
        elif opp_won:
            self.winner = opp
            return opp

        return None
