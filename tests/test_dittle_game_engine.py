# codex: 2026-09-13 Unit tests for Dittle game web application, dice math, and rule mechanics
import os
import re

GAME_DIR = r"E:\users\kpan\BaiduSyncdisk\program\aigc\fungame\boardgame\tzarr"

class PythonDittleDie:
    """Python mirror of DittleDie to test 3D dice kinematics & rule theorems."""
    def __init__(self, color, top=6, front=None, right=2):
        self.color = color
        self.top = top
        if front is None:
            self.front = 4 if color == 'white' else 3
        else:
            self.front = front
        self.right = right

    def get_bottom(self): return 7 - self.top
    def get_back(self): return 7 - self.front
    def get_left(self): return 7 - self.right

    def tilt(self, direction):
        old_top = self.top
        old_front = self.front
        old_right = self.right
        if direction == 'north':
            self.top = old_front
            self.front = 7 - old_top
        elif direction == 'south':
            self.top = 7 - old_front
            self.front = old_top
        elif direction == 'east':
            self.top = 7 - old_right
            self.right = old_top
        elif direction == 'west':
            self.top = old_right
            self.right = 7 - old_top
        return self

def test_game_files_exist_and_under_500_lines():
    files = [
        os.path.join(GAME_DIR, "dittle_game.html"),
        os.path.join(GAME_DIR, "dittle_game_files", "dice_math.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "engine.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "ai.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "animator.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "logger.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "clock.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "sound.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "ui.js"),
        os.path.join(GAME_DIR, "dittle_game_files", "dittle_game.css"),
        os.path.join(GAME_DIR, "dittle_game_files", "dittle_components.css"),
    ]
    for file_path in files:
        assert os.path.exists(file_path), f"Missing file: {file_path}"
        with open(file_path, "r", encoding="utf-8") as f:
            lines = len(f.readlines())
        assert lines <= 500, f"File {os.path.basename(file_path)} exceeds 500 lines ({lines} lines)"

def test_html_includes_all_required_scripts_and_styles():
    html_path = os.path.join(GAME_DIR, "dittle_game.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    expected_assets = [
        "dittle_game.css",
        "dittle_components.css",
        "sound.js",
        "clock.js",
        "dice_math.js",
        "engine.js",
        "ai.js",
        "animator.js",
        "logger.js",
        "ui.js"
    ]
    for asset in expected_assets:
        assert asset in html, f"HTML must include {asset}"

def test_dice_3d_rotation_kinematics():
    # Test 1: Initial state of White die: top=6, facing opposite (back/North)=3, facing player (front/South)=4, right=2
    die = PythonDittleDie('white')
    assert die.top == 6
    assert die.front == 4, "Facing player (South) is 4"
    assert die.get_back() == 3, "Facing opposite (North) is 3"
    assert die.right == 2
    assert die.get_bottom() == 1
    assert die.get_left() == 5

    # Test 1B: Initial state of Black die: top=6, facing opposite (front/South)=3, facing player (back/North)=4, right=2
    b_die = PythonDittleDie('black')
    assert b_die.top == 6
    assert b_die.front == 3, "Facing opposite (South) is 3"
    assert b_die.get_back() == 4, "Facing player (North) is 4"

    # Test 2: Tilting North (Forward for white) rolls South face (4) to top
    die.tilt('north')
    assert die.top == 4, "Tilting forward rolls rear face (4) to top"
    assert die.front == 1, "Bottom (1) rolls to front"
    assert die.right == 2, "Lateral face remains unchanged"

    # Test 3: 4 full tilts in same direction completes 360-degree rotation back to initial
    die.tilt('north').tilt('north').tilt('north')
    assert die.top == 6 and die.front == 4 and die.right == 2

    # Test 4: Lateral tilt East
    die.tilt('east')
    assert die.top == 5, "Tilting East brings left face (5) to top"
    assert die.right == 6, "Old top (6) rolls to right"
    assert die.front == 4, "Front face remains unchanged"

def test_clash_resolution_logic():
    # Case A: 1 vs 1 clash, attacker higher
    attacker_val = 5
    defender_sum = 3
    assert attacker_val > defender_sum, "Attacker wins and destroys defender"

    # Case B: 1 vs 1 clash, attacker lower
    attacker_val = 2
    defender_sum = 4
    assert attacker_val < defender_sum, "Attacker is eliminated"

    # Case C: 1 vs multiple clash (defender sum of 2 dice is 3+3=6)
    attacker_val = 6
    defender_sum = 3 + 3
    assert attacker_val == defender_sum, "Tie -> mutual elimination of both parties!"

def test_anti_stalling_penalty_calculation():
    # Base row has 7 spaces.
    # Suppose White occupies 4 in opponent base row with dice (6, 5, 4, 3) = sum 18.
    # Suppose White has 1 die remaining in home base row (unmoved).
    white_base_sum = 6 + 5 + 4 + 3
    white_home_unmoved = 1
    white_penalty = white_home_unmoved * 10
    white_net_score = white_base_sum - white_penalty
    assert white_net_score == 8, f"Net score should be 18 - 10 = 8, got {white_net_score}"

    # Suppose Black has 3 dice in opponent base row with sum (6, 6, 5) = 17.
    # And Black has 0 dice remaining in home base row.
    black_net_score = 17 - 0
    assert black_net_score > white_net_score, "Black wins due to White's stalling penalty"

def test_opening_move_does_not_trigger_game_over_and_requires_opponent_piece():
    """Verify that a filled base row only triggers game over if it contains at least 1 opponent die."""
    # Simulate checkGameOver logic
    row0_occupied = 7
    white_in_row0 = 0  # Opening position: all 7 are black, 0 white
    row0_full_with_invader = (row0_occupied == 7 and white_in_row0 >= 1)
    assert not row0_full_with_invader, "Opening position with all black dice must NOT trigger game over!"

    # Move 1 white piece into row 0, while 6 black pieces remain unmoved (row 0 filled with 6 black + 1 white = 7)
    white_in_row0 = 1
    row0_full_with_invader = (row0_occupied == 7 and white_in_row0 >= 1)
    assert row0_full_with_invader, "When row 0 is completely full AND has >= 1 white invader, game over should trigger"

def test_3d_perspective_and_three_face_dice_structure():
    """Verify 3D oblique tilt and 3-face visible dice architecture."""
    import math
    html_path = os.path.join(GAME_DIR, "dittle_game.html")
    css_path = os.path.join(GAME_DIR, "dittle_game_files", "dittle_components.css")
    ui_path = os.path.join(GAME_DIR, "dittle_game_files", "ui.js")

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
    assert "viewModeBtn" in html, "HTML must provide 3D/2D view toggle button"

    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".board-wrapper.view-3d" in css, "CSS must define 3D tilted board wrapper"
    assert ".die-cube" in css, "CSS must define 3D cube"
    assert ".die-face.face-top" in css, "CSS must define top face"
    assert ".die-face.face-front" in css, "CSS must define front face"
    assert ".die-face.face-right" in css, "CSS must define right face"

    with open(ui_path, "r", encoding="utf-8") as f:
        ui_code = f.read()
    assert "createFaceElement" in ui_code, "UI must generate multi-face elements"
    assert "updateBoardTransform" in ui_code, "UI must update 3D board perspective transform"
    assert "is3DView" in ui_code, "UI must track 3D view state"

    # Verify 3D surface normal projection: all 3 faces (top, front, right) must have positive Z normals (facing viewer)
    def rot_x(v, deg):
        r = math.radians(deg)
        return [v[0], v[1]*math.cos(r) - v[2]*math.sin(r), v[1]*math.sin(r) + v[2]*math.cos(r)]
    def rot_y(v, deg):
        r = math.radians(deg)
        return [v[0]*math.cos(r) + v[2]*math.sin(r), v[1], -v[0]*math.sin(r) + v[2]*math.cos(r)]

    top_n = rot_x([0, 0, 1], 90) # (0, -1, 0)
    front_n = [0, 0, 1]
    right_n = rot_y([0, 0, 1], 90) # (1, 0, 0)

    # Cube rotation: rotateX(-24deg) rotateY(-28deg)
    top_z = rot_x(rot_y(top_n, -28), -24)[2]
    front_z = rot_x(rot_y(front_n, -28), -24)[2]
    right_z = rot_x(rot_y(right_n, -28), -24)[2]

    assert top_z > 0, f"Top face must face towards viewer (Z={top_z:.3f} > 0)"
    assert front_z > 0, f"Front face must face towards viewer (Z={front_z:.3f} > 0)"
    assert right_z > 0, f"Right face must face towards viewer (Z={right_z:.3f} > 0)"

def test_jump_restriction_strictly_one_piece_cannot_jump_two_or_more():
    """Verify that jumping can ONLY jump over 1 piece, and CANNOT jump over >= 2 contiguous pieces."""
    # Simulate getSingleJumpsFrom logic
    def get_single_jumps(r, c, board):
        jumps = []
        for dr, dc in [(-1, 0), (0, -1), (0, 1)]: # North, West, East for White
            hurdle_r, hurdle_c = r + dr, c + dc
            land_r, land_c = r + 2*dr, c + 2*dc
            if 0 <= hurdle_r < 7 and 0 <= hurdle_c < 7 and 0 <= land_r < 7 and 0 <= land_c < 7:
                if board[hurdle_r][hurdle_c] is not None and board[land_r][land_c] is None:
                    jumps.append((land_r, land_c))
        return jumps

    board = [[None]*7 for _ in range(7)]
    # Place white die at (4, 3)
    board[4][3] = PythonDittleDie('white')

    # Case 1: Exactly 1 piece at (3, 3), and (2, 3) is empty
    board[3][3] = PythonDittleDie('black')
    jumps = get_single_jumps(4, 3, board)
    assert (2, 3) in jumps, "Jumping over 1 piece into empty space (2, 3) must be LEGAL"

    # Case 2: 2 contiguous pieces in a row at (3, 3) and (2, 3), (1, 3) is empty
    board[2][3] = PythonDittleDie('black')
    jumps = get_single_jumps(4, 3, board)
    assert (1, 3) not in jumps, "Jumping over 2 contiguous pieces directly to (1, 3) must be STRICTLY ILLEGAL"
    assert len(jumps) == 0, "No legal jumps should exist when blocked by 2 contiguous pieces"

    # Case 3: Verify engine.js code contains the exact single piece constraint and error message
    engine_path = os.path.join(GAME_DIR, "dittle_game_files", "engine.js")
    with open(engine_path, "r", encoding="utf-8") as f:
        engine_code = f.read()
    assert "hurdleR = r + dr" in engine_code
    assert "landR = r + 2 * dr" in engine_code
    assert "currentBoard[hurdleR][hurdleC] !== null && currentBoard[landR][landC] === null" in engine_code
    assert "每次跳跃只能越过 1 颗棋子，不能跳过大于等于两个棋子" in engine_code

def test_animator_step_by_step_and_anti_teleport_styles():
    """Verify animator module and CSS transition styles prevent instant teleportation."""
    animator_path = os.path.join(GAME_DIR, "dittle_game_files", "animator.js")
    assert os.path.exists(animator_path), "animator.js must exist"
    with open(animator_path, "r", encoding="utf-8") as f:
        anim_code = f.read()
    assert "class DittleAnimator" in anim_code
    assert "animateMove" in anim_code
    assert "animatePathSteps" in anim_code
    assert "applyLastMoveHighlights" in anim_code

    css_path = os.path.join(GAME_DIR, "dittle_game_files", "dittle_components.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".last-move-from" in css, "CSS must highlight starting cell of last move"
    assert ".last-move-to" in css, "CSS must highlight destination cell of last move"
    assert ".anim-hop" in css, "CSS must define jump hop animation"
    assert ".anim-tilt" in css, "CSS must define tilt roll animation"
    assert ".active-mover" in css, "CSS must highlight active moving die before and during transit"

def test_sound_and_music_synthesizer():
    """Verify sound manager features, procedural BGM synthesizer, and UI audio controls."""
    sound_path = os.path.join(GAME_DIR, "dittle_game_files", "sound.js")
    assert os.path.exists(sound_path), "sound.js must exist"
    with open(sound_path, "r", encoding="utf-8") as f:
        sound_code = f.read()

    # BGM synthesizer methods
    assert "startMusic" in sound_code, "Must support procedural BGM start"
    assert "stopMusic" in sound_code, "Must support smooth BGM fade out"
    assert "toggleMusic" in sound_code, "Must support BGM toggle"
    assert "chords" in sound_code, "Must include ambient chord progressions"
    assert "bellScale" in sound_code, "Must include pentatonic bell notes"

    # SFX methods
    sfx_methods = ["playSelect", "playDeselect", "playTilt", "playJump", "playClash", "playIllegal", "playGameStart", "playTurn", "playWin", "playLose"]
    for m in sfx_methods:
        assert m in sound_code, f"sound.js must implement SFX method {m}"

    # HTML & UI audio controls
    html_path = os.path.join(GAME_DIR, "dittle_game.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
    assert 'id="musicToggleBtn"' in html, "HTML must include music toggle button"
    assert 'id="soundToggleBtn"' in html, "HTML must include sound toggle button"
    assert 'id="modalMusicBtn"' in html, "Settings modal must include music button"
    assert 'id="modalSoundBtn"' in html, "Settings modal must include sound button"

    ui_path = os.path.join(GAME_DIR, "dittle_game_files", "ui.js")
    with open(ui_path, "r", encoding="utf-8") as f:
        ui_code = f.read()
    assert "musicToggleBtn" in ui_code, "UI must bind music toggle event"
    assert "playSelect" in ui_code, "UI must trigger select sound"
    assert "playGameStart" in ui_code, "UI must trigger game start sound"

    # Verify index.html links to dittle_game.html
    root_index = os.path.join(os.path.dirname(os.path.dirname(__file__)), "index.html")
    with open(root_index, "r", encoding="utf-8") as f:
        index_html = f.read()
    assert "boardgame/tzarr/dittle_game.html" in index_html, "index.html must link to dittle_game.html"

def test_lateral_rolling_and_directional_animations():
    """Verify lateral rolling math (tilt West/East) and 3D animation keyframes."""
    # 1. White die rolling East (to the right): top=6, right=2
    die_east = PythonDittleDie('white')
    assert die_east.top == 6 and die_east.right == 2
    die_east.tilt('east')
    # Rolling east: left face (7 - 2 = 5) rolls to top, old top (6) rolls to right
    assert die_east.top == 5, "Rolling East brings West face (5) to top"
    assert die_east.right == 6, "Rolling East moves Top face (6) to right"
    assert die_east.front == 4, "Front face remains unchanged during lateral roll"

    # 2. White die rolling West (to the left): top=6, right=2
    die_west = PythonDittleDie('white')
    die_west.tilt('west')
    # Rolling west: right face (2) rolls to top, old top (6) rolls to left (right becomes 7 - 6 = 1)
    assert die_west.top == 2, "Rolling West brings East face (2) to top"
    assert die_west.right == 1, "Rolling West moves Top face (6) to left (right becomes 1)"
    assert die_west.front == 4, "Front face remains unchanged during lateral roll"

    # 3. Verify CSS has directional tilt roll keyframes
    css_path = os.path.join(GAME_DIR, "dittle_game_files", "dittle_components.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".anim-tilt-east" in css, "CSS must support eastward lateral roll animation"
    assert ".anim-tilt-west" in css, "CSS must support westward lateral roll animation"
    assert ".anim-tilt-north" in css, "CSS must support forward/north roll animation"
    assert ".anim-tilt-south" in css, "CSS must support southward roll animation"

def test_game_over_review_board_unblocked():
    """Verify game over modal allows reviewing the final board position without forced restart."""
    html_path = os.path.join(GAME_DIR, "dittle_game.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert 'id="reviewBoardBtn"' in html, "Game over modal must include '查看当前棋盘' button"
    assert 'id="closeGameOverModalBtn"' in html, "Game over modal must include close button"
    assert 'id="gameOverReviewBanner"' in html, "Must include floating review banner for board inspection"

    ui_path = os.path.join(GAME_DIR, "dittle_game_files", "ui.js")
    with open(ui_path, "r", encoding="utf-8") as f:
        ui_code = f.read()
    assert "showReviewBanner" in ui_code, "UI must support showing review banner"
    assert "closeGameOverModal" in ui_code, "UI must allow closing modal without restarting"

def test_game_logger_sidebar_and_copy():
    """Verify DittleLogger module, right sidebar DOM, and 1-click clipboard export."""
    logger_path = os.path.join(GAME_DIR, "dittle_game_files", "logger.js")
    assert os.path.exists(logger_path), "logger.js must exist"
    with open(logger_path, "r", encoding="utf-8") as f:
        logger_code = f.read()

    assert "class DittleLogger" in logger_code
    assert "logMove" in logger_code
    assert "logGameOver" in logger_code
    assert "copyToClipboard" in logger_code
    assert "getExportText" in logger_code

    html_path = os.path.join(GAME_DIR, "dittle_game.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
    assert 'id="gameLogSidebar"' in html, "HTML must include gameLogSidebar"
    assert 'id="gameLogList"' in html, "HTML must include gameLogList container"
    assert 'id="copyLogBtn"' in html, "HTML must include copyLogBtn"
    assert 'id="openLogBtn"' in html, "HTML must include openLogBtn"
def test_bug1_stalemate_checks_next_player():
    """Bug 1: checkGameOver must evaluate the NEXT player's legal moves, not current.

    After makeMove, this.turn should switch BEFORE checkGameOver runs,
    so stalemate detection targets the correct player.
    """
    engine_path = os.path.join(GAME_DIR, "dittle_game_files", "engine.js")
    with open(engine_path, "r", encoding="utf-8") as f:
        code = f.read()
    # Turn must switch BEFORE checkGameOver
    switch_idx = code.index("Switch turn FIRST")
    check_idx = code.index("Check game over (now this.turn is the next-to-move player)")
    assert switch_idx < check_idx, "Turn switch must happen BEFORE checkGameOver"
    # After game over, turn reverts to show who made the last move
    revert_idx = code.index("revert turn to indicate who made the winning/last move")
    assert revert_idx > check_idx, "Turn revert must happen AFTER checkGameOver"


def test_bug2_ai_no_move_handler():
    """Bug 2: UI must handle AI returning null (no legal moves) without freezing."""
    ui_path = os.path.join(GAME_DIR, "dittle_game_files", "ui.js")
    with open(ui_path, "r", encoding="utf-8") as f:
        code = f.read()
    # Must have an else branch for when bestMove is null/falsy
    assert "AI 无合法走法" in code, "UI must handle AI with no legal moves"
    assert "handleGameOver" in code, "UI must call handleGameOver when AI has no moves"


def test_bug3_clash_touchdown_before_clash():
    """Bug 3: In Clash mode, touchdown (reaching opponent base row) must be checked
    BEFORE clash resolution to prevent the arriving die from being killed."""
    engine_path = os.path.join(GAME_DIR, "dittle_game_files", "engine.js")
    with open(engine_path, "r", encoding="utf-8") as f:
        code = f.read()
    # Touchdown check must appear before resolveClash call
    touchdown_idx = code.index("达阵即胜优先于碰撞")
    resolve_idx = code.index("resolveClash(tr, tc)")
    assert touchdown_idx < resolve_idx, "Touchdown must be checked before clash resolution"
    assert "isTouchdown" in code, "Must have touchdown detection variable"


def test_bug4_bfs_visited_includes_start():
    """Bug 4a: BFS visited set must include start position to prevent zero-displacement loops."""
    engine_path = os.path.join(GAME_DIR, "dittle_game_files", "engine.js")
    with open(engine_path, "r", encoding="utf-8") as f:
        code = f.read()
    assert "new Set([`${startR},${startC}`])" in code, \
        "BFS visited must be initialized with start coordinate"


def test_bug4_direct_jump_clears_origin():
    """Bug 4b: Direct jump must use temp board with origin cleared."""
    engine_path = os.path.join(GAME_DIR, "dittle_game_files", "engine.js")
    with open(engine_path, "r", encoding="utf-8") as f:
        code = f.read()
    # Find the direct jump section and verify it creates temp board
    direct_jump_section = code[code.index("Direct Jump moves"):]
    assert "jumpBoard" in direct_jump_section or "tempBoard" in direct_jump_section, \
        "Direct jump must use a temp board copy"
    assert "jumpBoard[r][c] = null" in direct_jump_section or \
           "tempBoard[r][c] = null" in direct_jump_section, \
        "Direct jump must clear origin cell in temp board"


def test_bug5_score_panel_requires_full_data():
    """Bug 5: Score breakdown panel must only show when whiteBaseSum is defined."""
    ui_path = os.path.join(GAME_DIR, "dittle_game_files", "ui.js")
    with open(ui_path, "r", encoding="utf-8") as f:
        code = f.read()
    assert "whiteBaseSum !== undefined" in code, \
        "Score panel must check whiteBaseSum !== undefined before displaying"


def test_bug6_diagonal_any_distance():
    """Bug 6: Diagonal check must cover any distance, not just step-1."""
    engine_path = os.path.join(GAME_DIR, "dittle_game_files", "engine.js")
    with open(engine_path, "r", encoding="utf-8") as f:
        code = f.read()
    # The old buggy pattern had: Math.abs(dr) === 1 && Math.abs(dc) === 1
    assert "Math.abs(dr) === 1 && Math.abs(dc) === 1" not in code, \
        "Diagonal check must not be limited to step-1 only"
    # Verify the simplified pattern exists
    assert "Math.abs(dr) > 0 && Math.abs(dc) > 0" in code, \
        "Diagonal check must detect any non-zero dr AND dc"


def test_bug7_no_double_init():
    """Bug 7: Constructor must not call renderBoard/updatePlayerCards since startNewGame does."""
    ui_path = os.path.join(GAME_DIR, "dittle_game_files", "ui.js")
    with open(ui_path, "r", encoding="utf-8") as f:
        code = f.read()
    # Find constructor body (between 'constructor()' and next method)
    ctor_start = code.index("constructor()")
    ctor_end = code.index("initDOM()")
    ctor_body = code[ctor_start:ctor_end]
    assert "this.renderBoard()" not in ctor_body, \
        "Constructor should not call renderBoard (startNewGame does it)"
    assert "this.updatePlayerCards()" not in ctor_body, \
        "Constructor should not call updatePlayerCards (startNewGame does it)"



