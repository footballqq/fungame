// codex: 2026-08-10 用预存双树分解实现无博弈搜索的 Lehman 响应策略。
class LehmanPairingStrategy {
    static getMove(game, validMoves) {
        const plan = this._getPlan(game.R, game.C);
        if (!plan) return null;

        if (game.history.length === 0) {
            return validMoves.includes(plan.openingMove) ? plan.openingMove : null;
        }
        if (game.history[0].player !== 'blue' || game.history[0].edgeId !== plan.openingMove) {
            return null;
        }

        const replay = this._replayHistory(game, plan);
        if (!replay || !replay.response) return null;
        return validMoves.includes(replay.response.edgeId) ? replay.response.edgeId : null;
    }

    static hasPlan(rows, columns) {
        return Boolean(this._getPlan(rows, columns));
    }

    static _replayHistory(game, plan) {
        const state = { treeOne: new Set(plan.treeOne), treeTwo: new Set(plan.treeTwo) };
        for (let index = 1; index < game.history.length; index += 2) {
            const redMove = game.history[index];
            if (!redMove || redMove.player !== 'red') return null;
            const response = this._findResponse(state, redMove.edgeId, plan);
            if (!response) return null;

            const blueMove = game.history[index + 1];
            if (!blueMove) return { response };
            if (blueMove.player !== 'blue' || blueMove.edgeId !== response.edgeId) return null;
            this._applyResponse(state, response);
        }
        return null;
    }

    static _findResponse(state, redEdgeId, plan) {
        const blockedBlueEdge = this._crossingBlueEdge(redEdgeId, plan.rows, plan.columns);
        if (!blockedBlueEdge) {
            const boundaryEdge = this._boundaryResponse(redEdgeId, plan.rows, plan.columns);
            return boundaryEdge ? { edgeId: boundaryEdge, repair: null } : null;
        }

        const inFirst = state.treeOne.has(blockedBlueEdge);
        const inSecond = state.treeTwo.has(blockedBlueEdge);
        if (inFirst === inSecond) return null;

        const brokenTree = inFirst ? state.treeOne : state.treeTwo;
        const replacementTree = inFirst ? state.treeTwo : state.treeOne;
        const component = this._reachableVertices(brokenTree, blockedBlueEdge, plan.rows, plan.columns);

        for (const edgeId of replacementTree) {
            if (brokenTree.has(edgeId)) continue;
            const [from, to] = this._edgeVertices(edgeId, plan.rows, plan.columns);
            if (component.has(from) !== component.has(to)) {
                return { edgeId, repair: { blockedBlueEdge, brokenTree: inFirst ? 'treeOne' : 'treeTwo' } };
            }
        }
        return null;
    }

    static _applyResponse(state, response) {
        if (!response.repair) return;
        const brokenTree = state[response.repair.brokenTree];
        brokenTree.delete(response.repair.blockedBlueEdge);
        brokenTree.add(response.edgeId);
    }

    static _reachableVertices(tree, removedEdge, rows, columns) {
        const [start] = this._edgeVertices(removedEdge, rows, columns);
        const seen = new Set([start]);
        const queue = [start];
        for (let head = 0; head < queue.length; head++) {
            const current = queue[head];
            for (const edgeId of tree) {
                if (edgeId === removedEdge) continue;
                const [from, to] = this._edgeVertices(edgeId, rows, columns);
                const next = from === current ? to : (to === current ? from : null);
                if (next !== null && !seen.has(next)) {
                    seen.add(next);
                    queue.push(next);
                }
            }
        }
        return seen;
    }

    static _edgeVertices(edgeId, rows, columns) {
        const [kind, rowText, columnText] = edgeId.split('_');
        const row = Number(rowText);
        const column = Number(columnText);
        const point = (pointRow, pointColumn) => {
            if (pointRow === 0) return 'top';
            if (pointRow === rows) return 'bottom';
            return `${pointRow}:${pointColumn}`;
        };
        if (kind === 'bv') return [point(row, column), point(row + 1, column)];
        return [point(row, column), point(row, column + 1)];
    }

