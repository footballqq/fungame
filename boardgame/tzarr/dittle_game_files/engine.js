// codex: 2026-09-14 设定黑白双方棋子默认均为6向上、3面向对面（两军对垒，双方3互相对视）
class DittleEngine {
    constructor(mode = 'battle') {
        this.mode = mode; // 'battle' (标准骰战棋) or 'clash' (冲突变体)
        this.boardSize = 7;
        this.board = Array(7).fill(null).map(() => Array(7).fill(null));
        this.turn = 'white'; // 'white' starts
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
        this.winReason = '';
        this.scores = { white: 0, black: 0 };
        this.initBoard();
    }

    initBoard() {
        this.board = Array(7).fill(null).map(() => Array(7).fill(null));
        for (let c = 0; c < 7; c++) {
            // 双方默认均为 6 是 top，3 面向对面：
            // Row 0 黑方底线：面向对面（南端 Row 6）为 3 -> front 为 3
            this.board[0][c] = new DittleDie('black', 6, 3, 2);
            // Row 6 白方底线：面向对面（北端 Row 0）为 3 -> front (朝向玩家南面) 为 4
            this.board[6][c] = new DittleDie('white', 6, 4, 2);
        }
        this.turn = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
        this.winReason = '';
        this.scores = { white: 0, black: 0 };
    }

    clone() {
        const copy = new DittleEngine(this.mode);
        copy.turn = this.turn;
        copy.gameOver = this.gameOver;
        copy.winner = this.winner;
        copy.winReason = this.winReason;
        copy.scores = { ...this.scores };
        copy.board = this.board.map(row => row.map(cell => (cell ? cell.clone() : null)));
        copy.moveHistory = [...this.moveHistory];
        return copy;
    }

    isValidCoord(r, c) {
        return r >= 0 && r < 7 && c >= 0 && c < 7;
    }

    getForwardDir(color) {
        return color === 'white' ? 'north' : 'south';
    }

    getLegalTiltDirections(color) {
        // Only forward, left, right. Backward and diagonal strictly forbidden!
        if (color === 'white') {
            return [
                { dir: 'north', dr: -1, dc: 0, name: '向前' },
                { dir: 'west', dr: 0, dc: -1, name: '向左' },
                { dir: 'east', dr: 0, dc: +1, name: '向右' }
            ];
        } else {
            return [
                { dir: 'south', dr: +1, dc: 0, name: '向前' },
                { dir: 'west', dr: 0, dc: -1, name: '向左' },
                { dir: 'east', dr: 0, dc: +1, name: '向右' }
            ];
        }
    }

    // Get single legal jumps from a position (严格限制：跳只能跳过一个棋子，不能大于等于两个)
    getSingleJumpsFrom(r, c, color, currentBoard) {
        const jumps = [];
        const dirs = this.getLegalTiltDirections(color);
        for (const { dir, dr, dc } of dirs) {
            const hurdleR = r + dr;
            const hurdleC = c + dc;
            const landR = r + 2 * dr;
            const landC = c + 2 * dc;

            // 跳跃条件：
            // 1. 距离 1 格的跨越障碍格必须有且仅有 1 颗棋子（无论己方对手）
            // 2. 距离 2 格的着陆空格必须在棋盘范围内且为空格
            // 严禁连续跳过多颗没有落脚空格的棋子（不能 >= 2 颗）
            if (this.isValidCoord(hurdleR, hurdleC) && this.isValidCoord(landR, landC)) {
                if (currentBoard[hurdleR][hurdleC] !== null && currentBoard[landR][landC] === null) {
                    jumps.push({ to: [landR, landC], dir, dr, dc, jumpedCount: 1 });
                }
            }
        }
        return jumps;
    }

