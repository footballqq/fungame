// codex: 2026-11-24 升级核心几何引擎，原生支持「自由剪纸 (1..N-1)」与「限尺拼图 (1..K)」一体两面双模式

/**
 * PaperCutEngine：管理 N×N 正方形纸片的剪切/拼接状态、最大尺寸上限 K、合法性校验与撤销栈。
 * - 自由剪纸模式（papercut）：maxPieceSize = boardSize - 1
 * - 限尺拼图模式（tiling）：  maxPieceSize = K (1 <= K <= boardSize - 1)
 */
class PaperCutEngine {
    constructor(boardSize = 11, maxPieceSize = null) {
        this.configure(boardSize, maxPieceSize);
    }

    /**
     * 配置棋盘边长 N 与最大允许方块边长 K
     */
    configure(boardSize, maxPieceSize = null) {
        const n = Math.max(2, Math.min(25, parseInt(boardSize, 10) || 11));
        const maxK =
            maxPieceSize === null || maxPieceSize === undefined
                ? n - 1
                : Math.max(1, Math.min(n - 1, parseInt(maxPieceSize, 10) || (n - 1)));
        this.boardSize = n;
        this.totalCells = n * n;
        this.maxPieceSize = maxK;
        this.pieces = [];
        this.nextId = 1;
        this.history = [];
        this.grid = this._createEmptyGrid();
    }

    setBoardSize(boardSize, maxPieceSize = null) {
        this.configure(boardSize, maxPieceSize);
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

    canPlace(row, col, size) {
        if (!Number.isInteger(size) || size < 1 || size > this.maxPieceSize) {
            return {
                valid: false,
                reason: `当前模式允许的边长范围是 1 ～ ${this.maxPieceSize} 厘米哦！`
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
                        reason: '这里已经有正方形了，纸片不能重叠哦！'
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
            maxPieceSize: this.maxPieceSize,
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
