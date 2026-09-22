// codex: 2026-09-22 实现青蛙跳跃BFS最短路径求解器、教学解说与提示引擎
/**
 * 青蛙跳跃求解与教学引擎 (solver.js)
 * 提供 BFS 全局最优解搜索、下一步智能提示与通俗生动的战术教学解说
 */

class JumpFrogSolver {
    /**
     * 将棋盘数组转换为字符串键
     */
    static stateToKey(board) {
        return board.join('');
    }

    /**
     * 从当前棋盘运行 BFS 搜索到达目标的最短路径
     * 返回棋盘状态数组序列 [board0, board1, ...]，无解返回 null
     */
    static solve(currentBoard, targetBoard, allowBackward = true, maxStates = 50000) {
        const startKey = this.stateToKey(currentBoard);
        const targetKey = this.stateToKey(targetBoard);

        if (startKey === targetKey) {
            return [[...currentBoard]];
        }

        const queue = [currentBoard];
        const visited = new Set([startKey]);
        const parentMap = new Map(); // key -> { prevBoard, move }

        while (queue.length > 0 && visited.size < maxStates) {
            const curr = queue.shift();
            const currKey = this.stateToKey(curr);

            if (currKey === targetKey) {
                // 重建路径
                const path = [];
                let traceKey = currKey;
                let traceBoard = curr;

                while (traceKey !== startKey) {
                    path.push(traceBoard);
                    const record = parentMap.get(traceKey);
                    traceBoard = record.prevBoard;
                    traceKey = this.stateToKey(traceBoard);
                }
                path.push([...currentBoard]);
                path.reverse();
                return path;
            }

            // 获取合法走法
            const emptyIdx = curr.indexOf(EMPTY);
            if (emptyIdx === -1) continue;

            for (const offset of [-2, -1, 1, 2]) {
                const fromIdx = emptyIdx + offset;
                if (fromIdx < 0 || fromIdx >= curr.length) continue;
                const frog = curr[fromIdx];
                if (frog === EMPTY) continue;

                if (!allowBackward) {
                    if (frog === WHITE && fromIdx > emptyIdx) continue;
                    if (frog === BLACK && fromIdx < emptyIdx) continue;
                }

                const nextBoard = [...curr];
                nextBoard[emptyIdx] = frog;
                nextBoard[fromIdx] = EMPTY;
                const nextKey = this.stateToKey(nextBoard);

                if (!visited.has(nextKey)) {
                    visited.add(nextKey);
                    parentMap.set(nextKey, {
                        prevBoard: curr,
                        move: { from: fromIdx, to: emptyIdx, frog, dist: Math.abs(offset) }
                    });
                    queue.push(nextBoard);
                }
            }
        }

        return null;
    }

    /**
     * 获取从当前棋盘出发的单步智能提示
     */
    static getHint(currentBoard, targetBoard, allowBackward = true) {
        const path = this.solve(currentBoard, targetBoard, allowBackward);
        if (!path || path.length < 2) return null;

        const nextBoard = path[1];
        const emptyCur = currentBoard.indexOf(EMPTY);
        const emptyNxt = nextBoard.indexOf(EMPTY);
        const fromIdx = emptyNxt;
        const toIdx = emptyCur;
        const frog = currentBoard[fromIdx];
        const dist = Math.abs(fromIdx - toIdx);

        return {
            fromIdx,
            toIdx,
            frog,
            type: dist === 1 ? 'slide' : 'jump',
            remainingSteps: path.length - 1,
            explanation: this.explainMove(currentBoard, fromIdx, toIdx)
        };
    }

    /**
     * 生成生动详细的战术教学解析
     */
    static explainMove(board, fromIdx, toIdx) {
        const frog = board[fromIdx];
        const frogName = frog === WHITE ? '白蛙' : '黑蛙';
        const targetColor = frog === WHITE ? '右侧' : '左侧';
        const dist = Math.abs(fromIdx - toIdx);
        const direction = toIdx > fromIdx ? '向右' : '向左';

        if (dist === 1) {
            // 平移
            if (fromIdx === 1 && toIdx === 0 && frog === WHITE) {
                return `【开局腾挪】第1格白蛙向左移入角落空格，将通道让给后方队友，为交错跳跃做准备！`;
            }
            return `【微调阵型】${frogName}从第${fromIdx + 1}格${direction}平移进驻空格，为后续青蛙创造跳板。`;
        } else {
            // 跳跃
            const jumpedIdx = (fromIdx + toIdx) / 2;
            const jumpedFrog = board[jumpedIdx];
            const jumpedName = jumpedFrog === WHITE ? '白蛙' : '黑蛙';

            if (frog !== jumpedFrog) {
                return `【关键跃迁】${frogName}大步飞跃第${jumpedIdx + 1}格的${jumpedName}！黑白蛙成功实现交叉穿插，有效避免两同色蛙并排堵塞！`;
            } else {
                return `【同色超车】${frogName}飞跃同队的${jumpedName}，快速向${targetColor}目标阵地推进！`;
            }
        }
    }

    /**
     * 判断当前是否陷入死局（不可达目标）
     */
    static isDeadlocked(currentBoard, targetBoard, allowBackward = true) {
        const path = this.solve(currentBoard, targetBoard, allowBackward, 15000);
        return path === null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JumpFrogSolver };
}