    static _crossingBlueEdge(redEdgeId, rows, columns) {
        const [kind, rowText, columnText] = redEdgeId.split('_');
        const row = Number(rowText);
        const column = Number(columnText);
        if (kind === 'rh') return `bv_${row}_${column}`;
        if (kind === 'rv' && column > 0 && column < columns - 1) return `bh_${row + 1}_${column - 1}`;
        return null;
    }

    static _boundaryResponse(redEdgeId, rows, columns) {
        const [kind, rowText, columnText] = redEdgeId.split('_');
        const row = Number(rowText);
        const column = Number(columnText);
        if (kind !== 'rv') return null;
        if (column === 0) return `bh_0_${row}`;
        if (column === columns - 1) return `bh_${rows}_${row}`;
        return null;
    }

    static _getPlan(rows, columns) {
        return this.PLANS[`${rows}x${columns}`] || null;
    }
}

LehmanPairingStrategy.PLANS = {
    '3x4': {
        rows: 3, columns: 4, openingMove: 'bv_2_0',
        treeOne: 'bv_2_0 bv_1_1 bv_0_2 bv_2_2 bh_2_0 bv_0_0 bh_1_1'.split(' '),
        treeTwo: 'bv_2_0 bv_0_1 bv_1_0 bv_1_2 bv_2_1 bh_1_0 bh_2_1'.split(' ')
    },
    '4x5': {
        rows: 4, columns: 5, openingMove: 'bv_3_0',
        treeOne: 'bv_3_0 bv_2_3 bv_3_2 bv_0_2 bh_2_1 bv_3_1 bh_3_2 bh_1_1 bh_1_2 bv_1_0 bv_1_1 bv_2_0 bv_0_0'.split(' '),
        treeTwo: 'bv_3_0 bv_0_1 bv_0_3 bv_1_2 bv_1_3 bv_2_1 bv_2_2 bv_3_3 bh_1_0 bh_2_0 bh_2_2 bh_3_0 bh_3_1'.split(' ')
    },
    '5x6': {
        rows: 5, columns: 6, openingMove: 'bv_4_0',
        treeOne: 'bv_4_0 bv_2_1 bh_3_3 bh_4_2 bv_0_0 bh_1_3 bv_2_2 bh_1_1 bh_2_3 bv_4_1 bv_0_1 bv_1_0 bh_4_3 bh_1_2 bv_3_1 bh_2_0 bv_1_2 bv_4_2 bv_3_3 bh_3_0 bv_1_4'.split(' '),
        treeTwo: 'bv_4_0 bv_0_2 bv_0_3 bv_0_4 bv_1_1 bv_1_3 bv_2_0 bv_2_3 bv_2_4 bv_3_0 bv_3_2 bv_3_4 bv_4_3 bv_4_4 bh_1_0 bh_2_1 bh_2_2 bh_3_1 bh_3_2 bh_4_0 bh_4_1'.split(' ')
    },
    '6x7': {
        rows: 6, columns: 7, openingMove: 'bv_5_0',
        treeOne: 'bv_5_0 bv_5_5 bh_2_0 bh_4_4 bh_5_0 bv_4_3 bv_4_1 bv_1_4 bh_3_0 bv_2_3 bv_2_5 bv_1_1 bh_3_4 bv_3_3 bv_0_1 bh_5_3 bh_5_2 bh_3_3 bv_4_4 bv_1_2 bv_3_0 bh_1_2 bh_1_0 bv_0_3 bh_4_2 bh_3_1 bv_2_1 bh_5_1 bh_1_4 bh_4_0 bv_1_5'.split(' '),
        treeTwo: 'bv_5_0 bv_0_0 bv_0_2 bv_0_4 bv_0_5 bv_1_0 bv_1_3 bv_2_0 bv_2_2 bv_2_4 bv_3_1 bv_3_2 bv_3_4 bv_3_5 bv_4_0 bv_4_2 bv_4_5 bv_5_1 bv_5_2 bv_5_3 bv_5_4 bh_1_1 bh_1_3 bh_2_1 bh_2_2 bh_2_3 bh_2_4 bh_3_2 bh_4_1 bh_4_3 bh_5_4'.split(' ')
    },
    '7x8': {
        rows: 7, columns: 8, openingMove: 'bv_6_0',
        treeOne: 'bv_6_0 bh_6_2 bh_3_3 bv_6_4 bv_0_5 bv_2_1 bv_0_0 bh_2_0 bv_2_5 bh_5_5 bh_3_5 bv_0_3 bh_2_4 bh_4_4 bv_1_6 bv_5_0 bh_1_3 bh_4_0 bh_2_2 bv_0_1 bh_6_5 bv_4_6 bv_4_3 bv_6_5 bv_1_4 bh_1_2 bh_4_2 bv_2_3 bv_4_5 bv_6_2 bv_5_4 bv_1_2 bv_0_6 bv_2_2 bv_1_0 bv_3_3 bh_4_1 bv_6_1 bh_5_4 bv_5_3 bv_3_0 bv_5_1 bv_4_2'.split(' '),
        treeTwo: 'bv_6_0 bv_0_2 bv_0_4 bv_1_1 bv_1_3 bv_1_5 bv_2_0 bv_2_4 bv_2_6 bv_3_1 bv_3_2 bv_3_4 bv_3_5 bv_3_6 bv_4_0 bv_4_1 bv_4_4 bv_5_2 bv_5_5 bv_5_6 bv_6_3 bv_6_6 bh_1_0 bh_1_1 bh_1_4 bh_1_5 bh_2_1 bh_2_3 bh_2_5 bh_3_0 bh_3_1 bh_3_2 bh_3_4 bh_4_3 bh_4_5 bh_5_0 bh_5_1 bh_5_2 bh_5_3 bh_6_0 bh_6_1 bh_6_3 bh_6_4'.split(' ')
    },
    '8x9': {
        rows: 8, columns: 9, openingMove: 'bv_7_0',
        treeOne: 'bv_7_0 bh_7_0 bv_0_1 bh_1_4 bh_3_2 bv_1_6 bv_4_1 bh_5_2 bh_6_6 bv_3_2 bh_7_4 bh_7_1 bv_7_4 bh_6_5 bv_7_3 bv_7_6 bv_3_3 bh_4_3 bh_3_3 bh_5_1 bv_0_4 bv_3_6 bv_2_5 bh_7_6 bh_5_5 bh_5_3 bv_6_4 bv_6_0 bh_2_1 bv_2_1 bv_2_4 bv_5_7 bv_0_2 bh_6_3 bv_4_3 bh_5_0 bv_6_2 bv_0_6 bv_4_5 bh_3_1 bh_2_4 bh_4_0 bv_1_2 bh_4_6 bh_5_6 bv_4_6 bv_2_7 bh_6_1 bv_1_0 bv_0_7 bv_1_3 bh_2_0 bh_1_2 bv_3_5 bv_5_4 bh_2_6 bh_3_0'.split(' '),
        treeTwo: 'bv_7_0 bv_0_0 bv_0_3 bv_0_5 bv_1_1 bv_1_4 bv_1_5 bv_1_7 bv_2_0 bv_2_2 bv_2_3 bv_2_6 bv_3_0 bv_3_1 bv_3_4 bv_3_7 bv_4_0 bv_4_2 bv_4_4 bv_4_7 bv_5_0 bv_5_1 bv_5_2 bv_5_3 bv_5_5 bv_5_6 bv_6_1 bv_6_3 bv_6_5 bv_6_6 bv_6_7 bv_7_1 bv_7_2 bv_7_5 bv_7_7 bh_1_0 bh_1_1 bh_1_3 bh_1_5 bh_1_6 bh_2_2 bh_2_3 bh_2_5 bh_3_4 bh_3_5 bh_3_6 bh_4_1 bh_4_2 bh_4_4 bh_4_5 bh_5_4 bh_6_0 bh_6_2 bh_6_4 bh_7_2 bh_7_3 bh_7_5'.split(' ')
    }
};

if (typeof module !== 'undefined') module.exports = { LehmanPairingStrategy };
