// codex: 2026-08-10 Support explicit-player simulation so AI search cannot undo real history.
class BridgItGame {
    /**
     * @param {number} R Number of Red rows (3 to 8)
     * @param {number} C Number of Red columns (4 to 9)
     */
    constructor(R = 3, C = 4) {
        this.R = R;
        this.C = C;

        this.blueEdges = {}; // key -> { id, type, r, c, owner }
        this.redEdges = {};   // key -> { id, type, r, c, owner }

        this.blueToRedMap = {};
        this.redToBlueMap = {};

        this.history = []; // [{ player, edgeId }]
        this.currentPlayer = 'blue'; // 'blue' (moves first, top-to-bottom) or 'red' (left-to-right)
        this.winner = null;

        this._initBoard();
    }

    _initBoard() {
        const { R, C } = this;

        // Blue edges: (R+1) rows x (C-1) cols grid
        // bv_{r}_{c}: 0<=r<R, 0<=c<C-1 (connects Blue (r,c) and (r+1,c))
        // bh_{r}_{c}: 0<=r<=R, 0<=c<C-2 (connects Blue (r,c) and (r,c+1))
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C - 1; c++) {
                const id = `bv_${r}_${c}`;
                this.blueEdges[id] = { id, type: 'bv', r, c, owner: null };
            }
        }
        for (let r = 0; r <= R; r++) {
            for (let c = 0; c < C - 2; c++) {
                const id = `bh_${r}_${c}`;
                this.blueEdges[id] = { id, type: 'bh', r, c, owner: null };
            }
        }

        // Red edges: R rows x C cols grid
        // rh_{r}_{c}: 0<=r<R, 0<=c<C-1 (connects Red (r,c) and (r,c+1))
        // rv_{r}_{c}: 0<=r<R-1, 0<=c<C (connects Red (r,c) and (r+1,c))
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C - 1; c++) {
                const id = `rh_${r}_${c}`;
                this.redEdges[id] = { id, type: 'rh', r, c, owner: null };
            }
        }
        for (let r = 0; r < R - 1; r++) {
            for (let c = 0; c < C; c++) {
                const id = `rv_${r}_${c}`;
                this.redEdges[id] = { id, type: 'rv', r, c, owner: null };
            }
        }

        // Intersection Mappings
        // 1. Red horizontal rh_{r}_{c} <-> Blue vertical bv_{r}_{c}
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C - 1; c++) {
                const rId = `rh_${r}_${c}`;
                const bId = `bv_${r}_${c}`;
                this.redToBlueMap[rId] = bId;
                this.blueToRedMap[bId] = rId;
            }
        }
        // 2. Red vertical rv_{r}_{c} (c in 1..C-2) <-> Blue horizontal bh_{r+1}_{c-1}
        for (let r = 0; r < R - 1; r++) {
            for (let c = 1; c < C - 1; c++) {
                const rId = `rv_${r}_${c}`;
                const bId = `bh_${r + 1}_${c - 1}`;
                this.redToBlueMap[rId] = bId;
                this.blueToRedMap[bId] = rId;
            }
        }
    }

    /**
     * Get valid available edges for a specific color
     * @param {string} color 'blue' or 'red'
     * @returns {Array<string>} list of edge IDs
     */
    getValidMoves(color = this.currentPlayer) {
        if (this.winner) return [];
        const valid = [];
        if (color === 'blue') {
            for (const id in this.blueEdges) {
                if (this.blueEdges[id].owner !== null) continue;
                const rId = this.blueToRedMap[id];
                if (rId && this.redEdges[rId].owner === 'red') continue;
                valid.push(id);
            }
        } else {
            for (const id in this.redEdges) {
                if (this.redEdges[id].owner !== null) continue;
                const bId = this.redToBlueMap[id];
                if (bId && this.blueEdges[bId].owner === 'blue') continue;
                valid.push(id);
            }
        }
        return valid;
    }

    /**
     * Execute move
     * @param {string} edgeId 
     * @returns {boolean} success
     */
    makeMove(edgeId, player = this.currentPlayer) {
        if (this.winner) return false;
        const color = player;
        if (color !== 'blue' && color !== 'red') return false;
        const validMoves = this.getValidMoves(color);
        if (!validMoves.includes(edgeId)) return false;

        if (color === 'blue') {
            this.blueEdges[edgeId].owner = 'blue';
        } else {
            this.redEdges[edgeId].owner = 'red';
        }

        this.history.push({ player: color, edgeId });
        this.winner = this.checkWinner();
        if (!this.winner) {
            this.currentPlayer = color === 'blue' ? 'red' : 'blue';
        }
        return true;
    }

    /**
     * Undo last N moves
     * @param {number} steps default 1
     */
    undo(steps = 1) {
        for (let i = 0; i < steps; i++) {
            if (this.history.length === 0) break;
            const last = this.history.pop();
            if (last.player === 'blue') {
                this.blueEdges[last.edgeId].owner = null;
            } else {
                this.redEdges[last.edgeId].owner = null;
            }
            this.currentPlayer = last.player;
            this.winner = null;
        }
    }

    /**
     * Check if either player has won using BFS
     * @returns {string|null} 'blue', 'red' or null
     */
    checkWinner() {
        const { R, C } = this;

        // BFS Blue: top row (r=0) to bottom row (r=R)
        const queueB = [];
        const visitedB = new Set();
        for (let c = 0; c < C - 1; c++) {
            const key = `0_${c}`;
            visitedB.add(key);
            queueB.push({ r: 0, c });
        }

        while (queueB.length > 0) {
            const { r, c } = queueB.shift();
            if (r === R) return 'blue';

            // Up: bv_{r-1}_{c}
            if (r > 0 && this.blueEdges[`bv_${r - 1}_${c}`]?.owner === 'blue') {
                const k = `${r - 1}_${c}`;
                if (!visitedB.has(k)) { visitedB.add(k); queueB.push({ r: r - 1, c }); }
            }
            // Down: bv_{r}_{c}
            if (r < R && this.blueEdges[`bv_${r}_${c}`]?.owner === 'blue') {
                const k = `${r + 1}_${c}`;
                if (!visitedB.has(k)) { visitedB.add(k); queueB.push({ r: r + 1, c }); }
            }
            // Left: bh_{r}_{c-1}
            if (c > 0 && this.blueEdges[`bh_${r}_${c - 1}`]?.owner === 'blue') {
                const k = `${r}_${c - 1}`;
                if (!visitedB.has(k)) { visitedB.add(k); queueB.push({ r, c: c - 1 }); }
            }
            // Right: bh_{r}_{c}
            if (c < C - 2 && this.blueEdges[`bh_${r}_${c}`]?.owner === 'blue') {
                const k = `${r}_${c + 1}`;
                if (!visitedB.has(k)) { visitedB.add(k); queueB.push({ r, c: c + 1 }); }
            }
        }

        // BFS Red: left col (c=0) to right col (c=C-1)
        const queueR = [];
        const visitedR = new Set();
        for (let r = 0; r < R; r++) {
            const key = `${r}_0`;
            visitedR.add(key);
            queueR.push({ r, c: 0 });
        }

        while (queueR.length > 0) {
            const { r, c } = queueR.shift();
            if (c === C - 1) return 'red';

            // Up: rv_{r-1}_{c}
            if (r > 0 && this.redEdges[`rv_${r - 1}_${c}`]?.owner === 'red') {
                const k = `${r - 1}_${c}`;
                if (!visitedR.has(k)) { visitedR.add(k); queueR.push({ r: r - 1, c }); }
            }
            // Down: rv_{r}_{c}
            if (r < R - 1 && this.redEdges[`rv_${r}_${c}`]?.owner === 'red') {
                const k = `${r + 1}_${c}`;
                if (!visitedR.has(k)) { visitedR.add(k); queueR.push({ r: r + 1, c }); }
            }
            // Left: rh_{r}_{c-1}
            if (c > 0 && this.redEdges[`rh_${r}_${c - 1}`]?.owner === 'red') {
                const k = `${r}_${c - 1}`;
                if (!visitedR.has(k)) { visitedR.add(k); queueR.push({ r, c: c - 1 }); }
            }
            // Right: rh_{r}_{c}
            if (c < C - 1 && this.redEdges[`rh_${r}_${c}`]?.owner === 'red') {
                const k = `${r}_${c + 1}`;
                if (!visitedR.has(k)) { visitedR.add(k); queueR.push({ r, c: c + 1 }); }
            }
        }

        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BridgItGame };
}
