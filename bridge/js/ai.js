// codex: 2026-08-10 接入预存 Lehman 双树计划，避免目标尺寸的大师级博弈搜索。
class BridgItAI {
    /**
     * @param {string} difficulty 'beginner' | 'normal' | 'hard' | 'master'
     * @param {string} aiColor 'blue' | 'red'
     */
    constructor(difficulty = 'normal', aiColor = 'red') {
        this.difficulty = difficulty;
        this.aiColor = aiColor;
        this.timeLimitMs = 100; // Keep the main thread responsive on the largest board.
        this.startTime = 0;
    }

    /**
     * Select best move for current board state (GUARANTEED state preservation & non-null return)
     * @param {BridgItGame} game 
     * @returns {string} edgeId
     */
    getBestMove(game) {
        this.startTime = Date.now();
        const savedPlayer = game.currentPlayer;
        const savedWinner = game.winner;

        const validMoves = game.getValidMoves(this.aiColor);
        if (!validMoves || validMoves.length === 0) return null;
        if (validMoves.length === 1) return validMoves[0];

        let moveResult = validMoves[0];

        try {
            const cachedLehman = this.difficulty === 'master' && this.aiColor === 'blue'
                && typeof LehmanPairingStrategy !== 'undefined'
                && LehmanPairingStrategy.hasPlan(game.R, game.C);
            const lehmanMove = cachedLehman ? this._getLehmanMove(game, validMoves) : null;
            if (lehmanMove) {
                moveResult = lehmanMove;
            } else {
                // TACTICAL PRUNING 1: Check Immediate Win / Immediate Block (0ms response)
                const threatMove = this._checkImmediateThreat(game, this.aiColor, validMoves);
                if (threatMove) {
                    moveResult = threatMove;
                } else {
                switch (this.difficulty) {
                    case 'beginner':
                        moveResult = this._getBeginnerMove(validMoves);
                        break;
                    case 'normal':
                        moveResult = this._getNormalMove(game, validMoves);
                        break;
                    case 'hard':
                        moveResult = this._getHardMove(game, validMoves);
                        break;
                    case 'master':
                        moveResult = this._getMasterMove(game, validMoves);
                        break;
                    default:
                        moveResult = this._getNormalMove(game, validMoves);
                        break;
                }
                }
            }
        } catch (e) {
            console.warn('AI calculation exception, using fallback move:', e);
            moveResult = validMoves[0];
        } finally {
            // ALWAYS restore game.currentPlayer & game.winner state after evaluation!
            game.currentPlayer = savedPlayer;
            game.winner = savedWinner;
        }

        if (!moveResult || !validMoves.includes(moveResult)) {
            moveResult = validMoves[0];
        }

        return moveResult;
    }

    _isTimeUp() {
        return (Date.now() - this.startTime) > this.timeLimitMs;
    }

    _simulateMove(game, color, move, evaluate) {
        const savedPlayer = game.currentPlayer;
        const savedWinner = game.winner;
        const historyLength = game.history.length;
        const moved = game.makeMove(move, color);
        let result = null;

        try {
            if (moved) result = evaluate();
        } finally {
            while (game.history.length > historyLength) game.undo(1);
            game.currentPlayer = savedPlayer;
            game.winner = savedWinner;
        }
        return result;
    }

    /**
     * Immediate Threat Pruning:
     * 1. If AI has a move that wins immediately -> PLAY IT.
     * 2. If Opponent has a move that wins next turn -> BLOCK IT.
     */
    _checkImmediateThreat(game, color, validMoves) {
        const oppColor = color === 'blue' ? 'red' : 'blue';

        // 1. Immediate Win Check for AI
        for (const move of validMoves) {
            if (this._isTimeUp()) break;
            const winner = this._simulateMove(game, color, move, () => game.winner);
            if (winner === color) {
                return move;
            }
        }

        // 2. Immediate Block Check for Opponent's win
        const oppValidMoves = game.getValidMoves(oppColor);
        for (const oppMove of oppValidMoves) {
            if (this._isTimeUp()) break;
            const winner = this._simulateMove(game, oppColor, oppMove, () => game.winner);

            if (winner === oppColor) {
                const blockingEdge = color === 'blue' ? game.redToBlueMap[oppMove] : game.blueToRedMap[oppMove];
                if (blockingEdge && validMoves.includes(blockingEdge)) {
                    return blockingEdge;
                }
            }
        }

        return null;
    }

    // 1. Beginner: Random choice
    _getBeginnerMove(validMoves) {
        const idx = Math.floor(Math.random() * validMoves.length);
        return validMoves[idx];
    }

