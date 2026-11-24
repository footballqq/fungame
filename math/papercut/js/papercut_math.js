// codex: 2026-11-24 升级核心几何与状态管理引擎，支持动态切换任意边长 N (2..25) 与对称提示匹配

/**
 * PaperCutEngine：管理 N×N 正方形纸片的剪切状态、合法性校验、面积统计与撤销栈。
 * 坐标系约定：row ∈ [0, N-1]（自上而下），col ∈ [0, N-1]（自左而右），size ∈ [1, N-1]。
 */
class PaperCutEngine {
    constructor(boardSize = 11) {
        this.setBoardSize(boardSize);
    }

    /**
     * 动态切换棋盘边长 N（重置当前画板与撤销历史）
     */
    setBoardSize(boardSize) {
        const n = Math.max(2, Math.min(25, parseInt(boardSize, 10) || 11));
        this.boardSize = n;
        this.totalCells = n * n;
        this.maxPieceSize = n - 1;
        this.pieces = [];
        this.nextId = 1;
        this.history = [];
        this.grid = this._createEmptyGrid();
    }

    _createEmptyGrid() {
        return Array.from({ length: this.boardSize }, () =>
            Array(this.boardSize).fill(0)
        );
    }

    _rebuildGrid() {
        this.grid = this._createEmptyGrid();
        for (const p of this.pieces) {
            for (let dr = 0; dr < p.size; dr++) {
                for (let dc = 0; dc < p.size; dc++) {
                    this.grid[p.row + dr][p.col + dc] = p.id;
                }
            }
        }
    }

    _pushHistory() {
        this.history.push(this.pieces.map(p => ({ ...p })));
        if (this.history.length > 200) {
            this.history.shift();
        }
    }

    /**
     * 检查在 (row, col) 放置边长为 size 的正方形是否合法。
     */
    canPlace(row, col, size) {
        if (!Number.isInteger(size) || size < 1 || size > this.maxPieceSize) {
            return {
                valid: false,
                reason: `边长必须在 1 到 ${this.maxPieceSize} 厘米之间哦！`
            };
        }
        if (
            row < 0 ||
            col < 0 ||
            row + size > this.boardSize ||
            col + size > this.boardSize
        ) {
            return {
                valid: false,
                reason: `放不下啦！${size}×${size} 的正方形超出了 ${this.boardSize}×${this.boardSize} 纸片边缘。`
            };
        }
        for (let dr = 0; dr < size; dr++) {
            for (let dc = 0; dc < size; dc++) {
                if (this.grid[row + dr][col + dc] !== 0) {
                    return {
                        valid: false,
                        reason: '这里已经有剪好的正方形了，纸片不能重叠哦！'
                    };
                }
            }
        }
        return { valid: true };
    }

    placePiece(row, col, size, recordHistory = true) {
        const check = this.canPlace(row, col, size);
        if (!check.valid) {
            return { ok: false, reason: check.reason };
        }
        if (recordHistory) {
            this._pushHistory();
        }
        const piece = { id: this.nextId++, row, col, size };
        this.pieces.push(piece);
        for (let dr = 0; dr < size; dr++) {
            for (let dc = 0; dc < size; dc++) {
                this.grid[row + dr][col + dc] = piece.id;
            }
        }
        return { ok: true, piece };
    }

    removePieceById(pieceId, recordHistory = true) {
        const idx = this.pieces.findIndex(p => p.id === pieceId);
        if (idx === -1) return { ok: false };
        if (recordHistory) {
            this._pushHistory();
        }
        const [removed] = this.pieces.splice(idx, 1);
        this._rebuildGrid();
        return { ok: true, piece: removed };
    }

    getPieceAt(row, col) {
        if (row < 0 || col < 0 || row >= this.boardSize || col >= this.boardSize) {
            return null;
        }
        const id = this.grid[row][col];
        if (!id) return null;
        return this.pieces.find(p => p.id === id) || null;
    }

    computeDragSquare(startRow, startCol, curRow, curCol) {
        const dr = curRow - startRow;
        const dc = curCol - startCol;
        const rawSize = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
        const size = Math.min(Math.max(rawSize, 1), this.maxPieceSize);
        const row = dr >= 0 ? startRow : startRow - (size - 1);
        const col = dc >= 0 ? startCol : startCol - (size - 1);
        const check = this.canPlace(row, col, size);
        return { row, col, size, valid: check.valid, reason: check.reason || '' };
    }

    undo() {
        if (this.history.length === 0) return false;
        this.pieces = this.history.pop();
        this._rebuildGrid();
        return true;
    }

    reset(recordHistory = false) {
        if (recordHistory && this.pieces.length > 0) {
            this._pushHistory();
        } else if (!recordHistory) {
            this.history = [];
        }
        this.pieces = [];
        this.grid = this._createEmptyGrid();
    }

    loadLayout(pieceList) {
        this.reset(false);
        for (const item of pieceList) {
            this.placePiece(item.row, item.col, item.size, false);
        }
    }

    getStats() {
        let coveredArea = 0;
        const sizeCounts = {};
        for (const p of this.pieces) {
            coveredArea += p.size * p.size;
            sizeCounts[p.size] = (sizeCounts[p.size] || 0) + 1;
        }
        const remainingArea = this.totalCells - coveredArea;
        const progressPercent = Math.round((coveredArea / this.totalCells) * 100);
        return {
            boardSize: this.boardSize,
            pieceCount: this.pieces.length,
            coveredArea,
            remainingArea,
            totalCells: this.totalCells,
            progressPercent,
            isComplete: remainingArea === 0 && this.pieces.length > 0,
            sizeCounts
        };
    }

    static transformPiece(p, symmetryIdx, boardSize = 11) {
        const { row, col, size } = p;
        let r = row;
        let c = col;
        if (symmetryIdx >= 4) {
            c = boardSize - c - size;
        }
        const rot = symmetryIdx % 4;
        for (let i = 0; i < rot; i++) {
            const nextR = c;
            const nextC = boardSize - r - size;
            r = nextR;
            c = nextC;
        }
        return { row: r, col: c, size };
    }

    findCompatibleOptimalNextStep(baseSolution) {
        for (let sym = 0; sym < 8; sym++) {
            const transformed = baseSolution.map(p =>
                PaperCutEngine.transformPiece(p, sym, this.boardSize)
            );
            const allMatch = this.pieces.every(placed =>
                transformed.some(
                    t =>
                        t.row === placed.row &&
                        t.col === placed.col &&
                        t.size === placed.size
                )
            );
            if (allMatch) {
                const next = transformed.find(
                    t =>
                        !this.pieces.some(
                            placed =>
                                placed.row === t.row &&
                                placed.col === t.col &&
                                placed.size === t.size
                        )
                );
                if (next) return next;
            }
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaperCutEngine };
} else {
    window.PaperCutEngine = PaperCutEngine;
}
