// codex: 2026-11-13 4x4网格折纸几何数学状态引擎，维护16格三维堆叠与折叠变换

class FoldEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.squares = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const id = r * 4 + c + 1;
                this.squares.push({
                    id: id,
                    r0: r,
                    c0: c,
                    x: c,
                    y: r,
                    z: 0,
                    faceUp: true,
                });
            }
        }
        this.history = []; // 用于撤销
        this.redoStack = []; // 用于重做
    }

    cloneState() {
        return this.squares.map(sq => ({ ...sq }));
    }

    getDimensions() {
        const xs = this.squares.map(sq => sq.x);
        const ys = this.squares.map(sq => sq.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return {
            minX, maxX,
            minY, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
        };
    }

    getThickness() {
        const counts = {};
        for (const sq of this.squares) {
            const key = `${sq.x},${sq.y}`;
            counts[key] = (counts[key] || 0) + 1;
        }
        const vals = Object.values(counts);
        return {
            maxThickness: vals.length > 0 ? Math.max(...vals) : 0,
            counts: counts,
            totalCells: vals.length,
        };
    }

    getCellStack(x, y) {
        return this.squares
            .filter(sq => sq.x === x && sq.y === y)
            .sort((a, b) => a.z - b.z);
    }

    /**
     * 获取当前可用的折线位置
     */
    getAvailableCreases() {
        const dim = this.getDimensions();
        const vLines = [];
        for (let x = 1; x < dim.width; x++) {
            vLines.push({
                line: x,
                desc: `竖线 x=${x}`,
                directions: ['L->R', 'R->L']
            });
        }
        const hLines = [];
        for (let y = 1; y < dim.height; y++) {
            hLines.push({
                line: y,
                desc: `横线 y=${y}`,
                directions: ['T->B', 'B->T']
            });
        }
        return { vLines, hLines, dim };
    }

    /**
     * 执行折叠操作
     * @param {string} axis 'v' 或 'h'
     * @param {number} line 折线坐标 (1..dim-1)
     * @param {string} direction 'L->R', 'R->L', 'T->B', 'B->T'
     * @param {string} desc 操作中文描述
     */
    fold(axis, line, direction, desc = '') {
        const prevSquares = this.cloneState();

        if (axis === 'v') {
            if (direction === 'L->R') {
                for (const sq of this.squares) {
                    if (sq.x < line) {
                        sq.x = 2 * line - 1 - sq.x;
                        sq.faceUp = !sq.faceUp;
                        sq.z += 100;
                    }
                }
            } else if (direction === 'R->L') {
                for (const sq of this.squares) {
                    if (sq.x >= line) {
                        sq.x = 2 * line - 1 - sq.x;
                        sq.faceUp = !sq.faceUp;
                        sq.z += 100;
                    }
                }
            } else {
                throw new Error(`未知垂直方向: ${direction}`);
            }
        } else if (axis === 'h') {
            if (direction === 'T->B') {
                for (const sq of this.squares) {
                    if (sq.y < line) {
                        sq.y = 2 * line - 1 - sq.y;
                        sq.faceUp = !sq.faceUp;
                        sq.z += 100;
                    }
                }
            } else if (direction === 'B->T') {
                for (const sq of this.squares) {
                    if (sq.y >= line) {
                        sq.y = 2 * line - 1 - sq.y;
                        sq.faceUp = !sq.faceUp;
                        sq.z += 100;
                    }
                }
            } else {
                throw new Error(`未知水平方向: ${direction}`);
            }
        } else {
            throw new Error(`未知折叠轴向: ${axis}`);
        }

        // 规范化包围盒原点归零
        const xs = this.squares.map(sq => sq.x);
        const ys = this.squares.map(sq => sq.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        for (const sq of this.squares) {
            sq.x -= minX;
            sq.y -= minY;
        }

        // 整理每个位置方格的 Z 轴相对序号 (0..k-1)
        const cellMap = {};
        for (const sq of this.squares) {
            const key = `${sq.x},${sq.y}`;
            if (!cellMap[key]) cellMap[key] = [];
            cellMap[key].push(sq);
        }
        for (const key in cellMap) {
            cellMap[key].sort((a, b) => a.z - b.z);
            cellMap[key].forEach((sq, idx) => {
                sq.z = idx;
            });
        }

        this.history.push({
            squares: prevSquares,
            action: { axis, line, direction, desc }
        });
        this.redoStack = [];

        return this.getThickness();
    }

    canUndo() {
        return this.history.length > 0;
    }

    undo() {
        if (!this.canUndo()) return null;
        const last = this.history.pop();
        this.redoStack.push({
            squares: this.cloneState(),
            action: last.action
        });
        this.squares = last.squares;
        return this.getThickness();
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    redo() {
        if (!this.canRedo()) return null;
        const next = this.redoStack.pop();
        this.history.push({
            squares: this.cloneState(),
            action: next.action
        });
        this.squares = next.squares;
        return this.getThickness();
    }
}

// 导出或挂载到全局
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FoldEngine };
} else {
    window.FoldEngine = FoldEngine;
}