    // 2. Normal: Heuristic Shortest Path distance check over candidate moves
    _getNormalMove(game, validMoves) {
        const candidates = this._getCandidateMoves(game, this.aiColor, validMoves, 8);
        let bestScore = -Infinity;
        let bestMove = candidates[0] || validMoves[0];

        for (const move of candidates) {
            if (this._isTimeUp()) break;
            const score = this._evaluateMoveHeuristic(game, move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    // 3. Hard: Alpha-Beta Minimax search with candidate move pruning (Depth 3)
    _getHardMove(game, validMoves) {
        const candidates = this._getCandidateMoves(game, this.aiColor, validMoves, 8);
        let bestScore = -Infinity;
        let bestMove = candidates[0] || validMoves[0];
        const depth = 3;

        for (const move of candidates) {
            if (this._isTimeUp()) break;
            const score = this._simulateMove(
                game,
                this.aiColor,
                move,
                () => this._minimax(game, depth - 1, -Infinity, Infinity, false)
            );

            if (score !== null && score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    // 4. Master: precomputed Lehman tree plans for supported Blue boards, otherwise Alpha-Beta.
    _getMasterMove(game, validMoves) {
        if (this.aiColor === 'blue') {
            const lehmanMove = this._getLehmanMove(game, validMoves);
            if (lehmanMove) return lehmanMove;
            const pairingMove = this._getSpanningTreePairingMove(game, validMoves);
            if (pairingMove) return pairingMove;
        }
        const candidates = this._getCandidateMoves(game, this.aiColor, validMoves, 8);
        let bestScore = -Infinity;
        let bestMove = candidates[0] || validMoves[0];
        const depth = 3;

        for (const move of candidates) {
            if (this._isTimeUp()) break;
            const score = this._simulateMove(
                game,
                this.aiColor,
                move,
                () => this._minimax(game, depth - 1, -Infinity, Infinity, false)
            );

            if (score !== null && score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    _getLehmanMove(game, validMoves) {
        if (typeof LehmanPairingStrategy === 'undefined') return null;
        return LehmanPairingStrategy.getMove(game, validMoves);
    }

    /**
     * Filter top N candidate moves based on heuristic impact on distances
     */
    _getCandidateMoves(game, color, validMoves, limit = 8) {
        if (!validMoves || validMoves.length === 0) return [];
        if (validMoves.length <= limit) return validMoves;

        const oppColor = color === 'blue' ? 'red' : 'blue';
        const scored = [];
        const scanLimit = game.R >= 7 ? 18 : 28;

        for (const move of validMoves.slice(0, scanLimit)) {
            if (this._isTimeUp()) break;
            const evaluation = this._simulateMove(game, color, move, () => {
                const winner = game.winner;
                return {
                    winner,
                    distSelf: winner === color ? 0 : this._getShortestPath(game, color),
                    distOpp: winner === oppColor ? 0 : this._getShortestPath(game, oppColor)
                };
            });
            if (!evaluation) continue;
            const { winner, distSelf, distOpp } = evaluation;

            if (winner === color) return [move];

            const score = (distOpp * 12) - (distSelf * 15);
            scored.push({ score, move });
        }

        if (scored.length === 0) return validMoves.slice(0, limit);

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(item => item.move);
    }

    _getSpanningTreePairingMove(game, validMoves) {
        const pairingMap = this.getPairingMap(game);
        if (!pairingMap) return null;

        if (game.history.length === 0) {
            const preferred = 'bv_2_0';
            if (validMoves.includes(preferred)) return preferred;
            return validMoves[0];
        }

        const lastMove = game.history[game.history.length - 1];
        if (lastMove && lastMove.player === 'red') {
            const redEdgeId = lastMove.edgeId;
            const pairedBlueId = pairingMap[redEdgeId];

            if (pairedBlueId && validMoves.includes(pairedBlueId)) {
                return pairedBlueId;
            }
        }

        return null;
    }

    /**
     * Gross's 3x4 pairing is defined on 13 productive crossing sites.
     * Blue opens bv_2_0, blocking rh_2_0. The remaining 12 productive sites
     * form six pairs; boundary moves are paired as harmless responses.
     */
    getPairingMap(game) {
        if (game.R !== 3 || game.C !== 4) return null;

        return {
            rh_0_0: 'bv_0_1', rh_0_1: 'bv_0_0',
            rh_0_2: 'bv_1_0', rh_1_0: 'bv_0_2',
            rh_1_1: 'bv_1_2', rh_1_2: 'bv_1_1',
            rh_2_1: 'bh_2_0', rv_1_1: 'bv_2_1',
            rh_2_2: 'bh_2_1', rv_1_2: 'bv_2_2',
            rv_0_1: 'bh_1_1', rv_0_2: 'bh_1_0',
            rv_0_0: 'bh_0_0', rv_0_3: 'bh_0_1',
            rv_1_0: 'bh_3_0', rv_1_3: 'bh_3_1'
        };
    }

    _evaluateMoveHeuristic(game, move) {
        return this._simulateMove(game, this.aiColor, move, () => {
            if (game.winner === this.aiColor) return 10000;
            const opponentColor = this.aiColor === 'blue' ? 'red' : 'blue';
            const aiDist = this._getShortestPath(game, this.aiColor);
            const oppDist = this._getShortestPath(game, opponentColor);
            return (oppDist * 10) - (aiDist * 15) + (Math.random() * 0.5);
        });
    }

    _minimax(game, depth, alpha, beta, isMaximizing) {
        if (this._isTimeUp()) {
            const opponentColor = this.aiColor === 'blue' ? 'red' : 'blue';
            const aiDist = this._getShortestPath(game, this.aiColor);
            const oppDist = this._getShortestPath(game, opponentColor);
            return (oppDist * 10) - (aiDist * 15);
        }

        const winner = game.checkWinner();
        if (winner === this.aiColor) return 10000 + depth;
        if (winner && winner !== this.aiColor) return -10000 - depth;
        if (depth === 0) {
            const opponentColor = this.aiColor === 'blue' ? 'red' : 'blue';
            const aiDist = this._getShortestPath(game, this.aiColor);
            const oppDist = this._getShortestPath(game, opponentColor);
            return (oppDist * 10) - (aiDist * 15);
        }

        const currentColor = isMaximizing ? this.aiColor : (this.aiColor === 'blue' ? 'red' : 'blue');
        const validMoves = game.getValidMoves(currentColor);

        if (!validMoves || validMoves.length === 0) return 0;

        const candidates = validMoves.slice(0, 6);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of candidates) {
                if (this._isTimeUp()) break;
                game.makeMove(move, currentColor);
                const evalScore = this._minimax(game, depth - 1, alpha, beta, false);
                game.undo(1);
                game.currentPlayer = currentColor;
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of candidates) {
                if (this._isTimeUp()) break;
                game.makeMove(move, currentColor);
                const evalScore = this._minimax(game, depth - 1, alpha, beta, true);
                game.undo(1);
                game.currentPlayer = currentColor;
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * 0-1 BFS Shortest Path algorithm (Deque: 0-cost to front, 1-cost to back) with maxStep safety limit
     */
    _getShortestPath(game, color) {
        const { R, C } = game;
        let stepCount = 0;
        const maxSteps = 300; // Hard loop cap to guarantee BFS never freezes!

        if (color === 'blue') {
            const queue = [];
            let head = 0;
            let tail = 0;
            const visited = new Map();
            for (let c = 0; c < C - 1; c++) {
                const k = `0_${c}`;
                visited.set(k, 0);
                queue[tail++] = { r: 0, c, dist: 0 };
            }

            while (head < tail && stepCount < maxSteps) {
                stepCount++;
                const { r, c, dist } = queue[head++];
                if (r === R) return dist;

                const nbrs = [
                    { nr: r - 1, nc: c, edge: `bv_${r - 1}_${c}` },
                    { nr: r + 1, nc: c, edge: `bv_${r}_${c}` },
                    { nr: r, nc: c - 1, edge: `bh_${r}_${c - 1}` },
                    { nr: r, nc: c + 1, edge: `bh_${r}_${c}` }
                ];

                for (const { nr, nc, edge } of nbrs) {
                    if (nr >= 0 && nr <= R && nc >= 0 && nc < C - 1) {
                        const edgeData = game.blueEdges[edge];
                        if (!edgeData) continue;
                        if (edgeData.owner === 'red') continue;

                        const cost = edgeData.owner === 'blue' ? 0 : 1;
                        const newDist = dist + cost;
                        const key = `${nr}_${nc}`;

                        if (!visited.has(key) || newDist < visited.get(key)) {
                            visited.set(key, newDist);
                            if (cost === 0) {
                                queue[--head] = { r: nr, c: nc, dist: newDist };
                            } else {
                                queue[tail++] = { r: nr, c: nc, dist: newDist };
                            }
                        }
                    }
                }
            }
            return 999;
        } else {
            // Red: left (c=0) to right (c=C-1)
            const queue = [];
            let head = 0;
            let tail = 0;
            const visited = new Map();
            for (let r = 0; r < R; r++) {
                const k = `${r}_0`;
                visited.set(k, 0);
                queue[tail++] = { r, c: 0, dist: 0 };
            }

            while (head < tail && stepCount < maxSteps) {
                stepCount++;
                const { r, c, dist } = queue[head++];
                if (c === C - 1) return dist;

                const nbrs = [
                    { nr: r - 1, nc: c, edge: `rv_${r - 1}_${c}` },
                    { nr: r + 1, nc: c, edge: `rv_${r}_${c}` },
                    { nr: r, nc: c - 1, edge: `rh_${r}_${c - 1}` },
                    { nr: r, nc: c + 1, edge: `rh_${r}_${c}` }
                ];

                for (const { nr, nc, edge } of nbrs) {
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
                        const edgeData = game.redEdges[edge];
                        if (!edgeData) continue;
                        if (edgeData.owner === 'blue') continue;

                        const cost = edgeData.owner === 'red' ? 0 : 1;
                        const newDist = dist + cost;
                        const key = `${nr}_${nc}`;

                        if (!visited.has(key) || newDist < visited.get(key)) {
                            visited.set(key, newDist);
                            if (cost === 0) {
                                queue[--head] = { r: nr, c: nc, dist: newDist };
                            } else {
                                queue[tail++] = { r: nr, c: nc, dist: newDist };
                            }
                        }
                    }
                }
            }
            return 999;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BridgItAI };
}
