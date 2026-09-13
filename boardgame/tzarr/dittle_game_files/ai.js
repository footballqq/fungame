// codex: 2026-09-13 AI Player for Dittle Dice Battle & Dittle Clash
class DittleAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    // Get best move asynchronously to keep UI responsive
    findBestMove(engine, callback) {
        setTimeout(() => {
            const moves = engine.getAllLegalMoves();
            if (moves.length === 0) {
                callback(null);
                return;
            }

            if (this.difficulty === 'easy') {
                // Easy: semi-random with light greedy bias
                const best = this.pickEasyMove(engine, moves);
                callback(best);
            } else if (this.difficulty === 'medium') {
                // Medium: 1-ply tactical greedy search
                const best = this.pickMediumMove(engine, moves);
                callback(best);
            } else {
                // Hard: 2-ply minimax with alpha-beta pruning
                const best = this.pickHardMove(engine, moves);
                callback(best);
            }
        }, 350); // slight natural thinking delay
    }

    pickEasyMove(engine, moves) {
        // 70% random, 30% best heuristic
        if (Math.random() < 0.35) {
            return this.pickMediumMove(engine, moves);
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    pickMediumMove(engine, moves) {
        let bestScore = -Infinity;
        let bestMove = moves[0];
        const player = engine.turn;

        for (const move of moves) {
            const sim = engine.clone();
            const res = sim.makeMove(move);
            if (sim.gameOver && sim.winner === player) {
                return move; // Immediate win!
            }
            const score = this.evaluateState(sim, player);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    pickHardMove(engine, moves) {
        const player = engine.turn;
        let bestScore = -Infinity;
        let bestMoves = [];

        // Check for immediate wins first
        for (const move of moves) {
            const sim = engine.clone();
            sim.makeMove(move);
            if (sim.gameOver && sim.winner === player) {
                return move;
            }
        }

        // Minimax depth 2
        for (const move of moves) {
            const sim = engine.clone();
            sim.makeMove(move);
            let score;
            if (sim.gameOver) {
                score = sim.winner === player ? 10000 : (sim.winner === 'draw' ? 0 : -10000);
            } else {
                score = this.minimax(sim, 1, -Infinity, Infinity, false, player);
            }

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    minimax(engine, depth, alpha, beta, isMaximizing, aiPlayer) {
        if (depth === 0 || engine.gameOver) {
            return this.evaluateState(engine, aiPlayer);
        }

        const moves = engine.getAllLegalMoves();
        if (moves.length === 0) {
            return this.evaluateState(engine, aiPlayer);
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const sim = engine.clone();
                sim.makeMove(move);
                const evalVal = this.minimax(sim, depth - 1, alpha, beta, false, aiPlayer);
                maxEval = Math.max(maxEval, evalVal);
                alpha = Math.max(alpha, evalVal);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const sim = engine.clone();
                sim.makeMove(move);
                const evalVal = this.minimax(sim, depth - 1, alpha, beta, true, aiPlayer);
                minEval = Math.min(minEval, evalVal);
                beta = Math.min(beta, evalVal);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluateState(engine, aiPlayer) {
        if (engine.gameOver) {
            if (engine.winner === aiPlayer) return 10000;
            if (engine.winner === 'draw') return 0;
            return -10000;
        }

        const opp = aiPlayer === 'white' ? 'black' : 'white';
        let score = 0;

        if (engine.mode === 'clash') {
            // CLASH MODE HEURISTIC:
            // 1. Piece count advantage
            let myCount = 0, oppCount = 0;
            let myMinDistToGoal = 7, oppMinDistToGoal = 7;

            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    const die = engine.board[r][c];
                    if (!die) continue;
                    const distToGoal = die.color === 'white' ? r : (6 - r);
                    if (die.color === aiPlayer) {
                        myCount++;
                        score += die.top * 2; // Higher top values are powerful in clash!
                        score += (6 - distToGoal) * 15; // Advancing towards goal
                        if (distToGoal < myMinDistToGoal) myMinDistToGoal = distToGoal;
                    } else {
                        oppCount++;
                        score -= die.top * 2;
                        score -= (6 - distToGoal) * 15;
                        if (distToGoal < oppMinDistToGoal) oppMinDistToGoal = distToGoal;
                    }
                }
            }
            score += (myCount - oppCount) * 80; // Elimination advantage
            score += (oppMinDistToGoal - myMinDistToGoal) * 25; // Race to opponent base row
        } else {
            // BATTLE MODE HEURISTIC:
            // 1. Progress to opponent base row
            // 2. High top values near/at opponent base row
            // 3. Penalty for unmoved dice in home row (-10 avoidance)
            let myInvaders = 0, oppInvaders = 0;
            let myHomeUnmoved = 0, oppHomeUnmoved = 0;
            let myBaseSum = 0, oppBaseSum = 0;

            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    const die = engine.board[r][c];
                    if (!die) continue;
                    const isAi = die.color === aiPlayer;
                    const isWhite = die.color === 'white';
                    const targetRow = isWhite ? 0 : 6;
                    const homeRow = isWhite ? 6 : 0;
                    const distToTarget = Math.abs(r - targetRow);

                    if (r === targetRow) {
                        // In target base row!
                        if (isAi) {
                            myInvaders++;
                            myBaseSum += die.top;
                            score += 100 + die.top * 10;
                        } else {
                            oppInvaders++;
                            oppBaseSum += die.top;
                            score -= (100 + die.top * 10);
                        }
                    } else if (r === homeRow) {
                        // Still in home row! Threat of -10 penalty
                        if (isAi) {
                            myHomeUnmoved++;
                            score -= 25;
                        } else {
                            oppHomeUnmoved++;
                            score += 25;
                        }
                    } else {
                        // Midfield advancing
                        const advancement = 6 - distToTarget;
                        if (isAi) {
                            score += advancement * 12 + die.top * 2;
                        } else {
                            score -= (advancement * 12 + die.top * 2);
                        }
                    }
                }
            }
            score += (myBaseSum - oppBaseSum) * 8;
            score += (oppHomeUnmoved - myHomeUnmoved) * 20;
        }

        return score;
    }
}

window.DittleAI = DittleAI;