    // Explore all reachable jump destinations (multi-jump sequences)
    getReachableJumps(startR, startC, color, currentBoard) {
        const results = [];
        const visited = new Set();
        const queue = [{ r: startR, c: startC, path: [[startR, startC]] }];

        while (queue.length > 0) {
            const current = queue.shift();
            const singleJumps = this.getSingleJumpsFrom(current.r, current.c, color, currentBoard);
            for (const j of singleJumps) {
                const key = `${j.to[0]},${j.to[1]}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    const newPath = [...current.path, j.to];
                    results.push({
                        to: j.to,
                        path: newPath
                    });
                    queue.push({ r: j.to[0], c: j.to[1], path: newPath });
                }
            }
        }
        return results;
    }

    // Get all legal moves for a specific die at (r, c)
    getLegalMovesForDie(r, c) {
        if (!this.isValidCoord(r, c)) return [];
        const die = this.board[r][c];
        if (!die || die.color !== this.turn || this.gameOver) return [];

        const moves = [];
        const tiltDirs = this.getLegalTiltDirections(die.color);

        // 1. Tilt moves (always 1 space forward/left/right into empty square)
        for (const td of tiltDirs) {
            const nr = r + td.dr;
            const nc = c + td.dc;
            if (this.isValidCoord(nr, nc) && this.board[nr][nc] === null) {
                const simulatedDie = die.clone().tilt(td.dir);
                moves.push({
                    from: [r, c],
                    to: [nr, nc],
                    type: 'tilt',
                    dir: td.dir,
                    path: [[r, c], [nr, nc]],
                    resultingDie: simulatedDie
                });

                // In Battle mode: Tilt can be followed by any legal jumps!
                if (this.mode === 'battle') {
                    // Create simulated board with die at (nr, nc)
                    const tempBoard = this.board.map(row => [...row]);
                    tempBoard[r][c] = null;
                    tempBoard[nr][nc] = simulatedDie;

                    const jumpDestinations = this.getReachableJumps(nr, nc, die.color, tempBoard);
                    for (const jd of jumpDestinations) {
                        moves.push({
                            from: [r, c],
                            to: jd.to,
                            type: 'tilt_jump',
                            dir: td.dir,
                            path: [[r, c], ...jd.path],
                            resultingDie: simulatedDie.clone()
                        });
                    }
                }
            }
        }

        // 2. Direct Jump moves (Battle mode only, no tilt first)
        if (this.mode === 'battle') {
            const directJumps = this.getReachableJumps(r, c, die.color, this.board);
            for (const dj of directJumps) {
                moves.push({
                    from: [r, c],
                    to: dj.to,
                    type: 'jump',
                    path: dj.path,
                    resultingDie: die.clone() // Top face does not change!
                });
            }
        }

        return moves;
    }

    // Get all legal moves for current player
    getAllLegalMoves() {
        if (this.gameOver) return [];
        const allMoves = [];
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (this.board[r][c] && this.board[r][c].color === this.turn) {
                    const moves = this.getLegalMovesForDie(r, c);
                    allMoves.push(...moves);
                }
            }
        }
        return allMoves;
    }

    // Validate if an attempted move from (fr, fc) to (tr, tc) is legal
    validateMoveAttempt(fr, fc, tr, tc) {
        if (!this.isValidCoord(fr, fc)) return { valid: false, reason: '起点坐标超出棋盘范围。' };
        const die = this.board[fr][fc];
        if (!die) return { valid: false, reason: '起点方格中没有棋子。' };
        if (die.color !== this.turn) return { valid: false, reason: `当前轮到${this.turn === 'white' ? '白方' : '黑方'}走棋，不能操作对方棋子。` };
        if (this.gameOver) return { valid: false, reason: '游戏已结束。' };

        // Direction check
        const dr = tr - fr;
        const dc = tc - fc;
        const forwardDr = die.color === 'white' ? -1 : +1;

        if (dr * forwardDr < 0 && Math.abs(dr) > 0) {
            return { valid: false, reason: '规则禁止：骰子严禁向后退移（只能向前、向左或向右）。' };
        }
        if (Math.abs(dr) > 0 && Math.abs(dc) > 0 && Math.abs(dr) === 1 && Math.abs(dc) === 1) {
            return { valid: false, reason: '规则禁止：骰子严禁沿对角线斜向移动。' };
        }

        if (this.board[tr][tc] !== null) {
            return { valid: false, reason: '目标方格已被占用，骰子必须着陆在空格中。' };
        }

        const legalMoves = this.getLegalMovesForDie(fr, fc);
        const match = legalMoves.find(m => m.to[0] === tr && m.to[1] === tc);
        if (match) {
            return { valid: true, move: match };
        }

        if (this.mode === 'clash') {
            return { valid: false, reason: '冲突变体（Dittle Clash）模式严禁跳跃，骰子只能翻滚移动 1 格。' };
        }

        // 检查是否试图一次性跳过连续 >= 2 颗棋子
        if (fr === tr || fc === tc) {
            const stepR = fr === tr ? 0 : (tr > fr ? 1 : -1);
            const stepC = fc === tc ? 0 : (tc > fc ? 1 : -1);
            let consecutiveDice = 0;
            let maxConsecutive = 0;
            let cr = fr + stepR;
            let cc = fc + stepC;
            while (cr !== tr || cc !== tc) {
                if (this.board[cr][cc] !== null) {
                    consecutiveDice++;
                    if (consecutiveDice > maxConsecutive) maxConsecutive = consecutiveDice;
                } else {
                    consecutiveDice = 0;
                }
                cr += stepR;
                cc += stepC;
            }
            if (maxConsecutive >= 2) {
                return { valid: false, reason: '跳跃规则限制：每次跳跃只能越过 1 颗棋子，不能跳过大于等于两个棋子！' };
            }
        }

        return { valid: false, reason: '非法移动：无法通过合法的单次翻滚、连续跳跃或组合移动到达该格子。' };
    }

    // Execute a move
    makeMove(move) {
        const [fr, fc] = move.from;
        const [tr, tc] = move.to;
        const die = this.board[fr][fc];
        if (!die) return null;

        const resultingDie = move.resultingDie ? move.resultingDie.clone() : die.clone();
        this.board[fr][fc] = null;
        this.board[tr][tc] = resultingDie;

        const moveRecord = {
            player: this.turn,
            move,
            clashResult: null
        };

        // If Clash Mode: resolve orthogonal clashes
        if (this.mode === 'clash') {
            const clashInfo = this.resolveClash(tr, tc);
            moveRecord.clashResult = clashInfo;
        }

        this.moveHistory.push(moveRecord);

        // Switch turn FIRST so checkGameOver evaluates the NEXT player's legal moves
        this.turn = this.turn === 'white' ? 'black' : 'white';

        // Check game over (now this.turn is the next-to-move player)
        this.checkGameOver();

        // If game ended, revert turn to indicate who made the winning/last move
        if (this.gameOver) {
            this.turn = this.turn === 'white' ? 'black' : 'white';
        }

        return moveRecord;
    }

    // Clash resolution in Dittle Clash variant
    resolveClash(r, c) {
        const movingDie = this.board[r][c];
        if (!movingDie) return null;

        const oppColor = movingDie.color === 'white' ? 'black' : 'white';
        const neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
        ];

        const adjacentOppDice = [];
        for (const [nr, nc] of neighbors) {
            if (this.isValidCoord(nr, nc)) {
                const adj = this.board[nr][nc];
                if (adj && adj.color === oppColor) {
                    adjacentOppDice.push({ r: nr, c: nc, die: adj });
                }
            }
        }

        if (adjacentOppDice.length === 0) return null;

        const oppSum = adjacentOppDice.reduce((acc, cur) => acc + cur.die.top, 0);
        const movingVal = movingDie.top;

        const clashEvent = {
            at: [r, c],
            movingDieVal: movingVal,
            oppDiceCount: adjacentOppDice.length,
            oppDiceSum: oppSum,
            outcome: ''
        };

        if (movingVal > oppSum) {
            // Moving die destroys all adjacent opponent dice
            clashEvent.outcome = 'win';
            for (const item of adjacentOppDice) {
                this.board[item.r][item.c] = null;
            }
        } else if (movingVal < oppSum) {
            // Moving die is destroyed
            clashEvent.outcome = 'loss';
            this.board[r][c] = null;
        } else {
            // Tie -> all involved dice are eliminated!
            clashEvent.outcome = 'tie_mutual_elimination';
            this.board[r][c] = null;
            for (const item of adjacentOppDice) {
                this.board[item.r][item.c] = null;
            }
        }
        return clashEvent;
    }

    // Check game over conditions
    checkGameOver() {
        if (this.mode === 'clash') {
            // Clash Mode winning condition:
            // 1. Any single die in opponent's base row wins immediately!
            // Row 0 is Black base row (White wins if white die reaches row 0)
            for (let c = 0; c < 7; c++) {
                if (this.board[0][c] && this.board[0][c].color === 'white') {
                    this.gameOver = true;
                    this.winner = 'white';
                    this.winReason = '白方骰子成功抵达对方底线，直接获得胜利！';
                    return;
                }
                if (this.board[6][c] && this.board[6][c].color === 'black') {
                    this.gameOver = true;
                    this.winner = 'black';
                    this.winReason = '黑方骰子成功抵达对方底线，直接获得胜利！';
                    return;
                }
            }

            // 2. Check if either side has 0 dice left
            let whiteCount = 0, blackCount = 0;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (this.board[r][c]) {
                        if (this.board[r][c].color === 'white') whiteCount++;
                        else blackCount++;
                    }
                }
            }
            if (whiteCount === 0 && blackCount === 0) {
                this.gameOver = true;
                this.winner = 'draw';
                this.winReason = '双方所有棋子同归于尽淘汰，平局！';
                return;
            }
            if (whiteCount === 0) {
                this.gameOver = true;
                this.winner = 'black';
                this.winReason = '白方棋子全军覆没，黑方获胜！';
                return;
            }
            if (blackCount === 0) {
                this.gameOver = true;
                this.winner = 'white';
                this.winReason = '黑方棋子全军覆没，白方获胜！';
                return;
            }
        } else {
            // Standard Battle Mode:
            // Check Base Row full (Anti-stalling exception rule) OR all 7 in base row
            let whiteInRow0 = 0;
            let blackInRow6 = 0;
            let row0Occupied = 0;
            let row6Occupied = 0;
            let whiteInHomeRow6 = 0;
            let blackInHomeRow0 = 0;

            for (let c = 0; c < 7; c++) {
                if (this.board[0][c] !== null) {
                    row0Occupied++;
                    if (this.board[0][c].color === 'white') whiteInRow0++;
                    if (this.board[0][c].color === 'black') blackInHomeRow0++;
                }
                if (this.board[6][c] !== null) {
                    row6Occupied++;
                    if (this.board[6][c].color === 'black') blackInRow6++;
                    if (this.board[6][c].color === 'white') whiteInHomeRow6++;
                }
            }

            // 结局判断：
            // 1. 标准终局：一方全部 7 颗骰子攻占对手底线。
            // 2. 反消极例外终局：某一方底线被全部占满（7格无空格），且该底线中【必须至少包含 1 颗攻入的对手棋子】！
            //    （必须包含对手棋子，防止开局未动子或刚出子时将初始底线误判为终局）
            const row0FullWithInvader = (row0Occupied === 7 && whiteInRow0 >= 1);
            const row6FullWithInvader = (row6Occupied === 7 && blackInRow6 >= 1);

            const normalEnd = (whiteInRow0 === 7) || (blackInRow6 === 7);

            if (row0FullWithInvader || row6FullWithInvader) {
                this.gameOver = true;
                // Calculate scores
                let whiteSum = 0;
                let blackSum = 0;
                for (let c = 0; c < 7; c++) {
                    if (this.board[0][c] && this.board[0][c].color === 'white') {
                        whiteSum += this.board[0][c].top;
                    }
                    if (this.board[6][c] && this.board[6][c].color === 'black') {
                        blackSum += this.board[6][c].top;
                    }
                }

                // Apply -10 penalty for each own die still in home row
                const whitePenalty = whiteInHomeRow6 * 10;
                const blackPenalty = blackInHomeRow0 * 10;
                const whiteNet = whiteSum - whitePenalty;
                const blackNet = blackSum - blackPenalty;

                this.scores = {
                    white: whiteNet,
                    black: blackNet,
                    whiteBaseSum: whiteSum,
                    blackBaseSum: blackSum,
                    whitePenalty,
                    blackPenalty
                };

                let endTypeStr = normalEnd ? '全军占满对方底线' : '底线被双方填满（含攻入棋子，触发反消极规则）';
                if (whiteNet > blackNet) {
                    this.winner = 'white';
                    this.winReason = `${endTypeStr}！白方净得分 ${whiteNet} 分高于黑方 ${blackNet} 分，白方胜！`;
                } else if (blackNet > whiteNet) {
                    this.winner = 'black';
                    this.winReason = `${endTypeStr}！黑方净得分 ${blackNet} 分高于白方 ${whiteNet} 分，黑方胜！`;
                } else {
                    this.winner = 'draw';
                    this.winReason = `${endTypeStr}！双方净得分均为 ${whiteNet} 分，平局！`;
                }
                return;
            }
        }

        // Check if next player has any legal moves
        const nextMoves = this.getAllLegalMoves();
        if (nextMoves.length === 0) {
            this.gameOver = true;
            this.winner = this.turn === 'white' ? 'black' : 'white';
            this.winReason = `${this.turn === 'white' ? '白方' : '黑方'}无任何合法移动，判负！`;
        }
    }
}

window.DittleDie = DittleDie;
window.DittleEngine = DittleEngine;
